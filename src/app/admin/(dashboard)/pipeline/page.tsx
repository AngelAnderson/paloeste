import { getProspects } from '@/lib/admin-queries'
import type { Prospect } from '@/lib/types'

export const dynamic = 'force-dynamic'

const STAGES = [
  { key: 'lead', label: 'Lead', color: '#64748b', bg: '#64748b' },
  { key: 'contacted', label: 'Contacted', color: '#38bdf8', bg: '#38bdf8' },
  { key: 'pitched', label: 'Pitched', color: '#fbbf24', bg: '#fbbf24' },
  { key: 'negotiating', label: 'Negotiating', color: '#fb923c', bg: '#fb923c' },
  { key: 'won', label: 'Won', color: '#4ade80', bg: '#4ade80' },
  { key: 'lost', label: 'Lost', color: '#f87171', bg: '#f87171' },
] as const

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

export default async function PipelinePage() {
  const prospects = await getProspects()

  const grouped = new Map<string, Prospect[]>()
  for (const stage of STAGES) grouped.set(stage.key, [])
  for (const p of prospects) {
    const list = grouped.get(p.stage)
    if (list) list.push(p)
    else {
      // Unknown stage falls into lead
      grouped.get('lead')!.push(p)
    }
  }

  const totalValue = prospects
    .filter(p => p.stage !== 'lost')
    .reduce((sum, p) => sum + (p.proposed_amount_cents || 0), 0)

  const wonValue = prospects
    .filter(p => p.stage === 'won')
    .reduce((sum, p) => sum + (p.proposed_amount_cents || 0), 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Pipeline</h1>
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
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: stage.bg }} />
                <span className="text-sm font-semibold uppercase tracking-wider" style={{ color: stage.color }}>
                  {stage.label}
                </span>
                <span className="text-xs text-[#64748b] ml-auto">{items.length}</span>
              </div>

              {/* Cards */}
              <div className="space-y-2">
                {items.map(p => {
                  const days = daysSince(p.last_contact_at || p.created_at)
                  const isStale = days !== null && days >= 7 && p.stage !== 'won' && p.stage !== 'lost'

                  return (
                    <div
                      key={p.id}
                      className={`bg-[#1e293b] rounded-xl border p-4 ${isStale ? 'border-[#f87171]/50' : 'border-[#334155]'}`}
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
                        <div className="text-xs text-[#fbbf24] mt-1.5">
                          Next: {p.next_action}
                          {p.next_action_date && (
                            <span className="text-[#64748b] ml-1">
                              ({new Date(p.next_action_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })})
                            </span>
                          )}
                        </div>
                      )}

                      {days !== null && (
                        <div className={`text-[10px] mt-2 ${isStale ? 'text-[#f87171]' : 'text-[#64748b]'}`}>
                          {days === 0 ? 'Today' : `${days}d ago`}
                        </div>
                      )}
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
  )
}
