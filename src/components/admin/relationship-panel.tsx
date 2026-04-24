'use client'

import { useEffect, useState } from 'react'
import type { Relationship, RelationshipHistoryEntry } from '@/lib/types'

interface Props {
  relationship: Relationship
  onClose: () => void
  onUpdate: () => void
}

export function RelationshipPanel({ relationship, onClose, onUpdate }: Props) {
  const [r, setR] = useState<Relationship>(relationship)
  const [history, setHistory] = useState<RelationshipHistoryEntry[]>([])
  const [saving, setSaving] = useState(false)
  const [logging, setLogging] = useState(false)

  useEffect(() => {
    fetch(`/api/admin/relationships/${relationship.id}/history`)
      .then(res => res.ok ? res.json() : [])
      .then(setHistory)
      .catch(() => setHistory([]))
  }, [relationship.id])

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/admin/relationships/${r.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        next_action: r.next_action,
        next_action_date: r.next_action_date,
        notes: r.notes,
        cadence: r.cadence,
        content_cadence: r.content_cadence,
        contact_phone: r.contact_phone,
        contact_method: r.contact_method,
      }),
    })
    setSaving(false)
    if (res.ok) { onUpdate(); onClose() }
  }

  async function markDone() {
    const action = prompt('¿Qué hiciste? (ej: "Llamada", "WhatsApp enviado", "Visita")')
    if (!action) return
    setLogging(true)
    const res = await fetch(`/api/admin/relationships/${r.id}/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setLogging(false)
    if (res.ok) { onUpdate(); onClose() }
  }

  function openWhatsApp() {
    if (!r.contact_phone) return
    const phone = r.contact_phone.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}`, '_blank')
  }

  const historyByYear = history.reduce<Record<number, RelationshipHistoryEntry[]>>((acc, h) => {
    (acc[h.year] ||= []).push(h)
    return acc
  }, {})

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full overflow-y-auto p-6 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold">{r.name}</h2>
            <div className="text-sm text-gray-500">{r.type}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-black">✕</button>
        </div>

        <button
          onClick={markDone}
          disabled={logging}
          className="w-full bg-green-600 text-white py-3 rounded mb-4 font-medium disabled:opacity-50"
        >
          {logging ? 'Guardando...' : '✓ Hecho (loggear contacto)'}
        </button>

        {r.contact_phone && (
          <button
            onClick={openWhatsApp}
            className="w-full bg-emerald-500 text-white py-2 rounded mb-4 text-sm"
          >
            WhatsApp · {r.contact_phone}
          </button>
        )}

        <label className="block mb-3">
          <span className="text-sm font-medium">Próxima acción</span>
          <input
            className="w-full border rounded px-2 py-1 mt-1"
            value={r.next_action ?? ''}
            onChange={e => setR({ ...r, next_action: e.target.value })}
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Fecha próxima acción</span>
          <input
            type="date"
            className="w-full border rounded px-2 py-1 mt-1"
            value={r.next_action_date ?? ''}
            onChange={e => setR({ ...r, next_action_date: e.target.value || null })}
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Cadencia</span>
          <select
            className="w-full border rounded px-2 py-1 mt-1"
            value={r.cadence}
            onChange={e => setR({ ...r, cadence: e.target.value as Relationship['cadence'] })}
          >
            <option value="none">Ninguna</option>
            <option value="daily">Diaria</option>
            <option value="weekly">Semanal</option>
            <option value="biweekly">Bisemanal</option>
            <option value="monthly">Mensual</option>
            <option value="quarterly">Trimestral</option>
          </select>
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Content cadence</span>
          <input
            className="w-full border rounded px-2 py-1 mt-1"
            placeholder='ej: "2x/mes post FB"'
            value={r.content_cadence ?? ''}
            onChange={e => setR({ ...r, content_cadence: e.target.value || null })}
          />
        </label>

        <label className="block mb-3">
          <span className="text-sm font-medium">Notas</span>
          <textarea
            className="w-full border rounded px-2 py-1 mt-1"
            rows={3}
            value={r.notes ?? ''}
            onChange={e => setR({ ...r, notes: e.target.value })}
          />
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-black text-white py-2 rounded mb-6 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <h3 className="font-semibold text-sm mb-2">Historial</h3>
        {Object.keys(historyByYear).length === 0 && (
          <div className="text-sm text-gray-400">Sin historial aún.</div>
        )}
        {Object.entries(historyByYear)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, entries]) => (
            <details key={year} className="mb-2" open={Number(year) === new Date().getFullYear()}>
              <summary className="cursor-pointer text-sm font-medium">
                {year} ({entries.length})
              </summary>
              <ul className="ml-4 mt-1 text-sm text-gray-700">
                {entries.map(e => (
                  <li key={e.id} className="border-l-2 border-gray-200 pl-2 my-1">
                    <div className="text-xs text-gray-500">
                      {new Date(e.logged_at).toLocaleDateString()}
                    </div>
                    <div>{e.action}</div>
                    {e.notes && <div className="text-xs text-gray-500">{e.notes}</div>}
                  </li>
                ))}
              </ul>
            </details>
          ))}
      </div>
    </div>
  )
}
