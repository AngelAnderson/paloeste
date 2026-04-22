'use client'

import { useState } from 'react'

interface Prospect {
  place_id: string
  name: string
  slug: string
  category: string
  recommendation_count: number
  unique_users: number
  plan: string
  phone: string
  is_featured: boolean
  estimated_value: number
  pipeline_stage: string | null
  pipeline_last_contact: string | null
  pipeline_next_action: string | null
}

interface Props {
  prospects: Prospect[]
  catLabels: Record<string, string>
}

const STAGE_COLORS: Record<string, string> = {
  lead: '#64748b',
  contacted: '#38bdf8',
  pitched: '#fbbf24',
  negotiating: '#fb923c',
  won: '#4ade80',
  lost: '#f87171',
}

export function VitrinaActions({ prospects, catLabels }: Props) {
  const [filter, setFilter] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [hideSponsors, setHideSponsors] = useState(true)

  const uniqueCats = [...new Set(prospects.map(p => p.category))].sort()

  const filtered = prospects
    .filter(p => {
      if (hideSponsors && p.is_featured) return false
      if (catFilter && p.category !== catFilter) return false
      if (filter && !p.name.toLowerCase().includes(filter.toLowerCase())) return false
      return true
    })
    .sort((a, b) => b.recommendation_count - a.recommendation_count)

  function buildWaMessage(p: Prospect): string {
    const catLabel = catLabels[p.category] || p.category
    const link = p.slug ? `https://paloeste.com/vitrina/${p.slug}?from=angel` : ''
    return [
      `Hola, ${p.recommendation_count} personas buscaron ${catLabel} en Cabo Rojo este mes.`,
      link ? `\n\nEste es tu perfil de demanda gratis:\n${link}` : '',
      `\n\nEl espacio de sponsor en tu categoria esta disponible.`,
    ].join('')
  }

  function openWhatsApp(p: Prospect) {
    const msg = encodeURIComponent(buildWaMessage(p))
    const phone = p.phone ? p.phone.replace(/\D/g, '') : '17874177711'
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
  }

  function copyMessage(p: Prospect) {
    navigator.clipboard.writeText(buildWaMessage(p))
    setCopiedId('msg-' + p.place_id + p.name)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function copyLink(p: Prospect) {
    if (!p.slug) return
    navigator.clipboard.writeText(`https://paloeste.com/vitrina/${p.slug}?from=angel`)
    setCopiedId(p.place_id + p.name)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function daysSince(dateStr: string | null): string {
    if (!dateStr) return ''
    const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
    if (days === 0) return 'hoy'
    if (days === 1) return 'ayer'
    return `${days}d`
  }

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Buscar negocio..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white placeholder-[#475569] w-64"
        />
        <select
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
          className="bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white"
        >
          <option value="">Todas las categorias</option>
          {uniqueCats.map(c => (
            <option key={c} value={c}>{catLabels[c] || c}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-[#94a3b8] cursor-pointer">
          <input
            type="checkbox"
            checked={hideSponsors}
            onChange={e => setHideSponsors(e.target.checked)}
            className="rounded"
          />
          Ocultar sponsors
        </label>
        <span className="text-[#64748b] text-sm self-center ml-auto">
          {filtered.length} prospectos
        </span>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#334155]">
              <th className="text-left px-4 py-3 text-[#64748b] text-xs uppercase">Negocio</th>
              <th className="text-left px-4 py-3 text-[#64748b] text-xs uppercase">Categoria</th>
              <th className="text-right px-4 py-3 text-[#64748b] text-xs uppercase">Recs</th>
              <th className="text-right px-4 py-3 text-[#64748b] text-xs uppercase">Valor</th>
              <th className="text-center px-4 py-3 text-[#64748b] text-xs uppercase">Pipeline</th>
              <th className="text-center px-4 py-3 text-[#64748b] text-xs uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.slice(0, 100).map(p => {
              const msgKey = 'msg-' + p.place_id + p.name
              const linkKey = p.place_id + p.name

              return (
                <tr key={p.name} className="border-b border-[#334155]/50 hover:bg-[#334155]/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {p.slug ? (
                        <a
                          href={`/vitrina/${p.slug}?from=angel`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium text-[#38bdf8] hover:underline"
                        >
                          {p.name}
                        </a>
                      ) : (
                        <span className="font-medium">{p.name}</span>
                      )}
                      {p.is_featured && (
                        <span className="text-[10px] bg-[#4ade80] text-black px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                          SPONSOR
                        </span>
                      )}
                    </div>
                    {p.phone && (
                      <div className="text-[11px] text-[#475569] mt-0.5">{p.phone}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#94a3b8] text-xs">
                    {catLabels[p.category] || p.category}
                  </td>
                  <td className="px-4 py-3 text-right text-[#38bdf8] font-bold">
                    {p.recommendation_count}
                  </td>
                  <td className="px-4 py-3 text-right text-[#4ade80] font-semibold">
                    ${p.estimated_value}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {p.pipeline_stage ? (
                      <div>
                        <span
                          className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                          style={{
                            color: STAGE_COLORS[p.pipeline_stage] || '#94a3b8',
                            backgroundColor: (STAGE_COLORS[p.pipeline_stage] || '#94a3b8') + '20',
                          }}
                        >
                          {p.pipeline_stage}
                        </span>
                        {p.pipeline_last_contact && (
                          <div className="text-[10px] text-[#475569] mt-0.5">
                            {daysSince(p.pipeline_last_contact)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#334155]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5 justify-center">
                      <button
                        onClick={() => openWhatsApp(p)}
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#25d366]/20 text-[#25d366] hover:bg-[#25d366]/30 transition-colors"
                        title={p.phone ? `WhatsApp → ${p.phone}` : 'WhatsApp (tu numero)'}
                      >
                        WA
                      </button>
                      <button
                        onClick={() => copyMessage(p)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          copiedId === msgKey
                            ? 'bg-[#4ade80] text-black'
                            : 'bg-[#334155] text-[#94a3b8] hover:text-white hover:bg-[#475569]'
                        }`}
                        title="Copiar mensaje"
                      >
                        {copiedId === msgKey ? '!' : 'Msg'}
                      </button>
                      {p.slug && (
                        <button
                          onClick={() => copyLink(p)}
                          className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            copiedId === linkKey
                              ? 'bg-[#4ade80] text-black'
                              : 'bg-[#334155] text-[#94a3b8] hover:text-white hover:bg-[#475569]'
                          }`}
                          title="Copiar link vitrina"
                        >
                          {copiedId === linkKey ? '!' : 'Link'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center text-[#475569] py-12 text-sm">
            No hay prospectos con estos filtros
          </div>
        )}
        {filtered.length > 100 && (
          <div className="text-center text-[#475569] py-3 text-xs border-t border-[#334155]">
            Mostrando 100 de {filtered.length}
          </div>
        )}
      </div>
    </div>
  )
}
