import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

// 30 oct 2026: el primer mensaje a quien no ha escrito sale con esta plantilla de WhatsApp, o no
// sale. TWILIO_WA_PLANTILLA_SID solo se pone cuando Meta la aprueba. Nunca cae a SMS en frío.
const textoDePlantilla = (nombre: string) =>
  `Saludos ${nombre}, soy Angel Anderson, de CaboRojo.com. Quiero cuadrar algo contigo. ¿Te puedo escribir por aquí?`

export async function POST(req: NextRequest) {
  const denied = await requireAdmin(req)
  if (denied) return denied
  const supabase = await createSupabaseAdminClient()
  const { to, body: textoEscrito, channel = 'whatsapp', name } = await req.json()

  if (!to || !textoEscrito) {
    return NextResponse.json({ error: 'Missing to or body' }, { status: 400 })
  }

  // Normalize phone to E.164
  const phone = to.replace(/[^+\d]/g, '')
  const phoneE164 = phone.startsWith('+') ? phone : `+1${phone}`
  const contactForms = [phoneE164, `whatsapp:${phoneE164}`]
  const contactDelCanal = channel === 'whatsapp' ? `whatsapp:${phoneE164}` : phoneE164

  const { data: lastInbound } = await supabase
    .from('messages')
    .select('created_at, channel')
    .in('from', contactForms)
    .eq('direction', 'inbound')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (channel !== 'whatsapp' && !lastInbound) {
    return NextResponse.json({
      error: 'Esta persona nunca le ha escrito al 7711. No salió nada. Usa WhatsApp para enviarle la plantilla.',
    }, { status: 409 })
  }

  const ventanaAbierta = !!lastInbound
    && lastInbound.channel === 'whatsapp'
    && Date.now() - new Date(lastInbound.created_at).getTime() < 24 * 60 * 60 * 1000
  const usaPlantilla = channel === 'whatsapp' && !ventanaAbierta
  const plantillaSid = process.env.TWILIO_WA_PLANTILLA_SID
  const nombre = typeof name === 'string' ? name.trim().split(/\s+/)[0] : ''

  if (usaPlantilla && !plantillaSid) {
    return NextResponse.json({
      error: 'La plantilla de WhatsApp todavía no está aprobada. No salió nada.',
    }, { status: 409 })
  }
  if (usaPlantilla && !nombre) {
    return NextResponse.json({ error: 'Falta el nombre para la plantilla.' }, { status: 400 })
  }

  const body: string = usaPlantilla ? textoDePlantilla(nombre) : textoEscrito

  // Find or create conversation
  // Note: same contact may have separate WA + SMS conversations. We pick the one matching
  // the requested channel; if downgrade fires later, we re-find/create one for the new channel.
  let conversationId: string
  // 2026-07-27: las conversaciones de WhatsApp guardan contact = 'whatsapp:+1...';
  // buscar solo el número pelado nunca las encontraba, el route creaba una
  // conversación nueva sin inbound y TODO WA se degradaba a SMS ("Sin mensajes
  // inbound previos"). Se buscan ambas formas y gana la del canal pedido.
  const { data: convCandidates } = await supabase
    .from('conversations')
    .select('id, contact, channel, last_message_at')
    .in('contact', contactForms)
    .eq('line', '7711')
    .order('last_message_at', { ascending: false })
    .limit(5)
  const requestedChannel = channel === 'whatsapp' ? 'whatsapp' : 'sms'
  const existing = (convCandidates || []).find((c: any) => c.channel === requestedChannel)
    || (convCandidates || [])[0]
    || null

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
        // Con el prefijo del canal: así el webhook encuentra esta conversación cuando contesten.
        contact: contactDelCanal,
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

  const effectiveChannel: 'sms' | 'whatsapp' = channel === 'whatsapp' ? 'whatsapp' : 'sms'
  const isWhatsApp = effectiveChannel === 'whatsapp'
  const fromNumber = isWhatsApp ? `whatsapp:${botNumber}` : botNumber
  const toNumber = isWhatsApp ? `whatsapp:${phoneE164}` : phoneE164

  // If the conversation we picked was a different channel than effectiveChannel, the FK
  // on messages will fail. Find/create a conversation matching the channel.
  if (existing && existing.channel !== effectiveChannel) {
    // Mismo gotcha del prefijo: la conversación WA vive con contact='whatsapp:+1...'.
    const { data: matchingConvs } = await supabase
      .from('conversations')
      .select('id')
      .in('contact', contactForms)
      .eq('channel', effectiveChannel)
      .eq('line', '7711')
      .order('last_message_at', { ascending: false })
      .limit(1)
    const matchingConv = (matchingConvs || [])[0] || null

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
          contact: contactDelCanal,
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
    if (usaPlantilla) {
      params.set('ContentSid', plantillaSid!)
      params.set('ContentVariables', JSON.stringify({ 1: nombre }))
    } else {
      params.set('Body', body)
    }
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

  const twilioRes = await sendViaTwilio(fromNumber, toNumber)

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

  // Log the message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    direction: 'outbound',
    body,
    channel: effectiveChannel,
    from: fromNumber,
    to: toNumber,
    source: 'admin',
    intent: 'outbound_pitch',
    message_sid: twilioData.sid || null,
    conversation_line: '7711',
  })

  // Update conversation
  // Apr 29 2026 — extended from 2h → 14d. Pitches expect day-scale replies, not hour-scale.
  // Bot has separate sponsor-aware gates (handler.ts) that survive even after this expires.
  const manualUntil = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
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

  // Auto-update relationship last_contact_at if phone matches an active relationship.
  // This is what keeps inbound leads from re-appearing in the daily digest after
  // Angel responds (digest's get_inbound_leads_unanswered reads last_contact_at).
  let { data: matchedRel } = await supabase
    .from('relationships')
    .select('id, tags')
    .eq('contact_phone', phoneE164)
    .eq('active', true)
    .maybeSingle()

  // Apr 29 2026 — if no relationship exists but phone matches a place, auto-create one as prospect.
  // Closes the gap where a pitch to a non-prospect business goes invisible (no Pass 1 nudge possible).
  if (!matchedRel && matchedPlace) {
    const { data: created } = await supabase
      .from('relationships')
      .insert({
        name: matchedPlace.name,
        type: 'prospect',
        place_id: matchedPlace.id,
        contact_phone: phoneE164,
        contact_method: effectiveChannel === 'whatsapp' ? 'whatsapp' : 'sms',
        cadence: 'weekly',
        next_action: 'Esperar respuesta al pitch',
        notes: `Auto-created on outbound ${effectiveChannel} pitch ${new Date().toISOString().slice(0, 10)}.`,
        tags: ['outbound-pitch', 'urgent-follow-up', 'auto-created'],
        active: true,
      })
      .select('id, tags')
      .maybeSingle()
    matchedRel = created
  }

  if (matchedRel) {
    await supabase.rpc('log_relationship_contact', {
      rel_id: matchedRel.id,
      action_text: effectiveChannel === 'whatsapp' ? 'WhatsApp enviado' : 'SMS enviado',
      notes_text: body.slice(0, 200),
      logged_by_val: 'admin_outbound_auto',
    })
    // Apr 29 2026 — tag urgent-follow-up so detect-inbound-lead Pass 1 picks up replies
    await supabase.rpc('tag_relationship_urgent', {
      p_phone: phoneE164,
      p_reason: 'Outbound pitch sent via admin',
    })
  }

  return NextResponse.json({
    success: true,
    sid: twilioData.sid,
    conversationId,
    prospectId,
    relationshipId: matchedRel?.id ?? null,
    channel_used: effectiveChannel,
    plantilla: usaPlantilla,
  })
}
