'use client'

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import type { Relationship, OverdueRelationship } from '@/lib/types'
import { RelationshipPanel } from '@/components/admin/relationship-panel'

type Tab = 'all' | 'personal' | 'business' | 'overdue'

const BUSINESS_TYPES = new Set(['prospect', 'client', 'partner', 'cold', 'inbound_lead'])

const TYPE_COLORS: Record<string, string> = {
  personal: 'bg-[#f472b6]/15 text-[#f472b6]',
  client: 'bg-[#4ade80]/15 text-[#4ade80]',
  partner: 'bg-[#38bdf8]/15 text-[#38bdf8]',
  prospect: 'bg-[#fbbf24]/15 text-[#fbbf24]',
  inbound_lead: 'bg-[#fb923c]/15 text-[#fb923c]',
  cold: 'bg-[#334155] text-[#94a3b8]',
}

export function RelationshipsList({
  initial,
  initialOverdue,
}: {
  initial: Relationship[]
  initialOverdue: OverdueRelationship[]
}) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('all')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<Relationship | null>(() => {
    const id = searchParams.get('id')
    return id ? initial.find(r => r.id === id) ?? null : null
  })

  const filtered = useMemo(() => {
    let list = initial
    if (tab === 'personal') list = list.filter(r => r.type === 'personal')
    else if (tab === 'business') list = list.filter(r => BUSINESS_TYPES.has(r.type))
    else if (tab === 'overdue') {
      const ids = new Set(initialOverdue.map(o => o.id))
      list = list.filter(r => ids.has(r.id))
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      list = list.filter(r =>
        r.name.toLowerCase().includes(q)
        || (r.next_action || '').toLowerCase().includes(q)
        || (r.contact_phone || '').includes(q)
      )
    }
    return list
  }, [tab, query, initial, initialOverdue])

  function handleRefresh() {
    window.location.reload()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h1 className="text-2xl font-bold">Contactos</h1>
        <div className="text-sm text-[#64748b]">
          {initial.length} activas · <span className={initialOverdue.length > 0 ? 'text-[#f87171]' : ''}>{initialOverdue.length} overdue</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1 bg-[#1e293b] rounded-lg p-1 border border-[#334155]">
          {(['all', 'personal', 'business', 'overdue'] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                tab === t ? 'bg-[#38bdf8]/15 text-[#38bdf8]' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {t === 'all' && 'Todos'}
              {t === 'personal' && 'Personal'}
              {t === 'business' && 'Negocios'}
              {t === 'overdue' && (
                <>
                  Overdue
                  {initialOverdue.length > 0 && (
                    <span className="ml-1.5 bg-[#f87171] text-white rounded-full px-1.5 py-0.5 text-[10px] font-bold">
                      {initialOverdue.length}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748b]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar nombre, acción, teléfono…"
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg pl-8 pr-3 py-1.5 text-sm placeholder:text-[#475569] focus:outline-none focus:border-[#38bdf8]"
          />
        </div>
      </div>

      <div className="rounded-xl border border-[#334155] bg-[#1e293b] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-[#64748b] text-xs uppercase tracking-wider border-b border-[#334155]">
            <tr>
              <th className="py-2.5 px-4 font-medium">Nombre</th>
              <th className="font-medium hidden sm:table-cell">Tipo</th>
              <th className="font-medium hidden md:table-cell">Última vez</th>
              <th className="font-medium">Próxima acción</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#283548]">
            {filtered.map(r => {
              const isOverdue = initialOverdue.some(o => o.id === r.id)
              return (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="hover:bg-[#243349] cursor-pointer transition-colors"
                >
                  <td className="py-2.5 px-4 font-medium text-white">
                    {isOverdue && <span className="mr-2">🔴</span>}
                    {r.name}
                    {!r.contact_phone && <span className="ml-2 text-[10px] text-[#64748b]" title="Sin teléfono">☎︎✕</span>}
                  </td>
                  <td className="hidden sm:table-cell">
                    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${TYPE_COLORS[r.type] || 'bg-[#334155] text-[#94a3b8]'}`}>
                      {r.type}
                    </span>
                  </td>
                  <td className="text-[#64748b] hidden md:table-cell">
                    {r.last_contact_at ? new Date(r.last_contact_at).toLocaleDateString('es-PR') : '—'}
                  </td>
                  <td className="text-[#94a3b8] truncate max-w-md pr-2">{r.next_action ?? '—'}</td>
                  <td className="text-[#475569] pr-4">→</td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-[#64748b] text-sm">Sin resultados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <RelationshipPanel
          relationship={selected}
          onClose={() => setSelected(null)}
          onUpdate={handleRefresh}
        />
      )}
    </div>
  )
}
