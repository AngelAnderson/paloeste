import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  // Verify admin session
  const supabase = await createSupabaseAdminClient()

  const { conversationId, body, to, channel } = await req.json()

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

  return NextResponse.json({
    success: true,
    sid: twilioData.sid,
    channel_used: effectiveChannel,
    fallback_reason: fallbackReason,
  })
}
