'use client'

import { useState, useTransition } from 'react'
import type { AgentProposal } from '@/lib/admin-queries'
import { reviewAgentProposal } from './actions'

const RISK_CLASS: Record<AgentProposal['risk_level'], string> = {
  low: 'bg-[#22c55e]/15 text-[#4ade80] border-[#22c55e]/25',
  medium: 'bg-[#fbbf24]/15 text-[#fbbf24] border-[#fbbf24]/25',
  high: 'bg-[#fb923c]/15 text-[#fb923c] border-[#fb923c]/25',
  critical: 'bg-[#f87171]/15 text-[#f87171] border-[#f87171]/25',
}

function formatAge(date: string): string {
  const hours = Math.max(0, (Date.now() - new Date(date).getTime()) / 36e5)
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 48) return `${Math.round(hours)}h`
  return `${Math.round(hours / 24)}d`
}

function previewJson(value: unknown): string {
  if (value == null) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function AgentProposalsView({ proposals }: { proposals: AgentProposal[] }) {
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function review(id: string, status: 'approved' | 'rejected' | 'applied') {
    setPendingId(id)
    setMessage(null)
    startTransition(async () => {
      const result = await reviewAgentProposal(id, status)
      setMessage(result.ok ? `Propuesta ${result.message}` : result.message)
      setPendingId(null)
    })
  }

  if (proposals.length === 0) {
    return (
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-center">
        <div className="text-2xl mb-2">🧠</div>
        <p className="text-[#94a3b8] text-sm">No hay propuestas de Mission Control esperando.</p>
        <p className="text-[#475569] text-xs mt-1">El brief diario escribirá aquí solo drafts revisables.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-[#334155] bg-[#0f172a] px-3 py-2 text-xs text-[#cbd5e1]">
          {message}
        </div>
      )}
      {proposals.map((p) => (
        <div key={p.id} className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold text-white">🧠 {p.agent_name}</span>
                <span className="text-xs text-[#38bdf8]">{p.proposal_type}</span>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${RISK_CLASS[p.risk_level]}`}>
                  {p.risk_level}
                </span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#0f172a] border border-[#334155] text-[#94a3b8]">
                  {p.status}
                </span>
              </div>
              <h3 className="text-sm font-semibold mt-2">{p.title}</h3>
              <p className="text-xs text-[#94a3b8] mt-1">{p.rationale}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs text-[#64748b]">{formatAge(p.created_at)}</div>
              <div className="text-[10px] text-[#475569] font-mono">{p.id.slice(0, 8)}</div>
            </div>
          </div>

          {(p.target_table || p.target_id) && (
            <div className="text-xs text-[#64748b] mb-3">
              Target: <span className="font-mono text-[#94a3b8]">{p.target_table || 'unknown'}</span>
              {p.target_id && <span className="font-mono text-[#94a3b8]"> / {p.target_id}</span>}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-2">Evidence</div>
              <pre className="text-xs text-[#cbd5e1] whitespace-pre-wrap overflow-auto max-h-56">{previewJson(p.evidence)}</pre>
            </div>
            <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3">
              <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-2">Proposed patch</div>
              <pre className="text-xs text-[#cbd5e1] whitespace-pre-wrap overflow-auto max-h-56">{previewJson(p.proposed_patch)}</pre>
            </div>
          </div>

          {p.rollback_plan && (
            <div className="mt-3 text-xs text-[#94a3b8]">
              <span className="text-[#64748b] uppercase tracking-wider text-[10px] mr-2">Rollback</span>
              {p.rollback_plan}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#334155] pt-4">
            <div className="basis-full text-xs text-[#94a3b8] mb-1">
              Aprobar la convierte en una decisión ejecutable arriba. Cerrar como hecho solo archiva la propuesta cuando ya resolviste la acción afuera. Rechazar la descarta.
            </div>
            <button
              type="button"
              onClick={() => review(p.id, 'approved')}
              disabled={isPending || pendingId === p.id}
              className="rounded-lg bg-[#38bdf8] px-3 py-2 text-xs font-semibold text-[#020617] hover:bg-[#7dd3fc] disabled:cursor-not-allowed disabled:opacity-60"
              title="Convierte esta propuesta en una decisión ejecutable; no envía mensajes ni cambia datos core."
            >
              Aprobar
            </button>
            <button
              type="button"
              onClick={() => review(p.id, 'applied')}
              disabled={isPending || pendingId === p.id}
              className="rounded-lg bg-[#22c55e] px-3 py-2 text-xs font-semibold text-[#052e16] hover:bg-[#4ade80] disabled:cursor-not-allowed disabled:opacity-60"
              title="Cierra la propuesta porque ya hiciste la acción fuera de este flujo."
            >
              Cerrar como hecho
            </button>
            <button
              type="button"
              onClick={() => review(p.id, 'rejected')}
              disabled={isPending || pendingId === p.id}
              className="rounded-lg border border-[#475569] px-3 py-2 text-xs font-semibold text-[#cbd5e1] hover:border-[#f87171] hover:text-[#fecaca] disabled:cursor-not-allowed disabled:opacity-60"
              title="Descarta la propuesta; no borra datos core."
            >
              Rechazar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
