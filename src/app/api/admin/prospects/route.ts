import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseAdminClient()
  const body = await req.json()

  const {
    place_id,
    business_name,
    contact_name,
    contact_phone,
    contact_method,
    stage = 'lead',
    proposed_plan,
    proposed_amount_cents,
    notes,
    next_action,
    next_action_date,
  } = body

  if (!business_name && !place_id) {
    return NextResponse.json({ error: 'business_name or place_id required' }, { status: 400 })
  }

  // Auto-populate from places if place_id provided
  let finalName = business_name
  let finalPhone = contact_phone
  if (place_id && (!finalName || !finalPhone)) {
    const { data: place } = await supabase
      .from('places')
      .select('name, phone')
      .eq('id', place_id)
      .single()
    if (place) {
      finalName = finalName || place.name
      finalPhone = finalPhone || place.phone
    }
  }

  const { data, error } = await supabase
    .from('prospects')
    .insert({
      place_id: place_id || null,
      business_name: finalName,
      contact_name: contact_name || null,
      contact_phone: finalPhone || null,
      contact_method: contact_method || null,
      stage,
      proposed_plan: proposed_plan || null,
      proposed_amount_cents: proposed_amount_cents || null,
      notes: notes || null,
      next_action: next_action || null,
      next_action_date: next_action_date || null,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseAdminClient()
  const body = await req.json()
  const { id, ...updates } = body

  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  // If stage is changing, auto-update last_contact_at
  if (updates.stage && !updates.last_contact_at) {
    updates.last_contact_at = new Date().toISOString()
  }

  updates.updated_at = new Date().toISOString()

  const { data, error } = await supabase
    .from('prospects')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
