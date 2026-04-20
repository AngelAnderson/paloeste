import { getBotIntelligence, getMessageFeedback } from '@/lib/admin-queries'
import { DailyVolumeChart, UserGrowthChart } from './bot-charts'
import { QueryActions } from './query-actions'

export const dynamic = 'force-dynamic'

function generateInsights(intel: Awaited<ReturnType<typeof getBotIntelligence>>) {
  const insights: { type: 'success' | 'warning' | 'action'; text: string }[] = []

  // Fail rate insight
  const failPct = intel.fail_rate.total > 0 ? (intel.fail_rate.failures / intel.fail_rate.total) * 100 : 0
  if (failPct < 5) {
    insights.push({ type: 'success', text: `Fail rate at ${failPct.toFixed(1)}% — bot is answering well.` })
  } else if (failPct < 15) {
    insights.push({ type: 'warning', text: `Fail rate at ${failPct.toFixed(1)}% — review top failing queries and add local_knowledge entries.` })
  } else {
    insights.push({ type: 'warning', text: `Fail rate at ${failPct.toFixed(1)}% — critical. Many users getting bad answers. Audit needed.` })
  }

  // closed_now insight
  const closedNow = intel.intent_distribution.find(i => i.intent === 'closed_now')
  const totalIntents = intel.intent_distribution.reduce((s, i) => s + i.count, 0)
  if (closedNow && totalIntents > 0 && (closedNow.count / totalIntents) > 0.15) {
    insights.push({ type: 'action', text: `${((closedNow.count / totalIntents) * 100).toFixed(0)}% of queries hit closed businesses. Consider a FB post: "El Veci trabaja 24/7 — textea cuando quieras."` })
  }

  // Volume pattern
  const volume = intel.daily_volume
  if (volume.length >= 2) {
    const peakDay = volume.reduce((max, d) => (d.inbound + d.outbound > max.inbound + max.outbound ? d : max), volume[0])
    const dayName = new Date(peakDay.day).toLocaleDateString('es', { weekday: 'long' })
    insights.push({ type: 'action', text: `Peak day: ${dayName} (${peakDay.inbound + peakDay.outbound} msgs). Schedule FB posts the night before to maximize traffic.` })
  }

  // User growth
  const growth = intel.user_growth
  if (growth.length >= 2) {
    const last = growth[growth.length - 1]
    const prev = growth[growth.length - 2]
    if (prev.new_users > 0) {
      const growthRate = ((last.new_users - prev.new_users) / prev.new_users * 100).toFixed(0)
      if (Number(growthRate) > 0) {
        insights.push({ type: 'success', text: `User growth: +${growthRate}% vs last month (${last.new_users} new users in ${last.month}).` })
      } else {
        insights.push({ type: 'warning', text: `User growth slowed: ${growthRate}% vs last month. Push more FB posts with the 787-417-7711 CTA.` })
      }
    }
  }

  // Top query opportunity
  const topQ = intel.top_queries[0]
  if (topQ && topQ.count >= 3) {
    insights.push({ type: 'action', text: `"${topQ.query}" was searched ${topQ.count} times this week. Verify the bot answer is excellent — or create a FB post about it.` })
  }

  return insights
}

