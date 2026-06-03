import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// Token-gated worker tasks API (Noelia verification system).
// Page lives at /tareas — public, gated only by these tokens in the URL.
const NOELIA = 'noe-9f3a7ef8164c4358'
const ADMIN = 'adm-d36493377f424a98'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const u = new URL(req.url)
  const taskType = u.searchParams.get('task') || 'health_verify'
  const token = u.searchParams.get('token') || ''
  if (token !== NOELIA && token !== ADMIN) {
    return NextResponse.json({ error: 'bad token' }, { status: 401 })
  }
  const sb = await createSupabaseAdminClient()
  const { data, error } = await sb
    .from('noelia_tasks')
    .select('id,place_name,place_phone,place_address,place_npi,flag,status,result,note,updated_at')
    .eq('task_type', taskType)
    .order('updated_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ tasks: data ?? [] })
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}))
  if (b.token !== NOELIA && b.token !== ADMIN) {
    return NextResponse.json({ error: 'bad token' }, { status: 401 })
  }
  const sb = await createSupabaseAdminClient()
  const { data, error } = await sb
    .from('noelia_tasks')
    .update({
      status: b.status || 'pending',
      result: b.result || {},
      note: b.note || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', b.id)
    .select('place_id,task_type')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // On confirmed verification, bump the place record (additive, reversible).
  if (data && b.status === 'done') {
    const res = b.result || {}
    const cleanHealth = data.task_type === 'health_verify' && res.ok === true
    const isPharm = data.task_type === 'pharmacy_audit'
    if (cleanHealth || isPharm) {
      await sb
        .from('places')
        .update({
          is_verified: true,
          last_verified_at: new Date().toISOString(),
          verification_source: 'noelia',
        })
        .eq('id', data.place_id)
    }
  }
  return NextResponse.json({ ok: true })
}
