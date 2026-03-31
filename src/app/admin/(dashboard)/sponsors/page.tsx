import { getSponsorROI } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

export default async function SponsorsPage() {
  const sponsors = await getSponsorROI()
  const sorted = [...sponsors].sort((a, b) => b.sponsor_weight - a.sponsor_weight)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Sponsors</h1>
      <p className="text-[#64748b] text-sm mb-6">{sorted.length} active sponsors. ROI tracking and deliverables.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sorted.map(s => {
          const borderColor = s.profile_completeness >= 83 ? '#4ade80' : s.profile_completeness >= 50 ? '#fbbf24' : '#f87171'
          const pctColor = borderColor

          return (
            <div key={s.place_id} className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 border-l-4" style={{ borderLeftColor: borderColor }}>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-bold">{s.name}</div>
                  <div className="text-xs text-[#64748b]">{s.category} · {s.plan || 'free'}</div>
                </div>
                <span className="text-2xl font-bold text-[#fbbf24]">{s.sponsor_weight}</span>
              </div>

              {/* Leads */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#0f172a] rounded-lg p-2">
                  <div className="text-[10px] text-[#64748b] uppercase">Leads (30d)</div>
                  <div className="text-lg font-bold text-[#4ade80]">{s.leads_30d}</div>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-2">
                  <div className="text-[10px] text-[#64748b] uppercase">Leads (total)</div>
                  <div className="text-lg font-bold text-[#38bdf8]">{s.leads_total}</div>
                </div>
              </div>

              {/* Queries & Spotlights */}
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-[#0f172a] rounded-lg p-2">
                  <div className="text-[10px] text-[#64748b] uppercase">Queries (30d)</div>
                  <div className="text-lg font-bold text-[#38bdf8]">{s.queries_matched_30d}</div>
                </div>
                <div className="bg-[#0f172a] rounded-lg p-2">
                  <div className="text-[10px] text-[#64748b] uppercase">Spotlights</div>
                  <div className="text-lg font-bold text-[#fbbf24]">{s.spotlight_count}</div>
                </div>
              </div>

              {s.last_spotlight && (
                <div className="text-xs text-[#64748b] mb-2">Last spotlight: {new Date(s.last_spotlight).toLocaleDateString()}</div>
              )}

              {/* Profile Completeness */}
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-[#334155] rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${s.profile_completeness}%`, backgroundColor: pctColor }} />
                </div>
                <span className="text-xs font-medium" style={{ color: pctColor }}>{s.profile_completeness}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
