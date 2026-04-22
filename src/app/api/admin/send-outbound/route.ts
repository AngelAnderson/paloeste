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
  let conversationId: string
  const { data: existing } = await supabase
    .from('conversations')
    .select('id')
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

  const isWhatsApp = channel === 'whatsapp'
  const fromNumber = isWhatsApp ? `whatsapp:${botNumber}` : botNumber
  const toNumber = isWhatsApp ? `whatsapp:${phoneE164}` : phoneE164

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

  // Log the message
  await supabase.from('messages').insert({
    conversation_id: conversationId,
    direction: 'outbound',
    body,
    channel: isWhatsApp ? 'whatsapp' : 'sms',
    from: fromNumber,
    to: toNumber,
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

  return NextResponse.json({ success: true, sid: twilioData.sid, conversationId })
}
