'use client'

import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Relationship, OverdueRelationship } from '@/lib/types'
import { RelationshipPanel } from '@/components/admin/relationship-panel'

type Tab = 'all' | 'personal' | 'business' | 'overdue'

const BUSINESS_TYPES = new Set(['prospect', 'client', 'partner', 'cold', 'inbound_lead'])

export function RelationshipsList({
  initial,
  initialOverdue,
}: {
  initial: Relationship[]
  initialOverdue: OverdueRelationship[]
}) {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<Tab>('all')
  const [selected, setSelected] = useState<Relationship | null>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      const found = initial.find(r => r.id === id)
      if (found) setSelected(found)
    }
  }, [searchParams, initial])

  const filtered = useMemo(() => {
    if (tab === 'all') return initial
    if (tab === 'personal') return initial.filter(r => r.type === 'personal')
    if (tab === 'business') return initial.filter(r => BUSINESS_TYPES.has(r.type))
    if (tab === 'overdue') {
      const ids = new Set(initialOverdue.map(o => o.id))
      return initial.filter(r => ids.has(r.id))
    }
    return initial
  }, [tab, initial, initialOverdue])

  function handleRefresh() {
    window.location.reload()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Contactos</h1>
        <div className="text-sm text-gray-500">
          {initial.length} activas · {initialOverdue.length} overdue
        </div>
      </div>

      <div className="flex gap-2 mb-4 border-b">
        {(['all', 'personal', 'business', 'overdue'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              tab === t ? 'border-black text-black' : 'border-transparent text-gray-500'
            }`}
          >
            {t === 'all' && 'Todos'}
            {t === 'personal' && 'Personal'}
            {t === 'business' && 'Negocios'}
            {t === 'overdue' && (
              <>
                Overdue
                {initialOverdue.length > 0 && (
                  <span className="ml-2 bg-red-500 text-white rounded-full px-2 py-0.5 text-xs">
                    {initialOverdue.length}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>

      <table className="w-full text-sm">
        <thead className="text-left text-gray-500 border-b">
          <tr>
            <th className="py-2">Nombre</th>
            <th>Tipo</th>
            <th>Última vez</th>
            <th>Próxima acción</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(r => {
            const isOverdue = initialOverdue.some(o => o.id === r.id)
            return (
              <tr
                key={r.id}
                onClick={() => setSelected(r)}
                className="border-b hover:bg-gray-50 cursor-pointer"
              >
                <td className="py-2 font-medium">
                  {isOverdue && <span className="mr-2">🔴</span>}
                  {r.name}
                </td>
                <td>
                  <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-gray-100">
                    {r.type}
                  </span>
                </td>
                <td className="text-gray-500">
                  {r.last_contact_at ? new Date(r.last_contact_at).toLocaleDateString() : '—'}
                </td>
                <td className="text-gray-700 truncate max-w-md">{r.next_action ?? '—'}</td>
                <td>→</td>
              </tr>
            )
          })}
        </tbody>
      </table>

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
