import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('campaign_ideas')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createSupabaseAdminClient()
  const body = await req.json()
  const { title, business_name, archetype, tier, hook, draft, trigger_reason, trigger_window } = body
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const { data, error } = await supabase
    .from('campaign_ideas')
    .insert({
      title,
      business_name: business_name || null,
      archetype: archetype || null,
      tier: tier || '799',
      hook: hook || null,
      draft: draft || null,
      trigger_reason: trigger_reason || null,
      trigger_window: trigger_window || null,
      source: 'manual',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseAdminClient()
  const body = await req.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  updates.updated_at = new Date().toISOString()

  // Status changes and feedback get logged to the campaign's history timeline.
  if (updates.status || updates.feedback) {
    const { data: current } = await supabase
      .from('campaign_ideas')
      .select('status, history')
      .eq('id', id)
      .single()
    if (current) {
      const history = Array.isArray(current.history) ? current.history : []
      const fecha = new Date().toISOString().slice(0, 10)
      if (updates.status && updates.status !== current.status) {
        history.push({ fecha, evento: `Status: ${current.status} → ${updates.status}`, source: 'admin' })
      }
      if (updates.feedback) {
        history.push({ fecha, evento: 'Angel dejó feedback', source: 'admin' })
      }
      updates.history = history
    }
  }

  const { data, error } = await supabase
    .from('campaign_ideas')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
