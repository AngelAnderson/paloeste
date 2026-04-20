// Revenue dashboard — re-uses existing revenue page logic
import { getConversionOpportunities, getRevenueByMonth, getUnbilledLeadsByBusiness } from '@/lib/admin-queries'
import { RevenueCharts } from '../revenue/charts'

export const dynamic = 'force-dynamic'

export default async function VentasDashboardPage() {
  const [opportunities, revenueByMonth, unbilled] = await Promise.all([
    getConversionOpportunities(1),
    getRevenueByMonth(),
    getUnbilledLeadsByBusiness(),
  ])

  const totalUnbilled = unbilled.reduce((sum, b) => sum + b.total_cents, 0)

  return (
    <div>
      {totalUnbilled > 0 && (
        <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="text-2xl">💸</span>
            <div>
              <div className="text-[#f87171] font-bold text-lg">${(totalUnbilled / 100).toFixed(0)} sin cobrar</div>
              <div className="text-[#94a3b8] text-sm">{unbilled.length} negocios con leads sin facturar</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Unbilled Leads</h2>
        {unbilled.length === 0 ? (
          <p className="text-[#64748b] text-sm py-8 text-center">No unbilled leads.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[#64748b] text-xs uppercase tracking-wider">
                  <th className="pb-3 pr-4">Business</th>
                  <th className="pb-3 pr-4 text-right">Leads</th>
                  <th className="pb-3 pr-4 text-right">Total</th>
                  <th className="pb-3 pr-4">Oldest</th>
                  <th className="pb-3">Newest</th>
                </tr>
              </thead>
              <tbody>
                {unbilled.map(b => (
                  <tr key={b.business_id} className="border-t border-[#334155]">
                    <td className="py-3 pr-4 font-medium">{b.business_name}</td>
                    <td className="py-3 pr-4 text-right text-[#38bdf8] font-semibold">{b.lead_count}</td>
                    <td className="py-3 pr-4 text-right text-[#fbbf24] font-semibold">${(b.total_cents / 100).toFixed(0)}</td>
                    <td className="py-3 pr-4 text-[#64748b]">{new Date(b.oldest).toLocaleDateString()}</td>
                    <td className="py-3 text-[#64748b]">{new Date(b.newest).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {revenueByMonth.length > 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-4">Revenue by Month</h2>
          <RevenueCharts data={revenueByMonth} />
        </div>
      )}

      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-1">Conversion Opportunities</h2>
        <p className="text-[#64748b] text-xs mb-4">Free businesses receiving bot leads — should be paying.</p>
        {opportunities.length === 0 ? (
          <p className="text-[#64748b] text-sm py-8 text-center">No conversion opportunities yet.</p>
        ) : (
          <div className="space-y-3">
            {opportunities.map((opp, i) => (
              <div key={opp.place_id} className="flex items-center gap-4 p-3 bg-[#0f172a] rounded-lg">
                <div className="text-lg font-bold text-[#fbbf24] w-8 text-center">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{opp.name}</div>
                  <div className="text-xs text-[#64748b]">{opp.category} · {opp.plan || 'free'}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[#4ade80] font-bold">{opp.lead_count} leads</div>
                  <div className="text-xs text-[#64748b]">${(opp.total_value_cents / 100).toFixed(0)} potential</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
