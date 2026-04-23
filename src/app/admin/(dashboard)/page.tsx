import { getUnbilledLeadsByBusiness, getConversionOpportunities, getSponsorROI, getPlacesMissingPhotos, getAdminOverview } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { RevenueDashboard } from './revenue-dashboard'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [unbilled, opportunities, sponsors, missingPhotos, overview] = await Promise.all([
    getUnbilledLeadsByBusiness(),
    getConversionOpportunities(3),
    getSponsorROI(),
    getPlacesMissingPhotos(),
    getAdminOverview(),
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
    />
  )
}
