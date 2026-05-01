'use server'

import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { logRelationshipContact } from '@/lib/admin-queries'

export async function markBusinessBilled(businessId: string): Promise<{ updated: number }> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('bot_leads')
    .update({ billed: true })
    .eq('business_id', businessId)
    .eq('billed', false)
    .select('id')
  if (error) throw new Error(error.message)
  return { updated: data?.length ?? 0 }
}

export async function logRelationshipTouch(
  relId: string,
  action: string,
  notes?: string,
): Promise<{ ok: true }> {
  await logRelationshipContact(relId, action, notes)
  return { ok: true }
}
