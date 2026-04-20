'use client'

import { useEffect, useState, useMemo } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface PlaceRow {
  id: string
  name: string
  category: string
  lat: number | null
  lon: number | null
  embedding: number[] | null
  description: string | null
  phone: string | null
  hero_image_url: string | null
  website: string | null
  sponsor_weight: number
}

export default function PlacesAuditView() {
  const [places, setPlaces] = useState<PlaceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('places')
        .select('id, name, category, lat, lon, embedding, description, phone, hero_image_url, website, sponsor_weight')
        .eq('status', 'open')
        .order('name')
      if (data) setPlaces(data as PlaceRow[])
      setLoading(false)
    }
    load()
  }, [supabase])

  const stats = useMemo(() => {
    const total = places.length
    return {
      total,
      sponsors: places.filter(p => p.sponsor_weight > 0).length,
      gps: places.filter(p => p.lat != null && p.lon != null).length,
      embed: places.filter(p => p.embedding != null).length,
      desc: places.filter(p => p.description && p.description.length > 20).length,
      phone: places.filter(p => p.phone?.trim()).length,
      image: places.filter(p => p.hero_image_url?.trim()).length,
      web: places.filter(p => p.website?.trim()).length,
    }
  }, [places])

  const categories = useMemo(() => {
    const map = new Map<string, number>()
    places.forEach(p => map.set(p.category, (map.get(p.category) || 0) + 1))
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1])
  }, [places])

  const filtered = useMemo(() => {
    let list = places
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (filterCat) list = list.filter(p => p.category === filterCat)
    return list
  }, [places, search, filterCat])

  if (loading) return <div className="text-[#64748b] text-sm py-12 text-center">Cargando...</div>

  const { total } = stats
  const pct = (n: number) => total > 0 ? Math.round(n / total * 100) : 0

  return (
    <div>
      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        <KPI label="Total" value={stats.total} color="#38bdf8" />
        <KPI label="Sponsors" value={stats.sponsors} color="#fbbf24" />
        <KPI label="GPS" value={stats.gps} pct={pct(stats.gps)} color={pct(stats.gps) > 70 ? '#4ade80' : '#f87171'} />
        <KPI label="Embeddings" value={stats.embed} pct={pct(stats.embed)} color={pct(stats.embed) > 70 ? '#4ade80' : '#fb923c'} />
        <KPI label="Descriptions" value={stats.desc} pct={pct(stats.desc)} color={pct(stats.desc) > 70 ? '#4ade80' : '#fb923c'} />
        <KPI label="Phone" value={stats.phone} pct={pct(stats.phone)} color={pct(stats.phone) > 70 ? '#4ade80' : '#fb923c'} />
        <KPI label="Images" value={stats.image} pct={pct(stats.image)} color={pct(stats.image) > 50 ? '#fbbf24' : '#f87171'} />
        <KPI label="Websites" value={stats.web} pct={pct(stats.web)} color={pct(stats.web) > 30 ? '#fbbf24' : '#f87171'} />
      </div>

      {/* Category Breakdown */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">By Category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                filterCat === cat ? 'bg-[#38bdf8]/20 text-[#38bdf8]' : 'bg-[#334155] hover:bg-[#475569]'
              }`}
            >
              {cat} <span className="text-[#38bdf8] font-semibold">{count}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search + Table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
        <input
          type="search"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white mb-4 focus:border-[#38bdf8] focus:outline-none"
        />
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[#1e293b]">
              <tr className="text-left text-[10px] text-[#64748b] uppercase tracking-wider">
                <th className="pb-2 pr-3">Name</th>
                <th className="pb-2 pr-3">Category</th>
                <th className="pb-2 pr-2 text-center">📍</th>
                <th className="pb-2 pr-2 text-center">🧠</th>
                <th className="pb-2 pr-2 text-center">📷</th>
                <th className="pb-2 pr-2 text-center">📞</th>
                <th className="pb-2 pr-2 text-center">🌐</th>
                <th className="pb-2 text-center">⭐</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 200).map(p => (
                <tr key={p.id} className="border-t border-[#334155]/50">
                  <td className="py-1.5 pr-3 font-medium truncate max-w-[200px]">{p.name}</td>
                  <td className="py-1.5 pr-3 text-[#64748b] truncate max-w-[120px]">{p.category}</td>
                  <td className="py-1.5 pr-2 text-center">{p.lat ? '✅' : '❌'}</td>
                  <td className="py-1.5 pr-2 text-center">{p.embedding ? '✅' : '❌'}</td>
                  <td className="py-1.5 pr-2 text-center">{p.hero_image_url ? '✅' : '❌'}</td>
                  <td className="py-1.5 pr-2 text-center">{p.phone ? '✅' : '❌'}</td>
                  <td className="py-1.5 pr-2 text-center">{p.website ? '✅' : '❌'}</td>
                  <td className="py-1.5 text-center">{p.sponsor_weight > 0 ? `★${p.sponsor_weight}` : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 200 && <div className="text-xs text-[#64748b] pt-2">Showing 200 of {filtered.length}</div>}
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, pct, color }: { label: string; value: number; pct?: number; color: string }) {
  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-3">
      <div className="text-[10px] text-[#64748b] uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold mt-0.5" style={{ color }}>{value}</div>
      {pct !== undefined && <div className="text-[10px] text-[#64748b]">{pct}%</div>}
    </div>
  )
}
