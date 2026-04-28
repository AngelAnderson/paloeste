'use client'

import Link from 'next/link'
import { Send, ChevronRight, Zap } from 'lucide-react'
import type { RankedAction } from '@/lib/admin-action-ranker'

const TYPE_META: Record<RankedAction['type'], { label: string; emoji: string; color: string }> = {
  follow_up: { label: 'Follow-up', emoji: '📞', color: '#fbbf24' },
  unbilled: { label: 'Cobrar', emoji: '💰', color: '#f87171' },
  pitch: { label: 'Pitchear', emoji: '🎯', color: '#a78bfa' },
  sponsor_risk: { label: 'Sponsor en riesgo', emoji: '⚠️', color: '#fb923c' },
}

export function TopThreeHero({
  actions,
  onAction,
}: {
  actions: RankedAction[]
  onAction: (action: RankedAction) => void
}) {
  if (actions.length === 0) return null

  const top = actions.slice(0, 3)

  return (
    <section className="bg-gradient-to-br from-[#1e293b] to-[#0f172a] rounded-xl border border-[#38bdf8]/30 p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Zap size={16} className="text-[#38bdf8]" />
        <h2 className="text-sm font-semibold text-[#38bdf8] uppercase tracking-wider">Top 3 Hoy</h2>
        <span className="text-xs text-[#64748b]">Ranked por $$ × urgencia</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {top.map((action, idx) => {
          const meta = TYPE_META[action.type]
          return (
            <div
              key={action.id}
              className="bg-[#0f172a] rounded-lg border border-[#334155] p-4 flex flex-col gap-2 hover:border-[#475569] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#64748b]">#{idx + 1}</span>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                  style={{ backgroundColor: meta.color + '30', color: meta.color }}
                >
                  {meta.emoji} {meta.label}
                </span>
              </div>

              <Link
                href={action.href}
                className="font-semibold text-sm text-white hover:text-[#38bdf8] transition-colors line-clamp-1"
              >
                {action.title}
              </Link>

              <p className="text-xs text-[#94a3b8] line-clamp-2 min-h-[2rem]">{action.reason}</p>

              {action.amountCents != null && action.amountCents > 0 && (
                <div className="text-xl font-bold text-[#4ade80]">
                  ${(action.amountCents / 100).toLocaleString()}
                </div>
              )}

              <button
                onClick={() => onAction(action)}
                className="mt-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
              >
                {action.ctaLabel === 'Pipeline' ? (
                  <ChevronRight size={14} />
                ) : (
                  <Send size={14} />
                )}
                {action.ctaLabel}
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
