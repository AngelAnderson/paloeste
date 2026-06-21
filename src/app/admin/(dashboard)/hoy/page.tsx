import { getOverdueRelationships, getUnbilledLeadsByBusiness, getConversionOpportunities, getProspects, getPlacesMissingPhotos } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { clasificarBandejas } from '@/lib/bandejas'
import { BandejasView } from './bandejas-view'
import { Termometro, type Termo } from './termometro'

export const dynamic = 'force-dynamic'

export default async function HoyPage() {
  const supabase = await createSupabaseAdminClient()

  const [overdueRels, unbilled, opportunities, prospects, missingPhotos, counts, noeliaTasks, relsSinPhone, prospectsSinFecha] = await Promise.all([
    getOverdueRelationships().catch(() => []),
    getUnbilledLeadsByBusiness().catch(() => []),
    getConversionOpportunities(3).catch(() => []),
    getProspects().catch(() => []),
    getPlacesMissingPhotos().catch(() => []),
    Promise.resolve(supabase.rpc('get_admin_badge_counts')).then(r => (r.data || {}) as Record<string, number>).catch(() => ({} as Record<string, number>)),
    Promise.resolve(supabase.from('noelia_tasks').select('id', { count: 'exact', head: true }).not('status', 'in', '("done","archived")')).then(r => r.count || 0).catch(() => 0),
    Promise.resolve(supabase.from('relationships').select('id', { count: 'exact', head: true }).eq('active', true).or('contact_phone.is.null,contact_phone.eq.')).then(r => r.count || 0).catch(() => 0),
    Promise.resolve(supabase.from('prospects').select('id', { count: 'exact', head: true }).in('stage', ['lead', 'contacted', 'pitched', 'negotiating']).is('next_action_date', null)).then(r => r.count || 0).catch(() => 0),
  ])

  const bandejas = clasificarBandejas({
    overdueRels,
    unbilled,
    opportunities,
    prospects,
    needsHumanCount: counts.inbox || 0,
    pendingSubmissions: counts.submissions || 0,
    pendingEdits: counts.edits || 0,
    pendingDecisions: counts.decisiones || 0,
    missingPhotos,
    noeliaTasksOpen: noeliaTasks,
    relsSinPhone,
    prospectsSinFecha,
  })

  const termo = await Promise.resolve(supabase.rpc('get_cockpit_termometro'))
    .then(r => r.data as Termo | null)
    .catch(() => null)

  return (
    <>
      {termo && <Termometro t={termo} />}
      <BandejasView bandejas={bandejas} />
    </>
  )
}
