import { createSupabaseAdminClient } from './supabase-server'

export type AdminBadges = Record<string, number>

// Single RPC (get_admin_badge_counts) replaces 8 per-page-load queries —
// one of them fetched every unbilled bot_lead row just to count businesses.
export async function getAdminBadges(): Promise<AdminBadges> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_admin_badge_counts')
  if (error) throw new Error(error.message)

  const counts = (data || {}) as Record<string, number>
  const badges: AdminBadges = {}

  const map: Record<string, string> = {
    inbox: '/admin/inbox',
    pipeline: '/admin/pipeline',
    contactos: '/admin/contactos',
    dinero: '/admin/dinero',
    contenido: '/admin/content',
    edits: '/admin/edits',
    submissions: '/admin/submissions',
    decisiones: '/admin/decisiones',
    inbound_overdue: '/admin/hoy',
  }

  for (const [key, href] of Object.entries(map)) {
    const n = counts[key]
    if (typeof n === 'number' && n > 0) badges[href] = n
  }

  return badges
}
