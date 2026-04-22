import { getPublicDemandStats } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { CATEGORIES } from '@/lib/constants'
import { VitrinaActions } from './vitrina-actions'

export const dynamic = 'force-dynamic'

const CAT_LABEL: Record<string, string> = {}
CATEGORIES.forEach((c) => { CAT_LABEL[c.id] = c.label_es })

const SPONSOR_CATEGORIES = new Set([
  'FOOD', 'SERVICE', 'SHOPPING', 'HEALTH', 'AUTO', 'BEAUTY',
  'LODGING', 'NIGHTLIFE', 'LOGISTICS', 'EDUCATION', 'EMERGENCY',
])

export default async function VitrinaAdminPage() {
  const supabase = await createSupabaseAdminClient()

  // Parallel: public stats + demand by name + pipeline prospects
  const [publicStats, demandByName, pipelineResult] = await Promise.all([
    getPublicDemandStats().catch(() => null),

    // Fix 1: Group demand signals by business NAME (not broken ID)
    supabase
      .from('demand_signals')
      .select('matched_business_name, category')
      .not('matched_business_name', 'is', null)
      .then(({ data }) => {
        if (!data) return []
        // Aggregate in JS since we need group-by with distinct counts
        const map = new Map<string, { name: string; category: string; count: number; users: Set<string> }>()
        for (const row of data) {
          const key = row.matched_business_name
          if (!key) continue
          const existing = map.get(key)
          if (existing) {
            existing.count++
          } else {
            map.set(key, { name: key, category: row.category || 'OTHER', count: 1, users: new Set() })
          }
        }
        return [...map.values()]
          .sort((a, b) => b.count - a.count)
          .slice(0, 60)
      }),

    // Fix 3: Get pipeline prospects
    supabase
      .from('prospects')
      .select('business_name, stage, last_contact_at, next_action')
      .order('updated_at', { ascending: false }),
  ])

  // Look up real slugs/phones/plans for the top recommended businesses
  const bizNames = demandByName.map(d => d.name)
  let placesLookup: Record<string, { id: string; slug: string; phone: string; plan: string; is_featured: boolean; category: string }> = {}

  if (bizNames.length > 0) {
    const { data: places } = await supabase
      .from('places')
      .select('id, name, slug, phone, plan, is_featured, category')
      .in('name', bizNames)
      .eq('visibility', 'published')

    if (places) {
      for (const p of places) {
        placesLookup[p.name] = { id: p.id, slug: p.slug, phone: p.phone || '', plan: p.plan, is_featured: p.is_featured, category: p.category }
      }
    }
  }

  // Build pipeline lookup by business name
  const pipelineMap = new Map<string, { stage: string; last_contact_at: string | null; next_action: string | null }>()
  for (const p of (pipelineResult.data || [])) {
    pipelineMap.set(p.business_name.toLowerCase(), { stage: p.stage, last_contact_at: p.last_contact_at, next_action: p.next_action })
  }

  // Build prospect list: demand data + places lookup + pipeline status
  const moneyOnTable = demandByName
    .filter(d => {
      const place = placesLookup[d.name]
      // Only sponsor-able categories
      const cat = place?.category || d.category
      return SPONSOR_CATEGORIES.has(cat)
    })
    .map(d => {
      const place = placesLookup[d.name]
      const pipeline = pipelineMap.get(d.name.toLowerCase())
      return {
        place_id: place?.id || '',
        name: d.name,
        slug: place?.slug || '',
        category: place?.category || d.category,
        recommendation_count: d.count,
        unique_users: d.count, // approx since we can't get distinct from this query
        plan: place?.plan || 'free',
        phone: place?.phone || '',
        is_featured: place?.is_featured || false,
        estimated_value: Math.round(d.count * 3.5),
        pipeline_stage: pipeline?.stage || null,
        pipeline_last_contact: pipeline?.last_contact_at || null,
        pipeline_next_action: pipeline?.next_action || null,
      }
    })

  // Stats
  const totalSearches = publicStats?.total_searches || 0
  const uniqueUsers = publicStats?.unique_users || 0
  const totalBiz = publicStats?.total_businesses || 0

  // Category demand (only sponsor-able)
  const rawCats = (publicStats?.categories || []) as { category: string; searches: number; businesses: number }[]
  const categories = rawCats.filter(c => SPONSOR_CATEGORIES.has(c.category))

  const topQueries: { query: string; count: number; category: string }[] =
    publicStats?.sample_queries || []

  const sponsorableSearches = categories.reduce((sum, c) => sum + c.searches, 0)

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold">La Vitrina — Prospecting</h1>
      </div>
      <p className="text-[#64748b] text-sm mb-6">
        Datos live del bot *7711. Filtra, elige un prospecto, y enviale su link por WhatsApp.
      </p>

      {/* Stats bar */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Textos al bot</div>
          <div className="text-2xl font-black text-[#38bdf8]">{totalSearches.toLocaleString()}</div>
          <div className="text-[10px] text-[#475569] mt-1">SMS/WA recibidos (30d)</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Personas</div>
          <div className="text-2xl font-black text-[#4ade80]">{uniqueUsers}</div>
          <div className="text-[10px] text-[#475569] mt-1">Telefonos unicos</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Negocios</div>
          <div className="text-2xl font-black text-[#fbbf24]">{totalBiz}</div>
          <div className="text-[10px] text-[#475569] mt-1">Publicados en directorio</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Oportunidad</div>
          <div className="text-2xl font-black text-[#f87171]">
            ${Math.round(sponsorableSearches * 3.5).toLocaleString()}
          </div>
          <div className="text-[10px] text-[#475569] mt-1">Busquedas negocio x $3.50</div>
        </div>
      </div>

      <div className="bg-[#1e293b]/50 border border-[#334155] rounded-lg px-4 py-3 mb-8 text-xs text-[#64748b]">
        <strong className="text-[#94a3b8]">Como se calcula:</strong>{" "}
        Cada texto al bot = persona buscando negocio. Cada recomendacion = lead potencial.
        Oportunidad = busquedas x $3.50/lead. Solo categorias vendibles (no playas/bosques).
      </div>

      {/* Category demand */}
      <div className="mb-8">
        <h2 className="text-lg font-bold mb-1">Demanda por Categoria</h2>
        <p className="text-[#64748b] text-xs mb-3">Solo negocios (no playas, bosques, atracciones)</p>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#334155]">
                <th className="text-left px-4 py-3 text-[#64748b] text-xs uppercase">Categoria</th>
                <th className="text-right px-4 py-3 text-[#64748b] text-xs uppercase">Busquedas</th>
                <th className="text-right px-4 py-3 text-[#64748b] text-xs uppercase">Negocios</th>
                <th className="text-right px-4 py-3 text-[#64748b] text-xs uppercase">Oportunidad</th>
              </tr>
            </thead>
            <tbody>
              {categories
                .filter(c => c.searches > 0)
                .sort((a, b) => b.searches - a.searches)
                .map(c => (
                  <tr key={c.category} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                    <td className="px-4 py-3 font-medium">{CAT_LABEL[c.category] || c.category}</td>
                    <td className="px-4 py-3 text-right text-[#38bdf8] font-bold">{c.searches.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-[#94a3b8]">{c.businesses}</td>
                    <td className="px-4 py-3 text-right text-[#fbbf24] font-semibold">${Math.round(c.searches * 3.5).toLocaleString()}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Top queries */}
      {topQueries.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-1">Top Busquedas (30 dias)</h2>
          <p className="text-[#64748b] text-xs mb-3">Ideas para posts de FB</p>
          <div className="flex flex-wrap gap-2">
            {topQueries.map(q => (
              <span key={q.query} className="bg-[#1e293b] border border-[#334155] rounded-full px-3 py-1.5 text-xs">
                &ldquo;{q.query}&rdquo;
                <span className="text-[#38bdf8] font-bold ml-1">{q.count}</span>
                <span className="text-[#64748b] ml-1">{CAT_LABEL[q.category] || q.category}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Prospects */}
      <div>
        <h2 className="text-lg font-bold mb-1">
          Prospectos
          <span className="text-[#64748b] text-sm font-normal ml-2">
            ({moneyOnTable.length} negocios recomendados por el bot)
          </span>
        </h2>
        <p className="text-[#64748b] text-xs mb-3">
          Click en nombre = ver pagina. WA = abrir WhatsApp directo.
        </p>

        <VitrinaActions prospects={moneyOnTable} catLabels={CAT_LABEL} />
      </div>
    </div>
  )
}
