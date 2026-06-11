'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
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

type IssueKey = 'gps' | 'embed' | 'desc' | 'phone' | 'image' | 'web'

const ISSUE_META: Record<IssueKey, { label: string; fix: string }> = {
  gps: { label: 'Sin GPS', fix: 'no salen en el mapa' },
  embed: { label: 'Sin embedding', fix: 'el Veci no los encuentra por significado' },
  desc: { label: 'Sin descripción', fix: 'tarjeta pobre + peor SEO' },
  phone: { label: 'Sin teléfono', fix: 'el Veci no puede dar contacto' },
  image: { label: 'Sin foto', fix: 'tarjeta sin cara (lista pa Noelia)' },
  web: { label: 'Sin website', fix: 'normal en negocios chicos' },
}

function hasIssue(p: PlaceRow, k: IssueKey): boolean {
  if (k === 'gps') return p.lat == null || p.lon == null
  if (k === 'embed') return p.embedding == null
  if (k === 'desc') return !p.description || p.description.length <= 20
  if (k === 'phone') return !p.phone?.trim()
  if (k === 'image') return !p.hero_image_url?.trim()
  return !p.website?.trim()
}

export default function PlacesAuditView() {
  const [places, setPlaces] = useState<PlaceRow[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCat, setFilterCat] = useState('')
  const [filterIssue, setFilterIssue] = useState<IssueKey | null>(null)
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
      gps: places.filter(p => !hasIssue(p, 'gps')).length,
      embed: places.filter(p => !hasIssue(p, 'embed')).length,
      desc: places.filter(p => !hasIssue(p, 'desc')).length,
      phone: places.filter(p => !hasIssue(p, 'phone')).length,
      image: places.filter(p => !hasIssue(p, 'image')).length,
      web: places.filter(p => !hasIssue(p, 'web')).length,
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
    if (filterIssue) {
      // Worst first: sponsors with the gap go on top
      list = list.filter(p => hasIssue(p, filterIssue)).slice()
        .sort((a, b) => b.sponsor_weight - a.sponsor_weight)
    }
    return list
  }, [places, search, filterCat, filterIssue])

  if (loading) return <div className="text-[#64748b] text-sm py-12 text-center">Cargando...</div>

  const { total } = stats
  const pct = (n: number) => total > 0 ? Math.round(n / total * 100) : 0

  // Proactive: sponsor-level gaps are the ones that cost money
  const sponsorGaps = places.filter(p => p.sponsor_weight > 0 && (hasIssue(p, 'image') || hasIssue(p, 'desc') || hasIssue(p, 'gps') || hasIssue(p, 'phone')))

  return (
    <div>
      {/* Sponsor gaps — money on the line */}
      {sponsorGaps.length > 0 && (
        <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-xl px-4 py-3 mb-4 text-sm">
          <span className="font-semibold text-[#f87171]">⚠️ {sponsorGaps.length} sponsor{sponsorGaps.length > 1 ? 's' : ''} con perfil incompleto</span>
          <span className="text-[#cbd5e1]"> (un sponsor con tarjeta pobre no renueva): </span>
          {sponsorGaps.slice(0, 5).map((p, i) => (
            <span key={p.id}>
              {i > 0 && ' · '}
              <Link href={`/admin/editar/${p.id}`} className="text-[#38bdf8] hover:underline">{p.name}</Link>
            </span>
          ))}
        </div>
      )}

      {/* KPI Row — ahora pulsables: clic = ver los que FALTAN */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 mb-2">
        <KPI label="Total" value={stats.total} color="#38bdf8" />
        <KPI label="Sponsors" value={stats.sponsors} color="#fbbf24" />
        <KPI label="GPS" value={stats.gps} pct={pct(stats.gps)} color={pct(stats.gps) > 70 ? '#4ade80' : '#f87171'}
          active={filterIssue === 'gps'} missing={total - stats.gps} onClick={() => setFilterIssue(filterIssue === 'gps' ? null : 'gps')} />
        <KPI label="Embeddings" value={stats.embed} pct={pct(stats.embed)} color={pct(stats.embed) > 70 ? '#4ade80' : '#fb923c'}
          active={filterIssue === 'embed'} missing={total - stats.embed} onClick={() => setFilterIssue(filterIssue === 'embed' ? null : 'embed')} />
        <KPI label="Descriptions" value={stats.desc} pct={pct(stats.desc)} color={pct(stats.desc) > 70 ? '#4ade80' : '#fb923c'}
          active={filterIssue === 'desc'} missing={total - stats.desc} onClick={() => setFilterIssue(filterIssue === 'desc' ? null : 'desc')} />
        <KPI label="Phone" value={stats.phone} pct={pct(stats.phone)} color={pct(stats.phone) > 70 ? '#4ade80' : '#fb923c'}
          active={filterIssue === 'phone'} missing={total - stats.phone} onClick={() => setFilterIssue(filterIssue === 'phone' ? null : 'phone')} />
        <KPI label="Images" value={stats.image} pct={pct(stats.image)} color={pct(stats.image) > 50 ? '#fbbf24' : '#f87171'}
          active={filterIssue === 'image'} missing={total - stats.image} onClick={() => setFilterIssue(filterIssue === 'image' ? null : 'image')} />
        <KPI label="Websites" value={stats.web} pct={pct(stats.web)} color={pct(stats.web) > 30 ? '#fbbf24' : '#f87171'}
          active={filterIssue === 'web'} missing={total - stats.web} onClick={() => setFilterIssue(filterIssue === 'web' ? null : 'web')} />
      </div>
      <p className="text-[11px] text-[#475569] mb-4">clic en un KPI = ver los negocios a los que les FALTA eso (sponsors primero)</p>

      {filterIssue && (
        <div className="flex items-center gap-2 bg-[#fbbf24]/10 border border-[#fbbf24]/30 rounded-xl px-4 py-2.5 mb-4 text-sm">
          <span className="text-[#fbbf24] font-semibold">{ISSUE_META[filterIssue].label}: {filtered.length}</span>
          <span className="text-[#94a3b8]">· {ISSUE_META[filterIssue].fix}</span>
          <button onClick={() => setFilterIssue(null)} className="ml-auto text-xs text-[#64748b] hover:text-white cursor-pointer">✕ quitar filtro</button>
        </div>
      )}

      {/* Category Breakdown */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">By Category</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilterCat(filterCat === cat ? '' : cat)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors cursor-pointer ${
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
                  <td className="py-1.5 pr-3 font-medium truncate max-w-[200px]">
                    <Link href={`/admin/editar/${p.id}`} className="hover:text-[#38bdf8] transition-colors">{p.name}</Link>
                  </td>
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

function KPI({ label, value, pct, color, missing, active, onClick }: {
  label: string; value: number; pct?: number; color: string
  missing?: number; active?: boolean; onClick?: () => void
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      onClick={onClick}
      className={`bg-[#1e293b] rounded-xl border p-3 text-left transition-colors ${
        active ? 'border-[#fbbf24]' : 'border-[#334155]'
      } ${onClick ? 'cursor-pointer hover:border-[#475569]' : ''}`}
    >
      <div className="text-[10px] text-[#64748b] uppercase tracking-wider">{label}</div>
      <div className="text-xl font-bold mt-0.5" style={{ color }}>{value}</div>
      <div className="text-[10px] text-[#64748b]">
        {pct !== undefined && `${pct}%`}
        {missing !== undefined && missing > 0 && <span className="text-[#f87171]"> · faltan {missing}</span>}
      </div>
    </Tag>
  )
}
