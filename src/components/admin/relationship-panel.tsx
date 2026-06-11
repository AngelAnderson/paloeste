'use client'

import { useEffect, useState } from 'react'
import type { Relationship, RelationshipHistoryEntry } from '@/lib/types'

interface Props {
  relationship: Relationship
  onClose: () => void
  onUpdate: () => void
}

const inputCls = 'w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 mt-1 text-sm text-white focus:outline-none focus:border-[#38bdf8]'
const labelCls = 'text-xs font-medium text-[#94a3b8] uppercase tracking-wider'

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
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-[#0f172a] border-l border-[#334155] h-full overflow-y-auto p-6 shadow-2xl text-[#f1f5f9]"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">{r.name}</h2>
            <div className="text-sm text-[#64748b]">{r.type}</div>
          </div>
          <button onClick={onClose} className="text-[#64748b] hover:text-white cursor-pointer">✕</button>
        </div>

        <button
          onClick={markDone}
          disabled={logging}
          className="w-full bg-[#22c55e] text-[#0f172a] py-3 rounded-lg mb-3 font-semibold text-sm disabled:opacity-50 hover:bg-[#4ade80] transition-colors cursor-pointer"
        >
          {logging ? 'Guardando...' : '✓ Hecho (loggear contacto)'}
        </button>

        {r.contact_phone && (
          <button
            onClick={openWhatsApp}
            className="w-full bg-[#22c55e]/15 text-[#4ade80] border border-[#22c55e]/30 py-2 rounded-lg mb-4 text-sm hover:bg-[#22c55e]/25 transition-colors cursor-pointer"
          >
            WhatsApp · {r.contact_phone}
          </button>
        )}

        <label className="block mb-3">
          <span className={labelCls}>Próxima acción</span>
          <input
            className={inputCls}
            value={r.next_action ?? ''}
            onChange={e => setR({ ...r, next_action: e.target.value })}
          />
        </label>

        <label className="block mb-3">
          <span className={labelCls}>Fecha próxima acción</span>
          <input
            type="date"
            className={inputCls}
            value={r.next_action_date ?? ''}
            onChange={e => setR({ ...r, next_action_date: e.target.value || null })}
          />
        </label>

        <label className="block mb-3">
          <span className={labelCls}>Teléfono</span>
          <input
            className={inputCls}
            placeholder="+1787…"
            value={r.contact_phone ?? ''}
            onChange={e => setR({ ...r, contact_phone: e.target.value || null })}
          />
        </label>

        <label className="block mb-3">
          <span className={labelCls}>Cadencia</span>
          <select
            className={inputCls}
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
          <span className={labelCls}>Content cadence</span>
          <input
            className={inputCls}
            placeholder='ej: "2x/mes post FB"'
            value={r.content_cadence ?? ''}
            onChange={e => setR({ ...r, content_cadence: e.target.value || null })}
          />
        </label>

        <label className="block mb-3">
          <span className={labelCls}>Notas</span>
          <textarea
            className={inputCls}
            rows={3}
            value={r.notes ?? ''}
            onChange={e => setR({ ...r, notes: e.target.value })}
          />
        </label>

        <button
          onClick={save}
          disabled={saving}
          className="w-full bg-[#38bdf8] text-[#0f172a] font-semibold text-sm py-2.5 rounded-lg mb-6 disabled:opacity-50 hover:bg-[#7dd3fc] transition-colors cursor-pointer"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <h3 className="font-semibold text-sm mb-2 text-white">Historial</h3>
        {Object.keys(historyByYear).length === 0 && (
          <div className="text-sm text-[#64748b]">Sin historial aún.</div>
        )}
        {Object.entries(historyByYear)
          .sort(([a], [b]) => Number(b) - Number(a))
          .map(([year, entries]) => (
            <details key={year} className="mb-2" open={Number(year) === new Date().getFullYear()}>
              <summary className="cursor-pointer text-sm font-medium text-[#94a3b8] hover:text-white">
                {year} ({entries.length})
              </summary>
              <ul className="ml-4 mt-1 text-sm text-[#cbd5e1]">
                {entries.map(e => (
                  <li key={e.id} className="border-l-2 border-[#334155] pl-2 my-1">
                    <div className="text-xs text-[#64748b]">
                      {new Date(e.logged_at).toLocaleDateString('es-PR')}
                    </div>
                    <div>{e.action}</div>
                    {e.notes && <div className="text-xs text-[#64748b]">{e.notes}</div>}
                  </li>
                ))}
              </ul>
            </details>
          ))}
      </div>
    </div>
  )
}
