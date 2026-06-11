import Link from 'next/link'
import { getCarteraTenants, type CarteraTenantSummary, type CarteraTenantType } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const TYPE_META: Record<CarteraTenantType, { label: string; icon: string; accent: string }> = {
  personal:        { label: 'Personal',        icon: '👤', accent: '#a78bfa' },
  casa_propia:     { label: 'Casa propia',     icon: '🏠', accent: '#38bdf8' },
  cliente_active:  { label: 'Cliente activo',  icon: '💼', accent: '#4ade80' },
  lead:            { label: 'Lead',            icon: '🎯', accent: '#fbbf24' },
  partner:         { label: 'Partner',         icon: '🤝', accent: '#f472b6' },
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'sin actividad'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `hace ${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr}h`
  const days = Math.floor(hr / 24)
  return `hace ${days}d`
}

function groupTenants(tenants: CarteraTenantSummary[]): Map<CarteraTenantType, CarteraTenantSummary[]> {
  const grouped = new Map<CarteraTenantType, CarteraTenantSummary[]>()
  for (const t of tenants) {
    const list = grouped.get(t.type) || []
    list.push(t)
    grouped.set(t.type, list)
  }
  return grouped
}

export default async function CarteraOverviewPage() {
  const supabase = await createSupabaseAdminClient()
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  const [tenants, runsRes] = await Promise.all([
    getCarteraTenants().catch(() => [] as CarteraTenantSummary[]),
    Promise.resolve(
      supabase.from('cartera_agent_runs').select('tenant_id, status').gte('ran_at', since)
    ).then(r => (r.data || []) as { tenant_id: string; status: string }[]).catch(() => []),
  ])

  // Runs last 24h per tenant — connects La Cartera with what the team actually did
  const runs24h = new Map<string, { total: number; failed: number }>()
  for (const r of runsRes) {
    const cur = runs24h.get(r.tenant_id) || { total: 0, failed: 0 }
    cur.total++
    if (r.status === 'failed' || r.status === 'rejected') cur.failed++
    runs24h.set(r.tenant_id, cur)
  }

  const totalBudget = tenants.reduce((s, t) => s + Number(t.budget_usd_month || 0), 0)
  const totalSpent  = tenants.reduce((s, t) => s + Number(t.cost_mtd_usd || 0), 0)
  const totalAgents = tenants.reduce((s, t) => s + (t.active_agents || 0), 0)
  const totalPending = tenants.reduce((s, t) => s + (t.pending_decisions || 0), 0)
  const grouped = groupTenants(tenants)
  const typeOrder: CarteraTenantType[] = ['personal', 'casa_propia', 'cliente_active', 'lead', 'partner']

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">🏢 La Cartera</h1>
      <p className="text-[#64748b] text-sm mb-6">
        Multi-tenant control plane · {tenants.length} entidades · {totalAgents} agents activos
      </p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Tenants</div>
          <div className="text-2xl font-bold mt-1 text-[#38bdf8]">{tenants.length}</div>
          <div className="text-xs text-[#64748b] mt-0.5">{totalAgents} agents</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Cost MTD</div>
          <div className="text-2xl font-bold mt-1 text-[#fbbf24]">${totalSpent.toFixed(2)}</div>
          <div className="text-xs text-[#64748b] mt-0.5">de ${totalBudget.toFixed(0)} budget</div>
        </div>
        <Link href="/admin/decisiones" className="bg-[#1e293b] rounded-xl border border-[#334155] hover:border-[#475569] p-4 transition-colors block">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Pending Decisions</div>
          <div className={`text-2xl font-bold mt-1 ${totalPending > 0 ? 'text-[#f87171]' : 'text-[#4ade80]'}`}>{totalPending}</div>
          <div className="text-xs text-[#64748b] mt-0.5">drafts esperando review →</div>
        </Link>
        <div className="bg-[#4ade80]/10 border border-[#4ade80]/30 rounded-xl p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Status</div>
          <div className="text-2xl font-bold mt-1 text-[#4ade80]">ACTIVE</div>
          <div className="text-xs text-[#64748b] mt-0.5">draft-first protocol</div>
        </div>
      </div>

      {/* Tenants grouped by type */}
      {typeOrder.map(type => {
        const list = grouped.get(type)
        if (!list || list.length === 0) return null
        const meta = TYPE_META[type]
        return (
          <div key={type} className="mb-6">
            <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>{meta.icon}</span>
              <span>{meta.label}</span>
              <span className="text-[#64748b] font-normal">({list.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map(t => {
                const budget = Number(t.budget_usd_month || 0)
                const spent  = Number(t.cost_mtd_usd || 0)
                const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0
                const overBudget = budget > 0 && spent > budget
                return (
                  <Link
                    key={t.id}
                    href={`/admin/cartera/${encodeURIComponent(t.id)}`}
                    className="bg-[#1e293b] rounded-xl border border-[#334155] hover:border-[#475569] p-4 transition-colors block"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-semibold text-white">{t.display_name}</div>
                        <div className="text-xs text-[#64748b] mt-0.5">{formatRelative(t.last_activity_at)}</div>
                      </div>
                      {t.pending_decisions > 0 && (
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#f87171] text-white"
                          aria-label={`${t.pending_decisions} drafts pendientes`}
                        >
                          {t.pending_decisions}
                        </span>
                      )}
                    </div>

                    {/* Budget bar */}
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-[#94a3b8]">${spent.toFixed(2)}</span>
                        <span className="text-[#64748b]">/ ${budget.toFixed(0)}/mo</span>
                      </div>
                      <div className="bg-[#334155] rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${overBudget ? 'bg-[#f87171]' : 'bg-[#38bdf8]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {/* Agents + producción 24h */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-[#64748b]">
                      <span>{t.active_agents} agent{t.active_agents === 1 ? '' : 's'}</span>
                      {(() => {
                        const r = runs24h.get(t.id)
                        if (!r) return <><span>·</span><span className="text-[#475569]">0 runs 24h</span></>
                        return (
                          <>
                            <span>·</span>
                            <span className="text-[#4ade80]">{r.total} run{r.total === 1 ? '' : 's'} 24h</span>
                            {r.failed > 0 && <span className="text-[#f87171]">({r.failed} failed)</span>}
                          </>
                        )
                      })()}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )
      })}

      {tenants.length === 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-8 text-center">
          <p className="text-[#64748b] text-sm">No hay tenants registrados.</p>
          <p className="text-[#475569] text-xs mt-1">Migration cartera_multitenant debería haber poblado 10 tenants.</p>
        </div>
      )}
    </div>
  )
}
