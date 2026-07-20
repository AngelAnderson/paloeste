'use server'

import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

const EXECUTOR_URL = 'https://vprjteqgmanntvisjrvp.supabase.co/functions/v1/caborojo-ops-executor'

async function callExecutor(action: 'apply' | 'revert', id: string): Promise<{ ok: boolean; message: string }> {
  const key = process.env.OPS_ADMIN_KEY
  if (!key) return { ok: false, message: 'OPS_ADMIN_KEY missing' }
  try {
    const r = await fetch(`${EXECUTOR_URL}?action=${action}&id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(25000),
    })
    const body = await r.json().catch(() => ({}))
    if (!r.ok || !body.ok) return { ok: false, message: body.error || `HTTP ${r.status}` }
    return { ok: true, message: action === 'apply' ? `Publicado: ${body.url}` : 'Revertido al contenido anterior.' }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) }
  }
}

export async function approveOpsItem(id: string) {
  const res = await callExecutor('apply', id)
  revalidatePath('/admin/ops')
  return res
}

export async function revertOpsItem(id: string) {
  const res = await callExecutor('revert', id)
  revalidatePath('/admin/ops')
  return res
}

export async function dismissOpsItem(id: string) {
  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase
    .from('ops_queue')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
  revalidatePath('/admin/ops')
  return { ok: !error, message: error ? error.message : 'Descartado.' }
}
