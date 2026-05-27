import { createSupabaseAdminClient } from './supabase-server'

export type AdminBadges = Record<string, number>

const ACTIVE_PROSPECT_STAGES = ['lead', 'contacted', 'pitched', 'negotiating']

export async function getAdminBadges(): Promise<AdminBadges> {
  const supabase = await createSupabaseAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const [inbox, pipeline, contactos, dinero, contenido, edits, decisiones, proposals] = await Promise.allSettled([
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

    supabase
      .from('business_edits')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),

    supabase
      .from('cartera_decisions')
      .select('id', { count: 'exact', head: true })
      .is('decision', null)
      .gt('expires_at', new Date().toISOString()),

    supabase
      .from('agent_proposals')
      .select('id', { count: 'exact', head: true })
      .in('status', ['draft', 'needs_review']),
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

  if (edits.status === 'fulfilled' && edits.value.count != null) {
    badges['/admin/edits'] = edits.value.count
  }

  const decisionCount =
    (decisiones.status === 'fulfilled' && decisiones.value.count != null ? decisiones.value.count : 0)
    + (proposals.status === 'fulfilled' && proposals.value.count != null ? proposals.value.count : 0)

  if (decisionCount > 0) {
    badges['/admin/decisiones'] = decisionCount
  }

  return badges
}
