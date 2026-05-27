import { getAgentProposals, getCarteraPendingDecisions, type AgentProposal, type CarteraPendingDecision } from '@/lib/admin-queries'
import { DecisionsView } from './decisions-view'
import { AgentProposalsView } from './agent-proposals-view'

export const dynamic = 'force-dynamic'

export default async function DecisionesInboxPage() {
  const [decisions, proposals] = await Promise.all([
    getCarteraPendingDecisions().catch(() => [] as CarteraPendingDecision[]),
    getAgentProposals().catch(() => [] as AgentProposal[]),
  ])

  // Group by agent for stats
  const byAgent = new Map<string, number>()
  for (const d of decisions) {
    byAgent.set(d.persona_name, (byAgent.get(d.persona_name) || 0) + 1)
  }
  const agentChips = Array.from(byAgent.entries()).sort((a, b) => b[1] - a[1])

  const oldestAge = decisions.length > 0 ? Math.max(...decisions.map(d => d.age_hours)) : 0

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">📥 Decisiones — tu Inbox de drafts</h1>
      <p className="text-[#64748b] text-sm mb-6">
        Tu equipo invisible te tira drafts acá. Aprobar una propuesta de Mission Control la convierte en decisión ejecutable; nada sale sin revisión humana.
      </p>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className={`rounded-xl border p-4 ${decisions.length > 0 ? 'bg-[#fbbf24]/10 border-[#fbbf24]/30' : 'bg-[#4ade80]/10 border-[#4ade80]/30'}`}>
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Pending</div>
          <div className={`text-2xl font-bold mt-1 ${decisions.length > 0 ? 'text-[#fbbf24]' : 'text-[#4ade80]'}`}>{decisions.length}</div>
          <div className="text-xs text-[#64748b] mt-0.5">drafts</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Oldest</div>
          <div className={`text-2xl font-bold mt-1 ${oldestAge > 48 ? 'text-[#f87171]' : oldestAge > 12 ? 'text-[#fbbf24]' : 'text-[#4ade80]'}`}>
            {oldestAge < 1 ? `${Math.round(oldestAge * 60)}m` : oldestAge < 48 ? `${Math.round(oldestAge)}h` : `${Math.round(oldestAge / 24)}d`}
          </div>
          <div className="text-xs text-[#64748b] mt-0.5">edad max</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Mission Control</div>
          <div className={`text-2xl font-bold mt-1 ${proposals.length > 0 ? 'text-[#38bdf8]' : 'text-[#4ade80]'}`}>{proposals.length}</div>
          <div className="text-xs text-[#64748b] mt-0.5">propuestas</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider mb-1">Por agent</div>
          <div className="flex flex-wrap gap-2">
            {agentChips.length === 0 ? (
              <span className="text-xs text-[#475569]">—</span>
            ) : agentChips.map(([name, count]) => (
              <span key={name} className="text-xs bg-[#0f172a] border border-[#334155] rounded-full px-2 py-1">
                <span className="text-[#94a3b8]">{name}</span>
                <span className="text-[#fbbf24] font-semibold ml-1">{count}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#fbbf24] uppercase tracking-wider">Cartera Decisions</h2>
          <span className="text-xs text-[#64748b]">{decisions.length} drafts ejecutables</span>
        </div>
        <DecisionsView decisions={decisions} />
      </section>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-[#38bdf8] uppercase tracking-wider">Mission Control Proposals</h2>
          <span className="text-xs text-[#64748b]">{proposals.length} listas para convertir</span>
        </div>
        <AgentProposalsView proposals={proposals} />
      </section>
    </div>
  )
}
