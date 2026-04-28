import { getUnbilledLeadsByBusiness, getConversionOpportunities, getSponsorROI, getPlacesMissingPhotos, getAdminOverview, getProspects, getBotIntelligence, getOverdueRelationships } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { RevenueDashboard } from './revenue-dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [unbilled, opportunities, sponsors, missingPhotos, overview, prospects, botIntel, overdueRels] = await Promise.all([
    getUnbilledLeadsByBusiness(),
    getConversionOpportunities(3),
    getSponsorROI(),
    getPlacesMissingPhotos(),
    getAdminOverview(),
    getProspects(),
    getBotIntelligence(7).catch(() => null),
    getOverdueRelationships().catch(() => []),
  ])

  // Get vitrina tokens and slugs for sponsors
  const sponsorMeta: Record<string, { token: string; slug: string; phone: string | null }> = {}
  if (sponsors.length > 0) {
    const supabase = await createSupabaseAdminClient()
    const { data: sponsorRows } = await supabase
      .from('places')
      .select('id, slug, vitrina_token, phone')
      .in('id', sponsors.map(s => s.place_id))
    for (const row of sponsorRows || []) {
      if (row.slug) {
        sponsorMeta[row.id] = { token: row.vitrina_token || '', slug: row.slug, phone: row.phone || null }
      }
    }
  }

  // Enrich opportunities with phone from places
  const opIds = opportunities.map(o => o.place_id)
  const opPhones: Record<string, string | null> = {}
  if (opIds.length > 0) {
    const supabase = await createSupabaseAdminClient()
    const { data: opPlaces } = await supabase
      .from('places')
      .select('id, phone, slug')
      .in('id', opIds)
    for (const p of opPlaces || []) {
      opPhones[p.id] = p.phone
    }
  }

  // Separate: sponsors (already paying) vs non-sponsors (need to collect)
  const sponsorIds = new Set(sponsors.filter(s => s.sponsor_weight > 0).map(s => s.place_id))
  const unbilledNonSponsors = unbilled.filter(u => !sponsorIds.has(u.business_id) && u.sponsor_weight === 0)
  const totalUnbilled = unbilledNonSponsors.reduce((sum, u) => sum + u.total_cents, 0)

  // Filter prospects: due today or overdue, active stages only
  const today = new Date().toISOString().slice(0, 10)
  const activeStages = ['lead', 'contacted', 'pitched', 'negotiating']
  const followUps = prospects
    .filter(p => activeStages.includes(p.stage.replace('closed_', '')) && p.next_action_date && p.next_action_date.slice(0, 10) <= today)
    .sort((a, b) => (a.next_action_date || '').localeCompare(b.next_action_date || ''))
  const staleProspects = prospects
    .filter(p => {
      if (!activeStages.includes(p.stage.replace('closed_', ''))) return false
      const lastTouch = p.last_contact_at || p.created_at
      const days = Math.floor((Date.now() - new Date(lastTouch).getTime()) / 86400000)
      return days >= 7
    })

  return (
    <RevenueDashboard
      unbilled={unbilledNonSponsors}
      totalUnbilled={totalUnbilled}
      opportunities={opportunities}
      opPhones={opPhones}
      sponsors={sponsors}
      sponsorMeta={sponsorMeta}
      missingPhotos={missingPhotos}
      overview={overview}
      followUps={followUps}
      staleCount={staleProspects.length}
      botIntel={botIntel}
      overdueRels={overdueRels}
    />
  )
}
