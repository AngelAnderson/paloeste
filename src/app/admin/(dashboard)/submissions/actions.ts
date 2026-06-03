'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

type Decision = 'published' | 'rejected' | 'archived'

const STAMP: Record<Decision, 'published_at' | null> = {
  published: 'published_at',
  rejected: null,
  archived: null,
}

export async function setSubmissionStatus(id: string, status: Decision, reviewedBy: string, note?: string) {
  const supabase = await createSupabaseAdminClient()
  const now = new Date().toISOString()
  const patch: Record<string, unknown> = {
    status,
    reviewed_at: now,
    reviewed_by: reviewedBy,
  }
  if (STAMP[status]) patch[STAMP[status] as string] = now
  if (note) patch.internal_note = note
  const { error } = await supabase.from('content_submissions').update(patch).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/submissions')
}

export async function saveSubmissionTitle(id: string, title: string) {
  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase.from('content_submissions').update({ title }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/submissions')
}
