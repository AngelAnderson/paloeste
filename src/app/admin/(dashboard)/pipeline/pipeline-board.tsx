'use client'

import { useCallback, useMemo, useState } from 'react'
import { Plus, ChevronRight, Send, GripVertical, Zap } from 'lucide-react'
import type { Prospect } from '@/lib/types'
import { ProspectPanel } from '@/components/admin/prospect-panel'
import { SendMessageModal } from '@/components/admin/send-message-modal'

const STAGES = [
  { key: 'lead', db: 'lead', label: 'Lead', color: '#64748b' },
  { key: 'contacted', db: 'contacted', label: 'Contacted', color: '#38bdf8' },
  { key: 'pitched', db: 'pitched', label: 'Pitched', color: '#fbbf24' },
  { key: 'negotiating', db: 'negotiating', label: 'Negotiating', color: '#fb923c' },
  { key: 'won', db: 'closed_won', label: 'Won', color: '#4ade80' },
  { key: 'lost', db: 'closed_lost', label: 'Lost', color: '#f87171' },
] as const

type StageKey = typeof STAGES[number]['key']

function normalizeStage(stage: string): StageKey {
  const s = stage.replace('closed_', '')
  return (STAGES.some(st => st.key === s) ? s : 'lead') as StageKey
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

function daysOverdue(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export function PipelineBoard({ initialProspects }: { initialProspects: Prospect[] }) {
  const [prospects, setProspects] = useState(initialProspects)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [dragId, setDragId] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<StageKey | null>(null)
  const [modal, setModal] = useState<{ name: string; phone: string | null; message: string } | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/prospects')
      if (res.ok) setProspects(await res.json())
      else window.location.reload()
    } catch {
      window.location.reload()
    }
  }, [])

  function handleSaved() {
    setSelectedProspect(null)
    setShowCreate(false)
    refresh()
  }

  async function moveToStage(prospectId: string, target: StageKey) {
    const stageDef = STAGES.find(s => s.key === target)
    if (!stageDef) return
    const prev = prospects
    // Optimistic update
    setProspects(ps => ps.map(p => p.id === prospectId ? { ...p, stage: stageDef.db, last_contact_at: new Date().toISOString() } : p))
    try {
      const res = await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospectId, stage: stageDef.db }),
      })
      if (!res.ok) setProspects(prev)
    } catch {
      setProspects(prev)
    }
  }

  function handleDrop(target: StageKey) {
    if (dragId) moveToStage(dragId, target)
    setDragId(null)
    setDragOver(null)
  }

  async function quickAdvance(prospect: Prospect, e: React.MouseEvent) {
    e.stopPropagation()
    const idx = STAGES.findIndex(s => s.key === normalizeStage(prospect.stage))
    if (idx < 0 || idx >= STAGES.length - 2) return
    moveToStage(prospect.id, STAGES[idx + 1].key)
  }

  function openMessage(p: Prospect, e?: React.MouseEvent) {
    e?.stopPropagation()
    setModal({ name: p.business_name, phone: p.contact_phone, message: p.next_action || '' })
  }

  // Group + sort: overdue follow-ups first, then stale, then recent
  const grouped = useMemo(() => {
    const map = new Map<StageKey, Prospect[]>()
    for (const stage of STAGES) map.set(stage.key, [])
    for (const p of prospects) map.get(normalizeStage(p.stage))!.push(p)
    const today = new Date().toISOString().slice(0, 10)
    for (const list of map.values()) {
      list.sort((a, b) => {
        const aDue = a.next_action_date && a.next_action_date.slice(0, 10) <= today ? 0 : 1
        const bDue = b.next_action_date && b.next_action_date.slice(0, 10) <= today ? 0 : 1
        if (aDue !== bDue) return aDue - bDue
        const aDate = a.next_action_date || '9999'
        const bDate = b.next_action_date || '9999'
        if (aDate !== bDate) return aDate.localeCompare(bDate)
        return (b.proposed_amount_cents || 0) - (a.proposed_amount_cents || 0)
      })
    }
    return map
  }, [prospects])

  // Proactive strip: follow-ups due today or overdue, with a message ready
  const today = new Date().toISOString().slice(0, 10)
  const jugadas = useMemo(() =>
    prospects
      .filter(p => {
        const s = normalizeStage(p.stage)
        return s !== 'won' && s !== 'lost' && p.next_action_date && p.next_action_date.slice(0, 10) <= today
      })
      .sort((a, b) => (a.next_action_date || '').localeCompare(b.next_action_date || ''))
      .slice(0, 3)
  , [prospects, today])

  const totalValue = prospects
    .filter(p => normalizeStage(p.stage) !== 'lost')
    .reduce((sum, p) => sum + (p.proposed_amount_cents || 0), 0)

  const wonValue = prospects
    .filter(p => normalizeStage(p.stage) === 'won')
    .reduce((sum, p) => sum + (p.proposed_amount_cents || 0), 0)

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold">Pipeline</h1>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
          >
            <Plus size={14} />
            Nuevo Prospecto
          </button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <p className="text-[#64748b] text-sm">{prospects.length} prospects</p>
          <span className="text-sm text-[#4ade80] font-semibold">Won: ${(wonValue / 100).toLocaleString()}</span>
          <span className="text-sm text-[#fbbf24] font-semibold">Pipeline: ${(totalValue / 100).toLocaleString()}</span>
          <span className="hidden lg:inline text-xs text-[#475569] ml-auto">arrastra las cards entre columnas</span>
        </div>

        {/* Jugadas de hoy — proactive strip */}
        {jugadas.length > 0 && (
          <div className="mb-5 rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/5 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap size={13} className="text-[#fbbf24]" />
              <span className="text-xs font-semibold text-[#fbbf24] uppercase tracking-wider">Jugadas de hoy</span>
              <span className="text-[11px] text-[#64748b]">follow-ups vencidos con mensaje listo</span>
            </div>
            <div className="space-y-1.5">
              {jugadas.map(p => {
                const od = daysOverdue(p.next_action_date)
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <button onClick={() => setSelectedProspect(p)} className="font-medium text-sm text-white hover:text-[#38bdf8] transition-colors cursor-pointer truncate">
                      {p.business_name}
                    </button>
                    {od != null && od > 0 && <span className="text-[10px] font-bold text-[#f87171] shrink-0">{od}d tarde</span>}
                    <span className="text-xs text-[#94a3b8] truncate flex-1 hidden sm:inline">{p.next_action}</span>
                    {p.contact_phone && (
                      <button
                        onClick={(e) => openMessage(p, e)}
                        className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#fbbf24] text-[#0f172a] hover:bg-[#fde047] transition-colors cursor-pointer"
                      >
                        <Send size={11} />
                        Mensaje
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const items = grouped.get(stage.key) || []
            const colValue = items.reduce((s, p) => s + (p.proposed_amount_cents || 0), 0)
            const isTarget = dragOver === stage.key
            return (
              <div
                key={stage.key}
                className={`min-w-[260px] flex-1 rounded-xl transition-colors ${isTarget ? 'bg-[#38bdf8]/5 outline outline-1 outline-[#38bdf8]/40' : ''}`}
                onDragOver={(e) => { e.preventDefault(); if (dragOver !== stage.key) setDragOver(stage.key) }}
                onDragLeave={(e) => { if (e.currentTarget === e.target) setDragOver(null) }}
                onDrop={(e) => { e.preventDefault(); handleDrop(stage.key) }}
              >
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3 px-1 pt-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: stage.color }}>
                    {stage.label}
                  </span>
                  <span className="text-xs text-[#64748b] ml-auto tabular-nums">
                    {colValue > 0 && <span className="mr-1.5">${(colValue / 100).toLocaleString()}</span>}
                    {items.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="space-y-2 min-h-[60px] px-0.5 pb-1">
                  {items.map(p => {
                    const days = daysSince(p.last_contact_at || p.created_at)
                    const norm = normalizeStage(p.stage)
                    const isClosed = norm === 'won' || norm === 'lost'
                    const isStale = days !== null && days >= 7 && !isClosed
                    const od = daysOverdue(p.next_action_date)
                    const isDue = !isClosed && od != null && od >= 0
                    const canAdvance = !isClosed && norm !== 'negotiating'
                    const isDragging = dragId === p.id

                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={(e) => { setDragId(p.id); e.dataTransfer.effectAllowed = 'move' }}
                        onDragEnd={() => { setDragId(null); setDragOver(null) }}
                        onClick={() => setSelectedProspect(p)}
                        className={`group bg-[#1e293b] rounded-xl border p-4 cursor-pointer hover:border-[#38bdf8]/50 transition-all ${
                          isDragging ? 'opacity-40 scale-95' : ''
                        } ${isStale ? 'border-[#f87171]/50' : 'border-[#334155]'}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <GripVertical size={12} className="hidden lg:block shrink-0 text-[#334155] group-hover:text-[#64748b] cursor-grab" />
                            <div className="font-semibold text-sm truncate">{p.business_name}</div>
                          </div>
                          {isStale && (
                            <span className="text-[9px] font-bold uppercase bg-[#f87171] text-white px-1.5 py-0.5 rounded shrink-0 ml-1">
                              STALE
                            </span>
                          )}
                        </div>

                        {p.contact_name && (
                          <div className="text-xs text-[#94a3b8]">{p.contact_name}</div>
                        )}

                        {p.proposed_plan && (
                          <div className="text-xs text-[#64748b] mt-1">
                            {p.proposed_plan}
                            {p.proposed_amount_cents != null && (
                              <span className="text-[#4ade80] font-semibold ml-1">
                                ${(p.proposed_amount_cents / 100).toLocaleString()}
                              </span>
                            )}
                          </div>
                        )}

                        {p.next_action && (
                          <div className={`text-xs mt-1.5 line-clamp-2 ${isDue ? 'text-[#f87171]' : 'text-[#fbbf24]'}`}>
                            Next: {p.next_action}
                            {p.next_action_date && (
                              <span className={isDue ? 'font-bold ml-1' : 'text-[#64748b] ml-1'}>
                                ({isDue && od! > 0 ? `${od}d tarde` : new Date(p.next_action_date).toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Quick action bar */}
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#334155]/50">
                          {days !== null && (
                            <span className={`text-[10px] ${isStale ? 'text-[#f87171]' : 'text-[#64748b]'}`}>
                              {days === 0 ? 'Hoy' : `hace ${days}d`}
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-1">
                            {p.contact_phone && (
                              <button
                                onClick={(e) => openMessage(p, e)}
                                className="p-1 rounded hover:bg-[#334155] text-[#64748b] hover:text-[#4ade80] transition-colors cursor-pointer"
                                title="Enviar mensaje"
                              >
                                <Send size={11} />
                              </button>
                            )}
                            {canAdvance && (
                              <button
                                onClick={(e) => quickAdvance(p, e)}
                                className="p-1 rounded hover:bg-[#334155] text-[#64748b] hover:text-[#38bdf8] transition-colors cursor-pointer"
                                title="Avanzar stage"
                              >
                                <ChevronRight size={11} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}

                  {items.length === 0 && (
                    <div className={`text-xs text-center py-6 rounded-xl border border-dashed transition-colors ${
                      isTarget ? 'border-[#38bdf8]/50 text-[#38bdf8] bg-[#38bdf8]/5' : 'border-[#334155] text-[#475569] bg-[#1e293b]/50'
                    }`}>
                      {isTarget ? 'Suelta aquí' : 'Empty'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Prospect Panel */}
      {(selectedProspect || showCreate) && (
        <ProspectPanel
          prospect={selectedProspect}
          onClose={() => { setSelectedProspect(null); setShowCreate(false) }}
          onSaved={handleSaved}
        />
      )}

      {modal && (
        <SendMessageModal
          businessName={modal.name}
          phone={modal.phone}
          defaultMessage={modal.message}
          onClose={() => { setModal(null); refresh() }}
        />
      )}
    </>
  )
}
