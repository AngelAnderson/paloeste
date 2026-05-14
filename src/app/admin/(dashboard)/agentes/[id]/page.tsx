import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCarteraAgentById, getCarteraAgentHistory, type CarteraAgentRun, type CarteraAutonomyLevel } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

const AUTONOMY_META: Record<CarteraAutonomyLevel, { label: string; color: string; emoji: string; description: string }> = {
  draft_only: {
    label: 'Draft only',
    color: '#fbbf24',
    emoji: '✍️',
    description: 'Drafts outputs but cannot send/publish without Angel approval.',
  },
  autonomous_within_playbook: {
    label: 'Autonomous',
    color: '#4ade80',
    emoji: '🤖',
    description: 'Can act within playbook rules without per-action approval.',
  },
  restricted: {
    label: 'Restricted',
    color: '#f87171',
    emoji: '🔒',
    description: 'Limited to read-only or admin-internal actions.',
  },
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `hace ${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr}h`
  const days = Math.floor(hr / 24)
  return `hace ${days}d`
}

function statusBadge(status: string | null) {
  if (!status) return { color: '#64748b', label: '—', icon: '·' }
  switch (status) {
    case 'success':
    case 'sent':
      return { color: '#4ade80', label: status, icon: '✓' }
    case 'awaiting_review':
      return { color: '#fbbf24', label: 'awaiting review', icon: '⏳' }
    case 'partial':
      return { color: '#fbbf24', label: status, icon: '⚠' }
    case 'failed':
    case 'rejected':
      return { color: '#f87171', label: status, icon: '✗' }
    default:
      return { color: '#64748b', label: status, icon: '·' }
  }
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: idParam } = await params
  const agentId = decodeURIComponent(idParam)

  const [agent, history] = await Promise.all([
    getCarteraAgentById(agentId).catch(() => null),
    getCarteraAgentHistory(agentId, 30).catch(() => [] as CarteraAgentRun[]),
  ])
  if (!agent) notFound()

  const auton = AUTONOMY_META[agent.autonomy_level] || AUTONOMY_META.draft_only
  const totalRuns = history.length
  const successes = history.filter(r => r.status === 'success' || r.status === 'sent').length
  const failures = history.filter(r => r.status === 'failed' || r.status === 'rejected').length
  const successPct = totalRuns > 0 ? ((successes / totalRuns) * 100).toFixed(0) : '—'
  const totalCost = history.reduce((s, r) => s + Number(r.cost_usd || 0), 0)
  const avgMs = totalRuns > 0 ? Math.round(history.reduce((s, r) => s + (r.duration_ms || 0), 0) / totalRuns) : 0

  const activatedDate = new Date(agent.activated_at).toLocaleDateString('es-PR', { year: 'numeric', month: 'short', day: 'numeric' })

  return (
    <div>
      {/* Header */}
      <div className="mb-1">
        <Link href="/admin/agentes" className="text-xs text-[#64748b] hover:text-[#94a3b8]">← Equipo invisible</Link>
      </div>

      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold mb-1">👤 {agent.persona_name}</h1>
          <p className="text-[#94a3b8] text-sm mb-1">{agent.persona_title}</p>
          <p className="text-xs text-[#64748b]">
            Casa: <Link href={`/admin/cartera/${encodeURIComponent(agent.tenant_id)}`} className="text-[#38bdf8] hover:underline">{agent.tenant_display_name}</Link> ·
            {' '}Activa desde {activatedDate}
          </p>
        </div>
        <span
          className="text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap"
          style={{ backgroundColor: `${auton.color}1a`, color: auton.color }}
        >
          {auton.emoji} {auton.label}
        </span>
      </div>

      {/* Mission */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">Misión</h2>
        <p className="text-[#f1f5f9] text-sm leading-relaxed">{agent.mission}</p>
      </div>

      {/* Performance (30d) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Runs (últimos 30)</div>
          <div className="text-2xl font-bold mt-1 text-[#38bdf8]">{totalRuns}</div>
          <div className="text-xs text-[#64748b] mt-0.5">avg {avgMs}ms</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Success rate</div>
          <div className={`text-2xl font-bold mt-1 ${successes / Math.max(totalRuns, 1) >= 0.95 ? 'text-[#4ade80]' : 'text-[#fbbf24]'}`}>{totalRuns > 0 ? `${successPct}%` : '—'}</div>
          <div className="text-xs text-[#64748b] mt-0.5">{successes} ok · {failures} fail</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Cost (30d)</div>
          <div className="text-2xl font-bold mt-1 text-[#fbbf24]">${totalCost.toFixed(2)}</div>
          <div className="text-xs text-[#64748b] mt-0.5">LLM + tools</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Schedule</div>
          <div className="text-[10px] font-mono text-[#94a3b8] mt-1 break-all">{agent.schedule || 'manual'}</div>
          <div className="text-xs text-[#64748b] mt-0.5">{agent.type}</div>
        </div>
      </div>

      {/* Playbook */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Playbook</h2>
        <div className="flex items-center gap-3 mb-2">
          <span className="font-mono text-xs bg-[#0f172a] border border-[#334155] rounded px-2 py-1 text-[#94a3b8]">
            {agent.playbook_id || 'none'}
          </span>
          <span
            className="text-xs font-bold px-2 py-1 rounded-full"
            style={{ backgroundColor: `${auton.color}1a`, color: auton.color }}
          >
            {auton.emoji} {auton.label}
          </span>
        </div>
        <p className="text-xs text-[#94a3b8]">{auton.description}</p>
      </div>

      {/* History */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
          Historial · {history.length} run{history.length === 1 ? '' : 's'}
        </h2>

        {history.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[#64748b] text-sm">Sin runs registradas todavía.</p>
            <p className="text-[#475569] text-xs mt-1">Cuando el cron dispare, aparecerán acá.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {history.map(run => {
              const badge = statusBadge(run.status)
              return (
                <div key={run.run_id} className="bg-[#0f172a] border border-[#334155] rounded-lg p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span style={{ color: badge.color }} className="text-xs font-semibold">
                          {badge.icon} {badge.label}
                        </span>
                        <span className="text-[10px] text-[#64748b]">{formatRelative(run.ran_at)}</span>
                        {run.duration_ms !== null && <span className="text-[10px] text-[#64748b]">· {run.duration_ms}ms</span>}
                        {Number(run.cost_usd) > 0 && <span className="text-[10px] text-[#fbbf24]">· ${Number(run.cost_usd).toFixed(3)}</span>}
                        {run.decision_id && (
                          <Link href={`/admin/decisiones/${run.decision_id}`} className="text-[10px] text-[#38bdf8] hover:underline">
                            · decisión #{run.decision_id}
                          </Link>
                        )}
                      </div>
                      {run.audit_message && (
                        <div className="text-xs text-[#94a3b8] mt-1">{run.audit_message}</div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
