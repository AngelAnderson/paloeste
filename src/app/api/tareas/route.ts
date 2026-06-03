import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// Token-gated worker tasks API (Noelia verification system).
// Tokens live in env (Vercel) — NEVER hardcode (repo is public).
// Accepted via `Authorization: Bearer <token>` header so they don't leak
// through the URL / Referer / access logs. Query/body kept as fallback.
const NOELIA = process.env.TAREAS_NOELIA_TOKEN || ''
const ADMIN = process.env.TAREAS_ADMIN_TOKEN || ''

export const dynamic = 'force-dynamic'

function safeEq(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

function validToken(token: string): boolean {
  return safeEq(token, NOELIA) || safeEq(token, ADMIN)
}

function bearer(req: NextRequest): string {
  const auth = req.headers.get('authorization') || ''
  return auth.startsWith('Bearer ') ? auth.slice(7) : ''
}

export async function GET(req: NextRequest) {
  const u = new URL(req.url)
  const taskType = u.searchParams.get('task') || 'health_verify'
  // Prefer Bearer header; fall back to query for backward-compat.
  const token = bearer(req) || u.searchParams.get('token') || ''
  if (!validToken(token)) {
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
  const token = bearer(req) || b.token || ''
  if (!validToken(token)) {
    return NextResponse.json({ error: 'bad token' }, { status: 401 })
  }
  const sb = await createSupabaseAdminClient()

  // Admin-only: apply confirmed verifications to the `places` directory.
  // Worker submissions NEVER mutate `places` directly — Angel stays in the
  // loop (guardrail: a worker token must not be able to flip is_verified).
  if (b.action === 'apply') {
    if (!safeEq(token, ADMIN)) return NextResponse.json({ error: 'admin only' }, { status: 403 })
    const { data: done } = await sb
      .from('noelia_tasks')
      .select('place_id,task_type,result')
      .eq('status', 'done')
    const ids = (done ?? [])
      .filter(
        (t) =>
          t.task_type === 'pharmacy_audit' ||
          (t.task_type === 'health_verify' && (t.result as Record<string, unknown>)?.ok === true)
      )
      .map((t) => t.place_id)
      .filter(Boolean)
    if (ids.length) {
      await sb
        .from('places')
        .update({ is_verified: true, last_verified_at: new Date().toISOString(), verification_source: 'noelia' })
        .in('id', ids)
    }
    return NextResponse.json({ applied: ids.length })
  }

  // Worker submission: write to the task table only.
  const { error } = await sb
    .from('noelia_tasks')
    .update({
      status: b.status || 'pending',
      result: b.result || {},
      note: b.note || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', b.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
