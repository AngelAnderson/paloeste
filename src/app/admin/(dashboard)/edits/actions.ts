'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function approveEdit(id: string, appliedBy: string) {
  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase
    .from('business_edits')
    .update({ status: 'applied', applied_at: new Date().toISOString(), applied_by: appliedBy })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/edits')
}

export async function rejectEdit(id: string, appliedBy: string, reason?: string) {
  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase
    .from('business_edits')
    .update({
      status: 'rejected',
      applied_at: new Date().toISOString(),
      applied_by: appliedBy,
      notes: reason ? `Rejected: ${reason}` : 'Rejected',
    })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/edits')
}