export default async function BotPage() {
  const [intel, feedback] = await Promise.all([
    getBotIntelligence(),
    getMessageFeedback('pending'),
  ])

  const totalMessages = intel.daily_volume.reduce((sum, d) => sum + d.inbound + d.outbound, 0)
  const totalUsers = intel.user_growth.reduce((sum, m) => sum + m.new_users, 0)
  const failPct = intel.fail_rate.total > 0 ? ((intel.fail_rate.failures / intel.fail_rate.total) * 100).toFixed(1) : '0'
  const failIsGood = Number(failPct) < 5

  const maxIntent = Math.max(...intel.intent_distribution.map(i => i.count), 1)
  const insights = generateInsights(intel)

  const intentLabels: Record<string, string> = {
    ai_places: 'Buscando negocios',
    closed_now: 'Negocio cerrado',
    ai_conversation: 'Conversación',
    ai_events: 'Eventos',
    ranking: 'Rankings / mejores',
    explore: 'Explorar pueblo',
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">El Veci — Command Center</h1>
      <p className="text-[#64748b] text-sm mb-6">Tu vecino digital de Cabo Rojo · 787-417-7711</p>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">💡 Insights & Actions</h2>
          <div className="space-y-2">
            {insights.map((insight, i) => (
              <div key={i} className={`flex items-start gap-2 text-sm rounded-lg px-3 py-2 ${
                insight.type === 'success' ? 'bg-[#4ade80]/10 text-[#4ade80]' :
                insight.type === 'warning' ? 'bg-[#f87171]/10 text-[#f87171]' :
                'bg-[#38bdf8]/10 text-[#38bdf8]'
              }`}>
                <span className="shrink-0 mt-0.5">
                  {insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : '👉'}
                </span>
                <span>{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Messages (7d)</div>
          <div className="text-2xl font-bold mt-1 text-[#38bdf8]">{totalMessages.toLocaleString()}</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Users (Total)</div>
          <div className="text-2xl font-bold mt-1 text-[#4ade80]">{totalUsers.toLocaleString()}</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Fail Rate</div>
          <div className={`text-2xl font-bold mt-1 ${failIsGood ? 'text-[#4ade80]' : 'text-[#f87171]'}`}>{failPct}%</div>
          <div className="text-xs text-[#64748b] mt-0.5">{intel.fail_rate.failures} bad answers / {intel.fail_rate.total} msgs</div>
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
          <p className="text-xs text-[#64748b] mb-3">How the bot classified each incoming message this week.</p>
          <div className="space-y-2">
            {intel.intent_distribution.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="text-sm text-[#94a3b8] w-40 shrink-0 truncate" title={item.intent}>
                  {intentLabels[item.intent] || item.intent}
                </span>
                <div className="flex-1 bg-[#334155] rounded-full h-3">
                  <div
                    className="h-3 rounded-full bg-[#38bdf8] transition-all"
                    style={{ width: `${(item.count / maxIntent) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-[#38bdf8] w-12 text-right">{item.count}</span>
                <span className="text-xs text-[#64748b] w-12 text-right">
                  {intel.intent_distribution.reduce((s, x) => s + x.count, 0) > 0
                    ? `${((item.count / intel.intent_distribution.reduce((s, x) => s + x.count, 0)) * 100).toFixed(0)}%`
                    : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top Queries — now interactive */}
      {intel.top_queries.length > 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Top Queries</h2>
          <p className="text-xs text-[#64748b] mb-3">Most searched terms this week. Click to test the bot or create content.</p>
          <QueryActions queries={intel.top_queries.slice(0, 20)} />
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <DailyVolumeChart data={intel.daily_volume} />
        <UserGrowthChart data={intel.user_growth} />
      </div>

      {/* Feedback / Mejoras */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">
          🚩 Respuestas Marcadas ({feedback.length})
        </h2>
        <p className="text-xs text-[#64748b] mb-3">Respuestas del bot pendientes de revisión</p>
        {feedback.length === 0 ? (
          <p className="text-[#64748b] text-sm py-4 text-center">No hay respuestas marcadas</p>
        ) : (
          <div className="space-y-3">
            {feedback.map(f => (
              <div key={f.id} className="bg-[#0f172a] border border-[#334155] rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#64748b]">
                  <span>{new Date(f.created_at).toLocaleString('es-PR', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                  <span>{f.flagged_by || 'desconocido'}</span>
                </div>
                {f.original_body && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">Respuesta original</p>
                    <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-2 text-xs text-[#94a3b8] whitespace-pre-wrap">{f.original_body}</div>
                  </div>
                )}
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#f87171] mb-1">Por qué estuvo mal</p>
                  <p className="text-sm text-white">{f.reason}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#4ade80] mb-1">Qué debería haber contestado</p>
                  <p className="text-sm text-white whitespace-pre-wrap">{f.suggested_response}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
