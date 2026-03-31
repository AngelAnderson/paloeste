import { getAdminPlaces } from '@/lib/admin-queries'
import { PlacesTable } from './places-table'

export const dynamic = 'force-dynamic'

export default async function PlacesPage() {
  const places = await getAdminPlaces()

  // Compute stats
  const total = places.length
  const withGps = places.filter(p => p.lat != null && p.lon != null).length
  const withEmbed = places.filter(p => p.embedding != null).length
  const withDesc = places.filter(p => p.description && p.description.length > 20).length
  const withPhone = places.filter(p => p.phone && p.phone.trim()).length
  const withImage = places.filter(p => p.hero_image_url && p.hero_image_url.trim()).length
  const withWeb = places.filter(p => p.website && p.website.trim()).length
  const sponsors = places.filter(p => p.sponsor_weight > 0).length

  // Category breakdown
  const catMap = new Map<string, number>()
  places.forEach(p => catMap.set(p.category, (catMap.get(p.category) || 0) + 1))
  const categories = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Places</h1>
      <p className="text-[#64748b] text-sm mb-6">{total} businesses in directory. Live completeness audit.</p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <MiniKPI label="Total" value={total} color="#38bdf8" />
        <MiniKPI label="Sponsors" value={sponsors} color="#fbbf24" />
        <MiniKPI label="GPS" value={withGps} pct={total > 0 ? Math.round(withGps / total * 100) : 0} color={withGps / total > 0.7 ? '#4ade80' : '#f87171'} />
        <MiniKPI label="Embeddings" value={withEmbed} pct={total > 0 ? Math.round(withEmbed / total * 100) : 0} color={withEmbed / total > 0.7 ? '#4ade80' : '#fb923c'} />
        <MiniKPI label="Descriptions" value={withDesc} pct={total > 0 ? Math.round(withDesc / total * 100) : 0} color={withDesc / total > 0.7 ? '#4ade80' : '#fb923c'} />
        <MiniKPI label="Phone" value={withPhone} pct={total > 0 ? Math.round(withPhone / total * 100) : 0} color={withPhone / total > 0.7 ? '#4ade80' : '#fb923c'} />
        <MiniKPI label="Images" value={withImage} pct={total > 0 ? Math.round(withImage / total * 100) : 0} color={withImage / total > 0.5 ? '#fbbf24' : '#f87171'} />
        <MiniKPI label="Websites" value={withWeb} pct={total > 0 ? Math.round(withWeb / total * 100) : 0} color={withWeb / total > 0.3 ? '#fbbf24' : '#f87171'} />
      </div>

      {/* Category Breakdown */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">By Category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(([cat, count]) => (
            <span key={cat} className="bg-[#334155] px-3 py-1.5 rounded-lg text-sm">
              {cat} <span className="text-[#38bdf8] font-semibold">{count}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Interactive Table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
        <PlacesTable places={places} categories={categories.map(([c]) => c)} />
      </div>
    </div>
  )
}

function MiniKPI({ label, value, pct, color }: { label: string; value: number; pct?: number; color: string }) {
  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-3">
      <div className="text-[10px] text-[#64748b] uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold mt-0.5" style={{ color }}>{value}</div>
      {pct !== undefined && <div className="text-[10px] text-[#64748b]">{pct}%</div>}
    </div>
  )
}
