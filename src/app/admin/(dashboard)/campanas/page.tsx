import { getConversionOpportunities } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { CampanasView } from './campanas-view'

export const dynamic = 'force-dynamic'

export default async function CampanasPage() {
  // Live demand: businesses with 3+ bot leads not yet paying — these qualify
  // for a "Campaña de Resultado" because the demand is already proven.
  const opportunities = await getConversionOpportunities(3).catch(() => [])

  // Enrich with phone for the one-click WhatsApp plan send.
  const phones: Record<string, string | null> = {}
  const ids = opportunities.map((o) => o.place_id)
  if (ids.length > 0) {
    const supabase = await createSupabaseAdminClient()
    const { data } = await supabase.from('places').select('id, phone').in('id', ids)
    for (const p of data || []) phones[p.id] = p.phone
  }

  return <CampanasView opportunities={opportunities} phones={phones} />
}
