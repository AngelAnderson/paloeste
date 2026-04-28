import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseAdminClient()
  const { to, body, channel = 'sms' } = await req.json()

  if (!to || !body) {
    return NextResponse.json({ error: 'Missing to or body' }, { status: 400 })
  }

  // Normalize phone to E.164
  const phone = to.replace(/[^+\d]/g, '')
  const phoneE164 = phone.startsWith('+') ? phone : `+1${phone}`

  // Find or create conversation
  // Note: same contact may have separate WA + SMS conversations. We pick the one matching
  // the requested channel; if downgrade fires later, we re-find/create one for the new channel.
  let conversationId: string
  const { data: existing } = await supabase
    .from('conversations')
    .select('id, contact, channel')
    .eq('contact', phoneE164)
    .eq('line', '7711')
    .order('last_message_at', { ascending: false })
    .limit(1)
    .single()

  if (existing) {
    conversationId = existing.id
  } else {
    // Ensure contact exists
    const { data: existingContact } = await supabase
      .from('contacts')
      .select('id')
      .eq('phone_e164', phoneE164)
      .single()

    let contactId: string
    if (existingContact) {
      contactId = existingContact.id
    } else {
      const { data: newContact, error: contactErr } = await supabase
        .from('contacts')
        .insert({ phone_e164: phoneE164 })
        .select('id')
        .single()
      if (contactErr) {
        return NextResponse.json({ error: 'Failed to create contact: ' + contactErr.message }, { status: 500 })
      }
      contactId = newContact.id
    }

    // Create conversation
    const { data: newConvo, error: convoErr } = await supabase
      .from('conversations')
      .insert({
        contact: phoneE164,
        contact_id: contactId,
        channel: channel === 'whatsapp' ? 'whatsapp' : 'sms',
        line: '7711',
        status: 'human',
        needs_human: false,
        message_count: 0,
        last_message_at: new Date().toISOString(),
      })
      .select('id')
      .single()
    if (convoErr) {
      return NextResponse.json({ error: 'Failed to create conversation: ' + convoErr.message }, { status: 500 })
    }
    conversationId = newConvo.id
  }

  // Send via existing send-message logic (Twilio)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const botNumber = process.env.TWILIO_FROM_NUMBER || '+17874177711'

  if (!twilioSid || !twilioToken) {
    return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 })
  }

  // Apr 28 2026 fix: WA messages outside the 24h session window fail with Twilio 63016.
  // Check the most recent inbound from this contact; if >24h, downgrade WA → SMS automatically
  // and surface the fallback in the response so the UI can show a toast.
  let effectiveChannel: 'sms' | 'whatsapp' = channel === 'whatsapp' ? 'whatsapp' : 'sms'
  let fallbackReason: string | null = null

  if (effectiveChannel === 'whatsapp') {
    const { data: lastInbound } = await supabase
      .from('messages')
      .select('created_at')
      .eq('conversation_id', conversationId)
      .eq('direction', 'inbound')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (lastInbound?.created_at) {
      const ageMs = Date.now() - new Date(lastInbound.created_at).getTime()
      if (ageMs > 24 * 60 * 60 * 1000) {
        effectiveChannel = 'sms'
        const days = Math.floor(ageMs / (24 * 60 * 60 * 1000))
        fallbackReason = `Ventana de WhatsApp cerrada (último inbound hace ${days}d). Enviado por SMS.`
      }
    } else {
      // No prior inbound at all → window never opened → SMS-only
      effectiveChannel = 'sms'
      fallbackReason = 'Sin mensajes inbound previos. Enviado por SMS.'
    }
  }

  const isWhatsApp = effectiveChannel === 'whatsapp'
  const fromNumber = isWhatsApp ? `whatsapp:${botNumber}` : botNumber
  const toNumber = isWhatsApp ? `whatsapp:${phoneE164}` : phoneE164

  // If the conversation we picked was a different channel than effectiveChannel, the FK
  // on messages will fail. Find/create a conversation matching the post-fallback channel.
  if (existing && existing.channel !== effectiveChannel) {
    const { data: matchingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact', phoneE164)
      .eq('channel', effectiveChannel)
      .eq('line', '7711')
      .maybeSingle()

    if (matchingConv?.id) {
      conversationId = matchingConv.id
    } else {
      const { data: waConv } = await supabase
        .from('conversations')
        .select('contact_id')
        .eq('id', conversationId)
        .maybeSingle()
      const { data: newConv, error: newConvErr } = await supabase
        .from('conversations')
        .insert({
          contact: phoneE164,
          contact_id: waConv?.contact_id ?? null,
          channel: effectiveChannel,
          line: '7711',
          status: 'human',
          needs_human: false,
          message_count: 0,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      if (newConvErr) {
        return NextResponse.json({ error: 'Failed to create fallback conversation: ' + newConvErr.message }, { status: 500 })
      }
      conversationId = newConv.id
    }
  }

  const sendViaTwilio = async (sendFrom: string, sendTo: string) => {
    const params = new URLSearchParams()
    params.set('From', sendFrom)
    params.set('To', sendTo)
    params.set('Body', body)
    return fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          'Authorization': 'Basic ' + Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64'),
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )
  }

  let twilioRes = await sendViaTwilio(fromNumber, toNumber)

  // Late fallback: if WA still fails with 63016/63017 (outside-window codes), retry via SMS
  if (!twilioRes.ok && isWhatsApp) {
    const errData = await twilioRes.clone().json().catch(() => ({}))
    const twErrCode = errData?.code
    if (twErrCode === 63016 || twErrCode === 63017) {
      effectiveChannel = 'sms'
      fallbackReason = `WhatsApp rechazado (código ${twErrCode}). Reintentado por SMS.`
      twilioRes = await sendViaTwilio(botNumber, phoneE164)
    }
  }

  if (!twilioRes.ok) {
    const errData = await twilioRes.json().catch(() => ({}))
    const code = errData?.code ?? null
    const message = errData?.message ?? 'Twilio send failed'
    return NextResponse.json({
      error: message,
      details: errData,
      twilio_code: code,
      attempted_channel: effectiveChannel,
    }, { status: 500 })
  }

  const twilioData = await twilioRes.json()

  // Use post-fallback channel for log + response (effectiveChannel may have flipped)
  const finalIsWhatsApp = effectiveChannel === 'whatsapp'
  const finalFromNumber = finalIsWhatsApp ? `whatsapp:${botNumber}` : botNumber
  const finalToNumber = finalIsWhatsApp ? `whatsapp:${phoneE164}` : phoneE164

  // Log the message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    direction: 'outbound',
    body,
    channel: effectiveChannel,
    from: finalFromNumber,
    to: finalToNumber,
    source: 'admin',
    intent: 'outbound_pitch',
    message_sid: twilioData.sid || null,
    conversation_line: '7711',
  })

  // Update conversation
  const manualUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      manual_mode_until: manualUntil,
      status: 'human',
      message_count: existing ? undefined : 1,
    })
    .eq('id', conversationId)

  // Auto-track in pipeline: if this phone matches a business, ensure a prospect exists
  const { data: matchedPlace } = await supabase
    .from('places')
    .select('id, name, category')
    .eq('phone', phoneE164)
    .eq('status', 'open')
    .limit(1)
    .maybeSingle()

  let prospectId: string | null = null
  if (matchedPlace) {
    // Check if prospect already exists for this place
    const { data: existingProspect } = await supabase
      .from('prospects')
      .select('id')
      .eq('place_id', matchedPlace.id)
      .limit(1)
      .maybeSingle()

    if (existingProspect) {
      // Update last_contact_at
      await supabase
        .from('prospects')
        .update({ last_contact_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', existingProspect.id)
      prospectId = existingProspect.id
    } else {
      // Auto-create prospect
      const { data: newProspect } = await supabase
        .from('prospects')
        .insert({
          place_id: matchedPlace.id,
          business_name: matchedPlace.name,
          contact_phone: phoneE164,
          stage: 'contacted',
          last_contact_at: new Date().toISOString(),
          notes: `Auto-created from admin outbound ${channel} message.`,
          next_action: 'Esperar respuesta. Follow up en 7 días si no contesta.',
          next_action_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
        })
        .select('id')
        .maybeSingle()
      prospectId = newProspect?.id || null
    }
  }

  return NextResponse.json({
    success: true,
    sid: twilioData.sid,
    conversationId,
    prospectId,
    channel_used: effectiveChannel,
    fallback_reason: fallbackReason,
  })
}
