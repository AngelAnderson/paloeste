'use client'

import { useState, useCallback } from 'react'
import { Plus, ChevronRight, Send, Clock } from 'lucide-react'
import type { Prospect } from '@/lib/types'
import { ProspectPanel } from '@/components/admin/prospect-panel'

const STAGES = [
  { key: 'lead', label: 'Lead', color: '#64748b' },
  { key: 'contacted', label: 'Contacted', color: '#38bdf8' },
  { key: 'pitched', label: 'Pitched', color: '#fbbf24' },
  { key: 'negotiating', label: 'Negotiating', color: '#fb923c' },
  { key: 'won', label: 'Won', color: '#4ade80' },
  { key: 'lost', label: 'Lost', color: '#f87171' },
] as const

// Normalize DB stages to display stages
function normalizeStage(stage: string): string {
  if (stage === 'closed_won') return 'won'
  if (stage === 'closed_lost') return 'lost'
  return stage
}

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export function PipelineBoard({ initialProspects }: { initialProspects: Prospect[] }) {
  const [prospects, setProspects] = useState(initialProspects)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)
  const [showCreate, setShowCreate] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/prospects')
      if (res.ok) {
        const data = await res.json()
        setProspects(data)
      } else {
        // Fallback: reload page
        window.location.reload()
      }
    } catch {
      window.location.reload()
    }
  }, [])

  function handleSaved() {
    setSelectedProspect(null)
    setShowCreate(false)
    refresh()
  }

  async function quickAdvance(prospect: Prospect, e: React.MouseEvent) {
    e.stopPropagation()
    const current = normalizeStage(prospect.stage)
    const stageOrder = STAGES.map(s => s.key)
    const idx = stageOrder.indexOf(current as typeof STAGES[number]['key'])
    if (idx < 0 || idx >= stageOrder.length - 2) return // Can't advance past negotiating automatically
    const nextStage = stageOrder[idx + 1]

    try {
      await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospect.id, stage: nextStage }),
      })
      refresh()
    } catch { /* ignore */ }
  }

  // Group prospects by normalized stage
  const grouped = new Map<string, Prospect[]>()
  for (const stage of STAGES) grouped.set(stage.key, [])
  for (const p of prospects) {
    const norm = normalizeStage(p.stage)
    const list = grouped.get(norm)
    if (list) list.push(p)
    else grouped.get('lead')!.push(p)
  }

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
        <div className="flex items-center gap-4 mb-6">
          <p className="text-[#64748b] text-sm">{prospects.length} prospects</p>
          <span className="text-sm text-[#4ade80] font-semibold">Won: ${(wonValue / 100).toLocaleString()}</span>
          <span className="text-sm text-[#fbbf24] font-semibold">Pipeline: ${(totalValue / 100).toLocaleString()}</span>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const items = grouped.get(stage.key) || []
            return (
              <div key={stage.key} className="min-w-[260px] flex-1">
                {/* Column Header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                  <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: stage.color }}>
                    {stage.label}
                  </span>
                  <span className="text-xs text-[#64748b] ml-auto">{items.length}</span>
                </div>

                {/* Cards */}
                <div className="space-y-2">
                  {items.map(p => {
                    const days = daysSince(p.last_contact_at || p.created_at)
                    const isStale = days !== null && days >= 7 && normalizeStage(p.stage) !== 'won' && normalizeStage(p.stage) !== 'lost'
                    const canAdvance = normalizeStage(p.stage) !== 'won' && normalizeStage(p.stage) !== 'lost' && normalizeStage(p.stage) !== 'negotiating'

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedProspect(p)}
                        className={`bg-[#1e293b] rounded-xl border p-4 cursor-pointer hover:border-[#38bdf8]/50 transition-colors ${isStale ? 'border-[#f87171]/50' : 'border-[#334155]'}`}
                      >
                        <div className="flex items-start justify-between mb-1">
                          <div className="font-semibold text-sm">{p.business_name}</div>
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
                          <div className="text-xs text-[#fbbf24] mt-1.5 line-clamp-2">
                            Next: {p.next_action}
                            {p.next_action_date && (
                              <span className="text-[#64748b] ml-1">
                                ({new Date(p.next_action_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })})
                              </span>
                            )}
                          </div>
                        )}

                        {/* Quick action bar */}
                        <div className="flex items-center gap-1 mt-2 pt-2 border-t border-[#334155]/50">
                          {days !== null && (
                            <span className={`text-[10px] ${isStale ? 'text-[#f87171]' : 'text-[#64748b]'}`}>
                              {days === 0 ? 'Today' : `${days}d ago`}
                            </span>
                          )}
                          <div className="ml-auto flex items-center gap-1">
                            {p.contact_phone && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setSelectedProspect(p) }}
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
                                title="Advance stage"
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
                    <div className="text-xs text-[#475569] text-center py-6 bg-[#1e293b]/50 rounded-xl border border-dashed border-[#334155]">
                      Empty
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
    </>
  )
}
