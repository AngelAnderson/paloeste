import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  getCarteraTenantById,
  getCarteraTenantDetail,
  type CarteraAgentDetail,
  type CarteraAutonomyLevel,
} from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

const AUTONOMY_META: Record<CarteraAutonomyLevel, { label: string; color: string; emoji: string }> = {
  draft_only:                 { label: 'Draft only',       color: '#fbbf24', emoji: '✍️' },
  autonomous_within_playbook: { label: 'Autonomous',       color: '#4ade80', emoji: '🤖' },
  restricted:                 { label: 'Restricted',       color: '#f87171', emoji: '🔒' },
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

function statusBadge(status: string | null) {
  if (!status) return { color: '#64748b', label: '—' }
  switch (status) {
    case 'success':
    case 'sent':
      return { color: '#4ade80', label: status }
    case 'awaiting_review':
      return { color: '#fbbf24', label: 'awaiting review' }
    case 'partial':
      return { color: '#fbbf24', label: status }
    case 'failed':
    case 'rejected':
      return { color: '#f87171', label: status }
    default:
      return { color: '#64748b', label: status }
  }
}

export default async function CarteraTenantDetailPage({
  params,
}: {
  params: Promise<{ tenant: string }>
}) {
  const { tenant: tenantParam } = await params
  const tenantId = decodeURIComponent(tenantParam)

  const tenant = await getCarteraTenantById(tenantId).catch(() => null)
  if (!tenant) notFound()

  const agents = await getCarteraTenantDetail(tenantId).catch(() => [] as CarteraAgentDetail[])

  const totalCost30d = agents.reduce((s, a) => s + Number(a.cost_30d_usd || 0), 0)
  const totalRuns30d = agents.reduce((s, a) => s + (a.runs_30d || 0), 0)
  const totalPending = agents.reduce((s, a) => s + (a.pending_decisions || 0), 0)
  const draftOnlyCount = agents.filter(a => a.autonomy_level === 'draft_only').length
  const mission = (tenant.context_jsonb && typeof tenant.context_jsonb === 'object'
    ? (tenant.context_jsonb as Record<string, unknown>)['mission']
    : null) as string | null

  return (
    <div>
      {/* Header */}
      <div className="mb-1">
        <Link href="/admin/cartera" className="text-xs text-[#64748b] hover:text-[#94a3b8]">← La Cartera</Link>
      </div>
      <h1 className="text-2xl font-bold mb-1">{tenant.display_name}</h1>
      <p className="text-[#64748b] text-sm mb-1">
        {tenant.type} · budget ${Number(tenant.budget_usd_month).toFixed(0)}/mo · <span className="font-mono text-[10px]">{tenant.id}</span>
      </p>
      {mission && (
        <p className="text-[#94a3b8] text-sm mb-6 italic">{mission}</p>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Agents activos</div>
          <div className="text-2xl font-bold mt-1 text-[#38bdf8]">{agents.length}</div>
          <div className="text-xs text-[#64748b] mt-0.5">{draftOnlyCount} draft-only</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Runs (30d)</div>
          <div className="text-2xl font-bold mt-1 text-[#4ade80]">{totalRuns30d}</div>
          <div className="text-xs text-[#64748b] mt-0.5">across {agents.length} agents</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Cost (30d)</div>
          <div className="text-2xl font-bold mt-1 text-[#fbbf24]">${totalCost30d.toFixed(2)}</div>
          <div className="text-xs text-[#64748b] mt-0.5">budget ${Number(tenant.budget_usd_month).toFixed(0)}/mo</div>
        </div>
        <div className={`rounded-xl border p-4 ${totalPending > 0 ? 'bg-[#f87171]/10 border-[#f87171]/30' : 'bg-[#4ade80]/10 border-[#4ade80]/30'}`}>
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Pending</div>
          <div className={`text-2xl font-bold mt-1 ${totalPending > 0 ? 'text-[#f87171]' : 'text-[#4ade80]'}`}>{totalPending}</div>
          <div className="text-xs text-[#64748b] mt-0.5">drafts esperando</div>
        </div>
      </div>

      {/* Agents table */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">
          Roster · {agents.length} agent{agents.length === 1 ? '' : 's'}
        </h2>

        {agents.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#64748b] text-sm">No hay agents asignados a este tenant.</p>
            <p className="text-[#475569] text-xs mt-1">Agrégalos en Phase 1 seed o via Phase 2 setup.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {agents.map(a => {
              const meta = AUTONOMY_META[a.autonomy_level] || AUTONOMY_META.draft_only
              const last = statusBadge(a.last_run_status)
              const successPct = (Number(a.success_rate || 0) * 100).toFixed(0)
              return (
                <div key={a.agent_id} className="bg-[#0f172a] border border-[#334155] rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-white truncate">👤 {a.persona_name}</span>
                        <span className="text-xs text-[#94a3b8]">{a.persona_title}</span>
                      </div>
                      <div className="text-xs text-[#94a3b8] mt-1">{a.mission}</div>
                    </div>
                    <span
                      className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap"
                      style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
                    >
                      {meta.emoji} {meta.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3 text-xs">
                    <div>
                      <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Last run</div>
                      <div className="text-[#94a3b8]">{formatRelative(a.last_run_at)}</div>
                    </div>
                    <div>
                      <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Status</div>
                      <div style={{ color: last.color }}>{last.label}</div>
                    </div>
                    <div>
                      <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Runs 30d</div>
                      <div className="text-[#38bdf8] font-semibold">{a.runs_30d}</div>
                    </div>
                    <div>
                      <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Success</div>
                      <div className="text-[#4ade80] font-semibold">{a.runs_30d > 0 ? `${successPct}%` : '—'}</div>
                    </div>
                    <div>
                      <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Cost 30d</div>
                      <div className="text-[#fbbf24] font-semibold">${Number(a.cost_30d_usd).toFixed(2)}</div>
                    </div>
                  </div>

                  {(a.schedule || a.playbook_id || a.pending_decisions > 0) && (
                    <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-[#334155] text-xs">
                      {a.schedule && (
                        <span className="font-mono text-[10px] text-[#475569] bg-[#1e293b] px-2 py-0.5 rounded">
                          {a.schedule}
                        </span>
                      )}
                      {a.playbook_id && (
                        <span className="text-[10px] text-[#64748b]">📋 {a.playbook_id}</span>
                      )}
                      {a.pending_decisions > 0 && (
                        <span className="text-[10px] font-semibold text-[#f87171]">
                          ⏳ {a.pending_decisions} draft{a.pending_decisions === 1 ? '' : 's'} pendiente{a.pending_decisions === 1 ? '' : 's'}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-[#475569] ml-auto">{a.agent_id}</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
