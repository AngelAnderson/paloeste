import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  // Verify admin session
  const supabase = await createSupabaseAdminClient()

  const payload = await req.json()
  const { body, to, channel } = payload
  let conversationId: string = payload.conversationId

  if (!conversationId || !body || !to) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const twilioSid = process.env.TWILIO_ACCOUNT_SID
  const twilioToken = process.env.TWILIO_AUTH_TOKEN
  const botNumber = process.env.TWILIO_FROM_NUMBER || '+17874177711'

  if (!twilioSid || !twilioToken) {
    return NextResponse.json({ error: 'Twilio credentials not configured' }, { status: 500 })
  }

  // Apr 28 2026 fix: WA messages outside the 24h session window fail with Twilio 63016.
  // Pre-check last_inbound for this conversation; downgrade WA → SMS automatically when stale.
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
      effectiveChannel = 'sms'
      fallbackReason = 'Sin mensajes inbound previos. Enviado por SMS.'
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

  // Determine From/To based on (post-fallback) channel
  const isWhatsApp = effectiveChannel === 'whatsapp'
  const cleanTo = to.replace(/^whatsapp:/, '')
  const fromNumber = isWhatsApp ? `whatsapp:${botNumber}` : botNumber
  const toNumber = isWhatsApp ? `whatsapp:${cleanTo}` : cleanTo

  // FK guard: the message we're about to insert will have channel=effectiveChannel + to=cleanTo,
  // and the FK messages_conversation_fk requires (conversation_contact, channel, line) match
  // conversations(contact, channel, line). If conversationId points at a DIFFERENT-channel
  // conversation (either because of automatic WA→SMS downgrade, or because the user manually
  // picked SMS in the UI from a WA-history thread), the insert fails. Find or create a matching
  // conversation and switch conversationId before send.
  // Apr 29 2026: original condition only caught the auto-downgrade case; UI-selected channel
  // mismatch (Angel clicked SMS on a WA conv) also has to be handled here.
  const { data: currentConv } = await supabase
    .from('conversations')
    .select('channel, contact_id')
    .eq('id', conversationId)
    .maybeSingle()

  if (currentConv && currentConv.channel !== effectiveChannel) {
    const { data: matchingConv } = await supabase
      .from('conversations')
      .select('id')
      .eq('contact', cleanTo)
      .eq('channel', effectiveChannel)
      .eq('line', '7711')
      .maybeSingle()

    if (matchingConv?.id) {
      conversationId = matchingConv.id
    } else {
      const { data: newConv, error: newConvErr } = await supabase
        .from('conversations')
        .insert({
          contact: cleanTo,
          contact_id: currentConv.contact_id ?? null,
          channel: effectiveChannel,
          line: '7711',
          status: 'human',
          needs_human: false,
          message_count: 0,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (newConvErr || !newConv) {
        console.error('[send-message] Failed to create matching-channel conversation:', newConvErr)
      } else {
        conversationId = newConv.id
      }
    }
  }

  let twilioRes = await sendViaTwilio(fromNumber, toNumber)

  // Late fallback: WA fails with 63016/63017 → retry SMS
  if (!twilioRes.ok && isWhatsApp) {
    const errData = await twilioRes.clone().json().catch(() => ({}))
    const twErrCode = errData?.code
    if (twErrCode === 63016 || twErrCode === 63017) {
      effectiveChannel = 'sms'
      fallbackReason = `WhatsApp rechazado (código ${twErrCode}). Reintentado por SMS.`
      twilioRes = await sendViaTwilio(botNumber, cleanTo)
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

  // Log the outbound message in our messages table
  // conversation_contact is a GENERATED column (= "to" for outbound)
  // FK requires (conversation_contact, channel, conversation_line) to match conversations(contact, channel, line)
  // So "to" must be the clean number (no whatsapp: prefix) and channel must match the conversation
  const { error: insertErr } = await supabase.from('messages').insert({
    conversation_id: conversationId,
    conversation_line: '7711',
    direction: 'outbound',
    body,
    channel: effectiveChannel,
    from: botNumber,
    to: cleanTo,
    source: 'admin',
    intent: 'manual_reply',
    message_sid: twilioData.sid || null,
  })

  if (insertErr) {
    console.error('[send-message] DB insert failed:', insertErr)
    return NextResponse.json({
      success: false,
      sid: twilioData.sid,
      error: 'Message sent via Twilio but not saved to DB: ' + insertErr.message,
    }, { status: 500 })
  }

  // Update conversation last_message_at + activate manual mode for 2 hours
  // (bot stays silent while admin is handling this conversation)
  // status enum valid values: bot, human, escalated, closed
  const manualUntil = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
  const { error: updateErr } = await supabase
    .from('conversations')
    .update({
      last_message_at: new Date().toISOString(),
      manual_mode_until: manualUntil,
      status: 'human',
    })
    .eq('id', conversationId)

  if (updateErr) {
    console.error('[send-message] Conversation update failed:', updateErr)
  }

  // Apr 29 2026: auto-log relationship contact + add urgent-follow-up tag.
  // Mirrors /api/admin/send-outbound logic (was missing here, so /admin/inbox sends
  // weren't logged and contacts never got tagged for cron monitoring — bug found today
  // when 5 contributors responded but no WA nudge fired).
  const { data: matchedRel } = await supabase
    .from('relationships')
    .select('id, type, tags')
    .eq('contact_phone', cleanTo)
    .eq('active', true)
    .maybeSingle()

  if (matchedRel) {
    // Log the contact action (updates last_contact_at + writes relationship_history row)
    await supabase.rpc('log_relationship_contact', {
      rel_id: matchedRel.id,
      action_text: effectiveChannel === 'whatsapp' ? 'WhatsApp enviado' : 'SMS enviado',
      notes_text: body.slice(0, 200),
      logged_by_val: 'inbox_send_auto',
    })

    // Add urgent-follow-up tag for not-yet-converted contacts so the cron alerts on response.
    // Skip for `client`/`sponsor` (already converted — too noisy).
    const monitoredTypes = ['inbound_lead', 'prospect', 'partner', 'cold', 'personal']
    if (monitoredTypes.includes(matchedRel.type) && !(matchedRel.tags || []).includes('urgent-follow-up')) {
      const newTags = Array.from(new Set([...(matchedRel.tags || []), 'urgent-follow-up']))
      await supabase.from('relationships').update({ tags: newTags }).eq('id', matchedRel.id)
    }
  }

  return NextResponse.json({
    success: true,
    sid: twilioData.sid,
    channel_used: effectiveChannel,
    fallback_reason: fallbackReason,
    relationshipId: matchedRel?.id ?? null,
  })
}
