import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const supabase = await createSupabaseAdminClient()
  let q = supabase.from('relationships').select('*').eq('active', true)
  if (type && type !== 'all') q = q.eq('type', type)
  const { data, error } = await q.order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  if (!body.name || !body.type) {
    return NextResponse.json({ error: 'name and type required' }, { status: 400 })
  }
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('relationships')
    .insert({
      name: body.name,
      type: body.type,
      cadence: body.cadence ?? 'none',
      place_id: body.place_id ?? null,
      prospect_id: body.prospect_id ?? null,
      contact_phone: body.contact_phone ?? null,
      contact_method: body.contact_method ?? null,
      next_action: body.next_action ?? null,
      next_action_date: body.next_action_date ?? null,
      content_cadence: body.content_cadence ?? null,
      revenue_potential_cents: body.revenue_potential_cents ?? null,
      tags: body.tags ?? [],
      notes: body.notes ?? null,
    })
    .select('*')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
