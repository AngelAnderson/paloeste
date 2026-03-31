import { getAdminOverview, getTrendingCategories, getSponsorPlaces, getProspects, getUnbilledLeadsByBusiness, getUpcomingEventsWithoutContent } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const [overview, trending, sponsors, prospects, unbilled, events] = await Promise.all([
    getAdminOverview(),
    getTrendingCategories(),
    getSponsorPlaces(),
    getProspects(),
    getUnbilledLeadsByBusiness(),
    getUpcomingEventsWithoutContent(),
  ])

  // Build action queue
  const actions: { icon: string; text: string; badge: string; badgeColor: string }[] = []

  // Sponsors without images
  for (const s of sponsors) {
    if (!s.hero_image_url) {
      actions.push({ icon: '📷', text: `Upload photo for ${s.name}`, badge: '⭐ sponsor', badgeColor: '#fbbf24' })
    }
  }

  // Prospects with next_action_date <= today
  const today = new Date().toISOString().slice(0, 10)
  for (const p of prospects) {
    if (p.next_action_date && p.next_action_date <= today && p.stage !== 'won' && p.stage !== 'lost') {
      actions.push({ icon: '🎯', text: `${p.next_action || 'Follow up'} for ${p.business_name}`, badge: '🎯 pipeline', badgeColor: '#a78bfa' })
    }
  }

  // Stale prospects (no contact in 7+ days, not won/lost)
  const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString()
  for (const p of prospects) {
    if (p.stage !== 'won' && p.stage !== 'lost') {
      const lastContact = p.last_contact_at || p.created_at
      if (lastContact < sevenDaysAgo) {
        // Skip if already added via next_action_date
        if (!(p.next_action_date && p.next_action_date <= today)) {
          actions.push({ icon: '🎯', text: `Follow up with ${p.business_name}`, badge: '🎯 pipeline', badgeColor: '#a78bfa' })
        }
      }
    }
  }

  // High unbilled leads
  for (const u of unbilled.slice(0, 3)) {
    if (u.lead_count >= 3) {
      actions.push({ icon: '💰', text: `Invoice ${u.business_name} ($${(u.total_cents / 100).toFixed(0)}, ${u.lead_count} leads)`, badge: '💰 revenue', badgeColor: '#4ade80' })
    }
  }

  // Events this week without posts
  const oneWeek = new Date(Date.now() + 7 * 86400000).toISOString()
  for (const e of events) {
    if (e.start_time <= oneWeek) {
      actions.push({ icon: '📝', text: `Create post for ${e.title}`, badge: '📷 content', badgeColor: '#38bdf8' })
    }
  }

  const displayActions = actions.slice(0, 8)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Command Center</h1>

      {/* Action Queue */}
      {displayActions.length > 0 && (
        <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#f87171] uppercase tracking-wider mb-3">
            Action Queue ({displayActions.length})
          </h2>
          <div className="space-y-2">
            {displayActions.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-lg">{a.icon}</span>
                <span className="flex-1 font-medium">{a.text}</span>
                <span
                  className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{ backgroundColor: a.badgeColor + '22', color: a.badgeColor }}
                >
                  {a.badge}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <KPI label="Total Places" value={overview.total_places} color="sky" />
        <KPI label="Published" value={overview.places_published} color="sky" />
        <KPI label="Sponsors" value={overview.active_sponsors} color="yellow" />
        <KPI label="Users (7d)" value={overview.unique_users_7d} color="green" />
        <KPI label="Leads (7d)" value={overview.total_leads_7d} color="green" />
        <KPI label="Unbilled" value={`$${(overview.unbilled_leads_total / 100).toFixed(0)}`} color="red" sub={`${overview.unbilled_leads_count} leads`} />
      </div>

      {/* Trending */}
      {trending.length > 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Trending This Week</h2>
          <div className="flex flex-wrap gap-2">
            {trending.map((t, i) => (
              <span key={i} className="bg-[#334155] px-3 py-1.5 rounded-lg text-sm">
                {t.emoji} {t.category} <span className="text-[#38bdf8] font-semibold">{t.count}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Data Health */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Data Health</h2>
        <div className="space-y-2">
          <HealthBar label="GPS Coordinates" value={overview.places_with_gps} total={overview.total_places} />
          <HealthBar label="Descriptions" value={overview.places_with_description} total={overview.total_places} />
          <HealthBar label="Phone Numbers" value={overview.places_with_phone} total={overview.total_places} />
          <HealthBar label="Images" value={overview.places_with_image} total={overview.total_places} />
          <HealthBar label="Websites" value={overview.places_with_website} total={overview.total_places} />
          <HealthBar label="Embeddings" value={overview.places_with_embedding} total={overview.total_places} />
        </div>
      </div>
    </div>
  )
}

function KPI({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  const colors: Record<string, string> = {
    sky: 'text-[#38bdf8]', green: 'text-[#4ade80]', yellow: 'text-[#fbbf24]', red: 'text-[#f87171]', orange: 'text-[#fb923c]',
  }
  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
      <div className="text-[10px] text-[#64748b] uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${colors[color] || 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-[#64748b] mt-0.5">{sub}</div>}
    </div>
  )
}

function HealthBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0
  const color = pct >= 80 ? '#4ade80' : pct >= 50 ? '#fbbf24' : '#f87171'
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-[#94a3b8] w-32 shrink-0">{label}</span>
      <div className="flex-1 bg-[#334155] rounded-full h-2">
        <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-medium w-20 text-right" style={{ color }}>{value}/{total} ({pct}%)</span>
    </div>
  )
}
