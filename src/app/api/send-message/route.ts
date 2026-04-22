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

  // Determine From/To based on channel
  const isWhatsApp = channel === 'whatsapp'
  const fromNumber = isWhatsApp ? `whatsapp:${botNumber}` : botNumber
  const toNumber = isWhatsApp && !to.startsWith('whatsapp:') ? `whatsapp:${to}` : to

  // Send via Twilio REST API
  const params = new URLSearchParams()
  params.set('From', fromNumber)
  params.set('To', toNumber)
  params.set('Body', body)

  const twilioRes = await fetch(
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

  if (!twilioRes.ok) {
    const errData = await twilioRes.json().catch(() => ({}))
    return NextResponse.json({ error: 'Twilio send failed', details: errData }, { status: 500 })
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
    channel: channel || 'sms',
    from: isWhatsApp ? botNumber : botNumber,
    to,
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

  return NextResponse.json({ success: true, sid: twilioData.sid })
}
