import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest) {
  const { conversationId, name, notes } = await req.json()
  if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

  const supabase = await createSupabaseAdminClient()

  // Get the conversation
  const { data: conv } = await supabase
    .from('conversations')
    .select('id, contact, channel, contact_id')
    .eq('id', conversationId)
    .single()

  if (!conv) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

  let contactId = conv.contact_id

  // If no contact linked, create one
  if (!contactId && name) {
    const phone = conv.contact.replace('whatsapp:', '')
    const { data: newContact, error: createErr } = await supabase
      .from('contacts')
      .insert({
        phone_e164: phone,
        phone: phone,
        display_name: name,
        notes_internal: notes || null,
        channel: conv.channel,
      })
      .select('id')
      .single()

    if (createErr) {
      // Contact with this phone might already exist — try to find and update
      const { data: existing } = await supabase
        .from('contacts')
        .select('id')
        .eq('phone_e164', phone)
        .single()

      if (existing) {
        contactId = existing.id
        await supabase
          .from('contacts')
          .update({ display_name: name, notes_internal: notes || null, updated_at: new Date().toISOString() })
          .eq('id', contactId)
      }
    } else if (newContact) {
      contactId = newContact.id
    }

    // Link contact to conversation
    if (contactId) {
      await supabase
        .from('conversations')
        .update({ contact_id: contactId, internal_note: notes || null })
        .eq('id', conversationId)
    }
  } else if (contactId) {
    // Contact exists — update it
    await supabase
      .from('contacts')
      .update({
        display_name: name || null,
        notes_internal: notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId)
  }

  // Always save notes to conversation too (backup)
  await supabase
    .from('conversations')
    .update({ internal_note: notes || null })
    .eq('id', conversationId)

  return NextResponse.json({ success: true, contactId })
}
