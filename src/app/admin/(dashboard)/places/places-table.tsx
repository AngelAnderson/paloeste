'use client'

import { useState, useMemo } from 'react'
import type { AdminPlace } from '@/lib/types'

function computeScore(p: AdminPlace): number {
  let score = 0
  const total = 6
  if (p.description && p.description.length > 20) score++
  if (p.lat != null && p.lon != null) score++
  if (p.embedding != null) score++
  if (p.hero_image_url) score++
  if (p.phone) score++
  if (p.website) score++
  return Math.round((score / total) * 100)
}

type SortKey = 'name' | 'category' | 'score' | 'sponsor_weight'

export function PlacesTable({ places, categories }: { places: AdminPlace[]; categories: string[] }) {
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [planFilter, setPlanFilter] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(0)
  const pageSize = 30

  const scored = useMemo(() => places.map(p => ({ ...p, score: computeScore(p) })), [places])

  const filtered = useMemo(() => {
    let result = scored
    if (search) result = result.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    if (catFilter) result = result.filter(p => p.category === catFilter)
    if (planFilter === 'sponsor') result = result.filter(p => p.sponsor_weight > 0)
    else if (planFilter) result = result.filter(p => p.plan === planFilter)

    result.sort((a, b) => {
      let va: string | number = a[sortKey] ?? ''
      let vb: string | number = b[sortKey] ?? ''
      if (sortKey === 'score') { va = a.score; vb = b.score }
      if (typeof va === 'string') { va = va.toLowerCase(); vb = (vb as string).toLowerCase() }
      if (va < vb) return sortAsc ? -1 : 1
      if (va > vb) return sortAsc ? 1 : -1
      return 0
    })
    return result
  }, [scored, search, catFilter, planFilter, sortKey, sortAsc])

  const pageData = filtered.slice(page * pageSize, (page + 1) * pageSize)
  const totalPages = Math.ceil(filtered.length / pageSize)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(!sortAsc)
    else { setSortKey(key); setSortAsc(key === 'name') }
    setPage(0)
  }

  const yes = <span className="text-[#4ade80]">✓</span>
  const no = <span className="text-[#f87171] opacity-50">✗</span>

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(0) }}
          className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:border-[#38bdf8] focus:outline-none w-48"
        />
        <select
          value={catFilter}
          onChange={e => { setCatFilter(e.target.value); setPage(0) }}
          className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
        >
          <option value="">All Categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={planFilter}
          onChange={e => { setPlanFilter(e.target.value); setPage(0) }}
          className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
        >
          <option value="">All Plans</option>
          <option value="free">Free</option>
          <option value="basic">Basic</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
          <option value="sponsor">Sponsors Only</option>
        </select>
        <span className="text-[#64748b] text-sm self-center">{filtered.length} results</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] text-[#64748b] uppercase tracking-wider">
              <th className="pb-2 pr-3 cursor-pointer hover:text-white" onClick={() => toggleSort('name')}>
                Name {sortKey === 'name' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="pb-2 pr-3 cursor-pointer hover:text-white" onClick={() => toggleSort('category')}>
                Cat {sortKey === 'category' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="pb-2 pr-3 cursor-pointer hover:text-white text-right" onClick={() => toggleSort('score')}>
                Score {sortKey === 'score' && (sortAsc ? '▲' : '▼')}
              </th>
              <th className="pb-2 pr-2 text-center">Desc</th>
              <th className="pb-2 pr-2 text-center">GPS</th>
              <th className="pb-2 pr-2 text-center">Embed</th>
              <th className="pb-2 pr-2 text-center">Img</th>
              <th className="pb-2 pr-2 text-center">Phone</th>
              <th className="pb-2 pr-2 text-center">Web</th>
              <th className="pb-2 cursor-pointer hover:text-white text-right" onClick={() => toggleSort('sponsor_weight')}>
                Sponsor {sortKey === 'sponsor_weight' && (sortAsc ? '▲' : '▼')}
              </th>
            </tr>
          </thead>
          <tbody>
            {pageData.map(p => {
              const scoreColor = p.score <= 17 ? '#f87171' : p.score <= 33 ? '#fb923c' : p.score <= 50 ? '#fbbf24' : p.score <= 67 ? '#38bdf8' : '#4ade80'
              return (
                <tr key={p.id} className="border-t border-[#334155] hover:bg-[#38bdf8]/5">
                  <td className="py-2.5 pr-3 font-medium max-w-[200px] truncate">{p.name}</td>
                  <td className="py-2.5 pr-3 text-[#94a3b8]">{p.category}</td>
                  <td className="py-2.5 pr-3 text-right">
                    <span className="font-semibold" style={{ color: scoreColor }}>{p.score}%</span>
                    <span className="inline-block h-1.5 rounded-full ml-2 align-middle" style={{ width: p.score * 0.5, backgroundColor: scoreColor }} />
                  </td>
                  <td className="py-2.5 pr-2 text-center">{p.description && p.description.length > 20 ? yes : no}</td>
                  <td className="py-2.5 pr-2 text-center">{p.lat != null ? yes : no}</td>
                  <td className="py-2.5 pr-2 text-center">{p.embedding != null ? yes : no}</td>
                  <td className="py-2.5 pr-2 text-center">{p.hero_image_url ? yes : no}</td>
                  <td className="py-2.5 pr-2 text-center">{p.phone ? yes : no}</td>
                  <td className="py-2.5 pr-2 text-center">{p.website ? yes : no}</td>
                  <td className="py-2.5 text-right">
                    {p.sponsor_weight > 0 && (
                      <span className="bg-[#fbbf24]/15 text-[#fbbf24] px-2 py-0.5 rounded text-xs font-semibold">★{p.sponsor_weight}</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-[#64748b]">
          <span>Page {page + 1} of {totalPages}</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="bg-[#334155] px-3 py-1.5 rounded-lg disabled:opacity-30 hover:bg-[#475569] transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="bg-[#334155] px-3 py-1.5 rounded-lg disabled:opacity-30 hover:bg-[#475569] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
