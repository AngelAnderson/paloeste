import { getBotIntelligence } from '@/lib/admin-queries'
import { DailyVolumeChart, UserGrowthChart } from './bot-charts'

export const dynamic = 'force-dynamic'

export default async function BotPage() {
  const intel = await getBotIntelligence()

  const totalMessages = intel.daily_volume.reduce((sum, d) => sum + d.inbound + d.outbound, 0)
  const totalUsers = intel.user_growth.reduce((sum, m) => sum + m.new_users, 0)
  const failPct = intel.fail_rate.total > 0 ? ((intel.fail_rate.failures / intel.fail_rate.total) * 100).toFixed(1) : '0'
  const failIsGood = Number(failPct) < 5

  const maxIntent = Math.max(...intel.intent_distribution.map(i => i.count), 1)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Bot Health</h1>
      <p className="text-[#64748b] text-sm mb-6">*7711 bot performance and user intelligence.</p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Messages (7d)</div>
          <div className="text-2xl font-bold mt-1 text-[#38bdf8]">{totalMessages.toLocaleString()}</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Users (7d)</div>
          <div className="text-2xl font-bold mt-1 text-[#4ade80]">{totalUsers.toLocaleString()}</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Fail Rate</div>
          <div className={`text-2xl font-bold mt-1 ${failIsGood ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{failPct}%</div>
          <div className="text-xs text-[#64748b] mt-0.5">{intel.fail_rate.failures}/{intel.fail_rate.total}</div>
        </div>
        <div className={`rounded-xl border p-4 ${failIsGood ? 'bg-[#4ade80]/10 border-[#4ade80]/30' : 'bg-[#f87171]/10 border-[#f87171]/30'}`}>
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Status</div>
          <div className={`text-2xl font-bold mt-1 ${failIsGood ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>
            {failIsGood ? 'HEALTHY' : 'DEGRADED'}
          </div>
        </div>
      </div>

      {/* Intent Distribution */}
      {intel.intent_distribution.length > 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Intent Distribution</h2>
          <div className="space-y-2">
            {intel.intent_distribution.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-[#94a3b8] w-32 shrink-0 truncate">{item.intent}</span>
                <div className="flex-1 bg-[#334155] rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-[#38bdf8] transition-all"
                    style={{ width: `${(item.count / maxIntent) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-[#38bdf8] w-12 text-right">{item.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Queries */}
      {intel.top_queries.length > 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Top Queries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            {intel.top_queries.slice(0, 20).map((q, i) => (
              <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-[#334155]">
                <span className="text-[#e2e8f0] truncate">{q.query}</span>
                <span className="text-[#38bdf8] font-semibold ml-2 shrink-0">{q.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DailyVolumeChart data={intel.daily_volume} />
        <UserGrowthChart data={intel.user_growth} />
      </div>
    </div>
  )
}
