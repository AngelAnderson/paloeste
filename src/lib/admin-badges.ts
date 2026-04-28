import { createSupabaseAdminClient } from './supabase-server'

export type AdminBadges = Record<string, number>

const ACTIVE_PROSPECT_STAGES = ['lead', 'contacted', 'pitched', 'negotiating']

export async function getAdminBadges(): Promise<AdminBadges> {
  const supabase = await createSupabaseAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const [inbox, pipeline, contactos, dinero, contenido] = await Promise.allSettled([
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('line', '7711')
      .eq('needs_human', true),

    supabase
      .from('prospects')
      .select('id', { count: 'exact', head: true })
      .in('stage', ACTIVE_PROSPECT_STAGES)
      .lte('next_action_date', today),

    supabase.rpc('get_overdue_relationships'),

    supabase
      .from('bot_leads')
      .select('business_id')
      .eq('billed', false),

    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .in('status', ['active', 'approved', 'published'])
      .gt('start_time', new Date().toISOString()),
  ])

  const badges: AdminBadges = {}

  if (inbox.status === 'fulfilled' && inbox.value.count != null) {
    badges['/admin/inbox'] = inbox.value.count
  }

  if (pipeline.status === 'fulfilled' && pipeline.value.count != null) {
    badges['/admin/pipeline'] = pipeline.value.count
  }

  if (contactos.status === 'fulfilled' && Array.isArray(contactos.value.data)) {
    badges['/admin/contactos'] = contactos.value.data.length
  }

  if (dinero.status === 'fulfilled' && Array.isArray(dinero.value.data)) {
    const distinctBusinesses = new Set(dinero.value.data.map((r: { business_id: string }) => r.business_id))
    badges['/admin/dinero'] = distinctBusinesses.size
  }

  if (contenido.status === 'fulfilled' && contenido.value.count != null) {
    badges['/admin/content'] = contenido.value.count
  }

  return badges
}
