import Link from 'next/link'
import { getCarteraAllAgentsRoster, type CarteraAgentRosterRow, type CarteraTenantType, type CarteraAutonomyLevel } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

const TENANT_META: Record<CarteraTenantType, { label: string; icon: string }> = {
  personal:        { label: 'Personal',        icon: '👤' },
  casa_propia:     { label: 'Casas propias',   icon: '🏠' },
  cliente_active:  { label: 'Clientes activos', icon: '💼' },
  lead:            { label: 'Leads',           icon: '🎯' },
  partner:         { label: 'Partners',        icon: '🤝' },
}

const AUTONOMY_META: Record<CarteraAutonomyLevel, { label: string; color: string; emoji: string }> = {
  draft_only:                 { label: 'Draft only',    color: '#fbbf24', emoji: '✍️' },
  autonomous_within_playbook: { label: 'Autonomous',    color: '#4ade80', emoji: '🤖' },
  restricted:                 { label: 'Restricted',    color: '#f87171', emoji: '🔒' },
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'sin runs'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `hace ${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr}h`
  const days = Math.floor(hr / 24)
  return `hace ${days}d`
}

function statusColor(status: string | null): string {
  if (!status) return '#64748b'
  if (status === 'success' || status === 'sent') return '#4ade80'
  if (status === 'awaiting_review') return '#fbbf24'
  if (status === 'partial') return '#fbbf24'
  if (status === 'failed' || status === 'rejected') return '#f87171'
  return '#64748b'
}

function groupByTenantType(rows: CarteraAgentRosterRow[]): Map<CarteraTenantType, CarteraAgentRosterRow[]> {
  const grouped = new Map<CarteraTenantType, CarteraAgentRosterRow[]>()
  for (const r of rows) {
    const list = grouped.get(r.tenant_type) || []
    list.push(r)
    grouped.set(r.tenant_type, list)
  }
  return grouped
}

export default async function AgentesRosterPage() {
  const roster = await getCarteraAllAgentsRoster().catch(() => [] as CarteraAgentRosterRow[])

  const totalAgents = roster.length
  const totalRuns30d = roster.reduce((s, r) => s + r.runs_30d, 0)
  const totalCost30d = roster.reduce((s, r) => s + Number(r.cost_30d_usd || 0), 0)
  const totalPending = roster.reduce((s, r) => s + r.pending_decisions, 0)
  const draftOnlyCount = roster.filter(r => r.autonomy_level === 'draft_only').length

  const grouped = groupByTenantType(roster)
  const typeOrder: CarteraTenantType[] = ['personal', 'casa_propia', 'cliente_active', 'lead', 'partner']

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">👥 Tu equipo invisible</h1>
      <p className="text-[#64748b] text-sm mb-6">
        {totalAgents} agents personificados · {draftOnlyCount} en draft-only · {totalRuns30d} runs últimos 30d
      </p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Roster</div>
          <div className="text-2xl font-bold mt-1 text-[#38bdf8]">{totalAgents}</div>
          <div className="text-xs text-[#64748b] mt-0.5">activos</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Runs (30d)</div>
          <div className="text-2xl font-bold mt-1 text-[#4ade80]">{totalRuns30d.toLocaleString()}</div>
          <div className="text-xs text-[#64748b] mt-0.5">across team</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Cost (30d)</div>
          <div className="text-2xl font-bold mt-1 text-[#fbbf24]">${totalCost30d.toFixed(2)}</div>
          <div className="text-xs text-[#64748b] mt-0.5">LLM + tools</div>
        </div>
        <div className={`rounded-xl border p-4 ${totalPending > 0 ? 'bg-[#f87171]/10 border-[#f87171]/30' : 'bg-[#4ade80]/10 border-[#4ade80]/30'}`}>
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Pending</div>
          <div className={`text-2xl font-bold mt-1 ${totalPending > 0 ? 'text-[#f87171]' : 'text-[#4ade80]'}`}>{totalPending}</div>
          <div className="text-xs text-[#64748b] mt-0.5">drafts esperando</div>
        </div>
      </div>

      {/* Agents grouped by tenant type */}
      {typeOrder.map(type => {
        const list = grouped.get(type)
        if (!list || list.length === 0) return null
        const meta = TENANT_META[type]
        return (
          <div key={type} className="mb-6">
            <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              <span className="text-[#64748b] font-normal">({list.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map(agent => {
                const auton = AUTONOMY_META[agent.autonomy_level] || AUTONOMY_META.draft_only
                const lastColor = statusColor(agent.last_run_status)
                const successPct = (Number(agent.success_rate || 0) * 100).toFixed(0)
                return (
                  <Link
                    key={agent.agent_id}
                    href={`/admin/agentes/${encodeURIComponent(agent.agent_id)}`}
                    className="bg-[#1e293b] rounded-xl border border-[#334155] hover:border-[#475569] p-4 transition-colors block"
                  >
                    {/* Header: persona + autonomy badge */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate">👤 {agent.persona_name}</div>
                        <div className="text-xs text-[#94a3b8] truncate">{agent.persona_title}</div>
                      </div>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: `${auton.color}1a`, color: auton.color }}
                      >
                        {auton.emoji}
                      </span>
                    </div>

                    {/* Mission */}
                    <div className="text-xs text-[#94a3b8] line-clamp-2 min-h-[2rem] mb-3">{agent.mission}</div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-[#334155]">
                      <div>
                        <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Runs</div>
                        <div className="text-[#38bdf8] font-semibold">{agent.runs_30d}</div>
                      </div>
                      <div>
                        <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Success</div>
                        <div className="text-[#4ade80] font-semibold">{agent.runs_30d > 0 ? `${successPct}%` : '—'}</div>
                      </div>
                      <div>
                        <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Last</div>
                        <div style={{ color: lastColor }} className="text-[10px]">{formatRelative(agent.last_run_at)}</div>
                      </div>
                    </div>

                    {agent.pending_decisions > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#334155]">
                        <span className="text-[10px] font-semibold text-[#f87171]">
                          ⏳ {agent.pending_decisions} draft{agent.pending_decisions === 1 ? '' : 's'} pendiente{agent.pending_decisions === 1 ? '' : 's'}
                        </span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      {roster.length === 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-8 text-center">
          <p className="text-[#64748b] text-sm">No hay agents registrados.</p>
          <p className="text-[#475569] text-xs mt-1">Phase 1.5 instrumentation pending.</p>
        </div>
      )}
    </div>
  )
}
