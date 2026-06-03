'use server'

import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

// Apply confirmed verifications (from Noelia's worklist) to the places directory.
// Runs behind /admin login — no token needed here. Mirrors the token-gated
// POST {action:'apply'} on /api/tareas.
export async function applyVerified() {
  const sb = await createSupabaseAdminClient()
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
  revalidatePath('/admin/tareas')
}
