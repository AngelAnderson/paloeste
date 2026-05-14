'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { CarteraPendingDecision } from '@/lib/admin-queries'
import { approveDecision, editDecision, rejectDecision } from './actions'

const ACTION_META: Record<string, { label: string; icon: string; color: string }> = {
  send_wa:       { label: 'WhatsApp',   icon: '💬', color: '#4ade80' },
  send_email:    { label: 'Email',      icon: '📧', color: '#38bdf8' },
  publish_fb:    { label: 'FB post',    icon: '📘', color: '#3b82f6' },
  publish_blog:  { label: 'Blog post',  icon: '📝', color: '#a78bfa' },
  send_newsletter: { label: 'Newsletter', icon: '📰', color: '#f472b6' },
  db_mutation:   { label: 'DB change',  icon: '🗄️', color: '#fbbf24' },
  pay:           { label: 'Pago',       icon: '💰', color: '#f87171' },
  commit_code:   { label: 'Code commit', icon: '⚙️', color: '#94a3b8' },
  contact_lead:  { label: 'Contact lead', icon: '🎯', color: '#fbbf24' },
  other:         { label: 'Otro',       icon: '·', color: '#64748b' },
}

interface Props {
  decisions: CarteraPendingDecision[]
}

function ageColor(ageHours: number): string {
  if (ageHours < 12) return '#4ade80'
  if (ageHours < 48) return '#fbbf24'
  return '#f87171'
}

function formatAge(ageHours: number): string {
  if (ageHours < 1) return `${Math.round(ageHours * 60)}m`
  if (ageHours < 48) return `${Math.round(ageHours)}h`
  return `${Math.round(ageHours / 24)}d`
}

export function DecisionsView({ decisions }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function onApprove(id: number) {
    if (!confirm('¿Aprobar y ejecutar este draft?')) return
    startTransition(async () => {
      try {
        const result = await approveDecision(id)
        if (!result.ok) alert(`Error: ${result.message}`)
        else router.refresh()
      } catch (e: unknown) {
        alert(`Error: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  function onEditStart(decision: CarteraPendingDecision) {
    setEditingId(decision.id)
    setEditText(decision.preview)
  }

  function onEditConfirm() {
    if (editingId === null) return
    const id = editingId
    const text = editText
    if (!confirm('¿Guardar edición y ejecutar?')) return
    startTransition(async () => {
      try {
        const result = await editDecision(id, text)
        if (!result.ok) alert(`Error: ${result.message}`)
        else {
          setEditingId(null)
          setEditText('')
          router.refresh()
        }
      } catch (e: unknown) {
        alert(`Error: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  function onRejectStart(id: number) {
    setRejectingId(id)
    setRejectReason('')
  }

  function onRejectConfirm() {
    if (rejectingId === null) return
    const id = rejectingId
    const reason = rejectReason
    startTransition(async () => {
      try {
        const result = await rejectDecision(id, reason || undefined)
        if (!result.ok) alert(`Error: ${result.message}`)
        else {
          setRejectingId(null)
          setRejectReason('')
          router.refresh()
        }
      } catch (e: unknown) {
        alert(`Error: ${e instanceof Error ? e.message : String(e)}`)
      }
    })
  }

  if (decisions.length === 0) {
    return (
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-8 text-center">
        <div className="text-3xl mb-2">✨</div>
        <p className="text-[#94a3b8] text-sm">Inbox vacío. Tu equipo no tiene drafts esperando.</p>
        <p className="text-[#475569] text-xs mt-1">Cuando María, Yolanda, Kelo, o Recuerda preparen algo, aparecerá acá.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {decisions.map(d => {
        const meta = ACTION_META[d.action_type] || ACTION_META.other
        const isEditing = editingId === d.id
        const isRejecting = rejectingId === d.id
        return (
          <div key={d.id} className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
            {/* Header: persona + tenant + action + age */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-white">👤 {d.persona_name}</span>
                  <Link href={`/admin/cartera/${encodeURIComponent(d.tenant_id)}`} className="text-xs text-[#38bdf8] hover:underline">
                    {d.tenant_name}
                  </Link>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                  >
                    {meta.icon} {meta.label}
                  </span>
                </div>
                <div className="text-xs text-[#64748b] mt-1">
                  <Link href={`/admin/agentes/${encodeURIComponent(d.agent_id)}`} className="hover:underline">
                    agent: {d.agent_id}
                  </Link>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div style={{ color: ageColor(d.age_hours) }} className="text-xs font-semibold">
                  {formatAge(d.age_hours)}
                </div>
                <div className="text-[10px] text-[#475569]">#{d.id}</div>
              </div>
            </div>

            {/* Preview or edit textarea */}
            {isEditing ? (
              <div className="bg-[#0f172a] border border-[#fbbf24]/40 rounded-lg p-3 mb-3">
                <div className="text-[10px] uppercase tracking-wider text-[#fbbf24] mb-2">Editando draft</div>
                <textarea
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  rows={8}
                  className="w-full bg-[#1e293b] border border-[#334155] rounded p-3 text-sm text-[#f1f5f9] font-mono"
                />
              </div>
            ) : (
              <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 mb-3">
                <div className="text-[10px] uppercase tracking-wider text-[#64748b] mb-2">Preview</div>
                <div className="text-sm text-[#f1f5f9] whitespace-pre-wrap">{d.preview}</div>
              </div>
            )}

            {/* Reject reason input */}
            {isRejecting && (
              <div className="bg-[#0f172a] border border-[#f87171]/40 rounded-lg p-3 mb-3">
                <div className="text-[10px] uppercase tracking-wider text-[#f87171] mb-2">Motivo (opcional)</div>
                <input
                  type="text"
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="Ej: muy formal, no aplica este sponsor, etc."
                  className="w-full bg-[#1e293b] border border-[#334155] rounded p-2 text-sm text-[#f1f5f9]"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={onEditConfirm}
                    disabled={pending}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#fbbf24] text-[#0f172a] hover:bg-[#f59e0b] disabled:opacity-50"
                  >
                    ✏️ Guardar + Enviar
                  </button>
                  <button
                    onClick={() => { setEditingId(null); setEditText('') }}
                    disabled={pending}
                    className="px-4 py-2 rounded-lg text-sm bg-[#334155] text-[#94a3b8] hover:bg-[#475569] disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </>
              ) : isRejecting ? (
                <>
                  <button
                    onClick={onRejectConfirm}
                    disabled={pending}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#f87171] text-white hover:bg-[#ef4444] disabled:opacity-50"
                  >
                    ❌ Confirmar rechazo
                  </button>
                  <button
                    onClick={() => { setRejectingId(null); setRejectReason('') }}
                    disabled={pending}
                    className="px-4 py-2 rounded-lg text-sm bg-[#334155] text-[#94a3b8] hover:bg-[#475569] disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onApprove(d.id)}
                    disabled={pending}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#4ade80] text-[#0f172a] hover:bg-[#22c55e] disabled:opacity-50"
                  >
                    ✅ Aprobar
                  </button>
                  <button
                    onClick={() => onEditStart(d)}
                    disabled={pending}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#fbbf24]/20 text-[#fbbf24] hover:bg-[#fbbf24]/30 disabled:opacity-50"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    onClick={() => onRejectStart(d.id)}
                    disabled={pending}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#f87171]/20 text-[#f87171] hover:bg-[#f87171]/30 disabled:opacity-50"
                  >
                    ❌ Rechazar
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
