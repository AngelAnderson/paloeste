import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import type { BotIntelligence } from '@/lib/types'

export function BotPulseCard({ intel }: { intel: BotIntelligence }) {
  const volume = intel.daily_volume
  const totalsByDay = volume.map(d => d.inbound + d.outbound)
  const total7d = totalsByDay.reduce((s, n) => s + n, 0)
  const todayTotal = totalsByDay[totalsByDay.length - 1] || 0
  const yesterdayTotal = totalsByDay[totalsByDay.length - 2] || 0
  const delta = yesterdayTotal > 0
    ? Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100)
    : null

  const failPct = intel.fail_rate.total > 0
    ? (intel.fail_rate.failures / intel.fail_rate.total) * 100
    : 0
  const answeredPct = 100 - failPct
  const healthColor = failPct < 5 ? '#4ade80' : failPct < 15 ? '#fbbf24' : '#f87171'
  const healthLabel = failPct < 5 ? 'Saludable' : failPct < 15 ? 'OK' : 'Degradado'

  const topQuery = intel.top_queries[0]

  const sparkMax = Math.max(...totalsByDay, 1)

  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Bot *7711</h2>
        </div>
        <Link
          href="/admin/bot"
          className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#38bdf8] transition-colors"
        >
          Ver
          <ChevronRight size={12} />
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Hoy</div>
          <div className="text-2xl font-bold text-[#38bdf8]">{todayTotal}</div>
          {delta != null && (
            <div className={`text-xs ${delta >= 0 ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
              {delta >= 0 ? '+' : ''}{delta}% vs ayer
            </div>
          )}
        </div>
        <div>
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">7d total</div>
          <div className="text-2xl font-bold text-white">{total7d}</div>
        </div>
        <div>
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Respondidas</div>
          <div className="text-2xl font-bold" style={{ color: healthColor }}>{answeredPct.toFixed(0)}%</div>
          <div className="text-xs" style={{ color: healthColor }}>{healthLabel}</div>
        </div>
      </div>

      {totalsByDay.length > 1 && (
        <div className="flex items-end gap-1 h-10">
          {totalsByDay.map((n, i) => (
            <div
              key={i}
              className="flex-1 bg-[#38bdf8]/30 rounded-sm"
              style={{ height: `${Math.max((n / sparkMax) * 100, 4)}%` }}
              title={`${volume[i]?.day}: ${n} msgs`}
            />
          ))}
        </div>
      )}

      {topQuery && (
        <div className="text-xs">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Top query 7d</div>
          <Link
            href={`/admin/bot`}
            className="text-[#94a3b8] hover:text-[#38bdf8] transition-colors line-clamp-1"
          >
            &quot;{topQuery.query}&quot; · {topQuery.count}x
          </Link>
        </div>
      )}
    </div>
  )
}
