'use client'

import { useState } from 'react'
import { X, Check, Copy, Loader2 } from 'lucide-react'
import type { UnbilledBusiness } from '@/lib/admin-queries'
import type { OverdueRelationship } from '@/lib/types'
import { markBusinessBilled, logRelationshipTouch } from '@/app/admin/(dashboard)/eod-actions'

type CobroAnswer = 'pending' | 'si' | 'no' | 'manana'
type RelAnswer = 'pending' | 'si' | 'no'

export function EodModal({
  cobros,
  rels,
  onClose,
}: {
  cobros: UnbilledBusiness[]
  rels: OverdueRelationship[]
  onClose: () => void
}) {
  const topCobros = cobros.slice(0, 5)
  const topRels = rels.slice(0, 5)

  const [cobroAnswers, setCobroAnswers] = useState<Record<string, CobroAnswer>>(
    Object.fromEntries(topCobros.map(c => [c.business_id, 'pending'])),
  )
  const [relAnswers, setRelAnswers] = useState<Record<string, RelAnswer>>(
    Object.fromEntries(topRels.map(r => [r.id, 'pending'])),
  )
  const [note, setNote] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  async function handleSubmit() {
    setSubmitting(true)
    const cobradosResult: string[] = []
    const tocadosResult: string[] = []
    const errors: string[] = []

    for (const c of topCobros) {
      if (cobroAnswers[c.business_id] === 'si') {
        try {
          const r = await markBusinessBilled(c.business_id)
          cobradosResult.push(`${c.business_name} ($${(c.total_cents / 100).toFixed(0)}, ${r.updated} leads)`)
        } catch (e) {
          errors.push(`${c.business_name}: ${(e as Error).message}`)
        }
      }
    }

    for (const r of topRels) {
      if (relAnswers[r.id] === 'si') {
        try {
          await logRelationshipTouch(r.id, 'EOD reconciliation', note || undefined)
          tocadosResult.push(r.name)
        } catch (e) {
          errors.push(`${r.name}: ${(e as Error).message}`)
        }
      }
    }

    const today = new Date().toLocaleDateString('es-PR', { weekday: 'long', month: 'long', day: 'numeric' })
    const lines: string[] = [`### Cierre del día — ${today}`]
    if (cobradosResult.length > 0) {
      lines.push('', '**💰 Cobrado:**')
      cobradosResult.forEach(c => lines.push(`- ${c}`))
    }
    if (tocadosResult.length > 0) {
      lines.push('', '**❤️ Tocado:**')
      tocadosResult.forEach(n => lines.push(`- ${n}`))
    }
    const mananaCobros = topCobros.filter(c => cobroAnswers[c.business_id] === 'manana')
    if (mananaCobros.length > 0) {
      lines.push('', '**📌 Mañana:**')
      mananaCobros.forEach(c => lines.push(`- ${c.business_name} ($${(c.total_cents / 100).toFixed(0)})`))
    }
    if (note.trim()) {
      lines.push('', '**📝 Nota:**', note.trim())
    }
    if (errors.length > 0) {
      lines.push('', '**⚠️ Errores:**')
      errors.forEach(e => lines.push(`- ${e}`))
    }
    setSummary(lines.join('\n'))
    setSubmitting(false)
  }

  function copySummary() {
    if (summary) navigator.clipboard.writeText(summary).catch(() => {})
  }

  function handleClose() {
    onClose()
    if (summary) {
      // Force a refresh so the dashboard reflects the changes (cobros marked, etc.)
      window.location.reload()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-[#1e293b] border-b border-[#334155] px-5 py-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">🌙 Cierra el día</h2>
            <p className="text-xs text-[#64748b]">Reconcilia lo que pasó hoy</p>
          </div>
          <button onClick={handleClose} className="text-[#64748b] hover:text-white" aria-label="Cerrar">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {summary ? (
            <div className="space-y-3">
              <pre className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-xs text-[#94a3b8] whitespace-pre-wrap font-mono">
                {summary}
              </pre>
              <div className="flex gap-2">
                <button
                  onClick={copySummary}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8]/30 transition-colors"
                >
                  <Copy size={14} />
                  Copiar para handoff
                </button>
                <button
                  onClick={handleClose}
                  className="px-3 py-2 rounded-lg text-sm font-medium bg-[#334155] text-[#94a3b8] hover:bg-[#475569] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <>
              {topCobros.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[#f87171] uppercase tracking-wider mb-2">💰 Cobros</h3>
                  <div className="space-y-2">
                    {topCobros.map(c => (
                      <div key={c.business_id} className="flex items-center gap-3 bg-[#0f172a] border border-[#334155] rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{c.business_name}</div>
                          <div className="text-xs text-[#64748b]">
                            ${(c.total_cents / 100).toFixed(0)} · {c.lead_count} leads
                          </div>
                        </div>
                        <ChoiceGroup
                          value={cobroAnswers[c.business_id]}
                          options={[
                            { value: 'si', label: 'Sí', color: '#4ade80' },
                            { value: 'no', label: 'No', color: '#64748b' },
                            { value: 'manana', label: 'Mañana', color: '#fbbf24' },
                          ]}
                          onChange={(v) => setCobroAnswers({ ...cobroAnswers, [c.business_id]: v as CobroAnswer })}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {topRels.length > 0 && (
                <section>
                  <h3 className="text-sm font-semibold text-[#fbbf24] uppercase tracking-wider mb-2">❤️ Relaciones</h3>
                  <div className="space-y-2">
                    {topRels.map(r => (
                      <div key={r.id} className="flex items-center gap-3 bg-[#0f172a] border border-[#334155] rounded-lg p-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-white truncate">{r.name}</div>
                          <div className="text-xs text-[#64748b]">
                            {r.type} · {r.days_since_contact}d sin contacto
                          </div>
                        </div>
                        <ChoiceGroup
                          value={relAnswers[r.id]}
                          options={[
                            { value: 'si', label: 'Sí', color: '#4ade80' },
                            { value: 'no', label: 'No', color: '#64748b' },
                          ]}
                          onChange={(v) => setRelAnswers({ ...relAnswers, [r.id]: v as RelAnswer })}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {topCobros.length === 0 && topRels.length === 0 && (
                <p className="text-[#64748b] text-sm">Nada pendiente para reconciliar. 🎉</p>
              )}

              <section>
                <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">📝 Nota libre</h3>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Algo que pasó hoy y debas recordar mañana..."
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-sm text-white placeholder-[#475569] focus:outline-none focus:border-[#38bdf8] min-h-[80px]"
                />
              </section>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#334155]">
                <button
                  onClick={handleClose}
                  className="px-3 py-2 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  {submitting ? 'Guardando...' : 'Cerrar el día'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function ChoiceGroup({
  value,
  options,
  onChange,
}: {
  value: string
  options: { value: string; label: string; color: string }[]
  onChange: (v: string) => void
}) {
  return (
    <div className="flex gap-1 shrink-0">
      {options.map(opt => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="text-[10px] font-bold uppercase px-2 py-1 rounded transition-colors"
            style={{
              backgroundColor: selected ? opt.color + '40' : 'transparent',
              color: selected ? opt.color : '#64748b',
              border: `1px solid ${selected ? opt.color : '#334155'}`,
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
