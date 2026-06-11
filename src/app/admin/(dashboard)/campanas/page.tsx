import { getConversionOpportunities } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import type { CampaignIdea } from '@/lib/campaigns'
import { CampanasView } from './campanas-view'

export const dynamic = 'force-dynamic'

export default async function CampanasPage() {
  const supabase = await createSupabaseAdminClient()

  const [opportunities, ideasRes] = await Promise.all([
    // Live demand: businesses with 3+ bot leads not yet paying — these qualify
    // for a "Campaña de Resultado" because the demand is already proven.
    getConversionOpportunities(3).catch(() => []),
    supabase.from('campaign_ideas').select('*').order('updated_at', { ascending: false }),
  ])

  const ideas = (ideasRes.data || []) as CampaignIdea[]

  // Enrich with phone for the one-click WhatsApp plan send.
  const phones: Record<string, string | null> = {}
  const ids = [
    ...opportunities.map((o) => o.place_id),
    ...ideas.map((i) => i.place_id).filter((id): id is string => !!id),
  ]
  if (ids.length > 0) {
    const { data } = await supabase.from('places').select('id, phone').in('id', ids)
    for (const p of data || []) phones[p.id] = p.phone
  }

  return <CampanasView opportunities={opportunities} phones={phones} ideas={ideas} />
}
