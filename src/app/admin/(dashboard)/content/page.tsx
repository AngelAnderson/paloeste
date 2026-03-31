import { getAdminPlaces, getUpcomingEventsWithoutContent } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

export default async function ContentPage() {
  const [places, events] = await Promise.all([
    getAdminPlaces(),
    getUpcomingEventsWithoutContent(),
  ])

  const noImage = places.filter(p => !p.hero_image_url).length
  const noDesc = places.filter(p => !p.description || p.description.length < 20).length
  const noPhone = places.filter(p => !p.phone).length
  const sponsors = places.filter(p => p.sponsor_weight > 0)
  const sponsorsNoImage = sponsors.filter(p => !p.hero_image_url)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Content Gaps</h1>
      <p className="text-[#64748b] text-sm mb-6">What&apos;s missing? Where should editorial effort go?</p>

      {/* Upcoming Events Without Posts */}
      {events.length > 0 && (
        <div className="bg-[#fb923c]/10 border border-[#fb923c]/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#fb923c] uppercase tracking-wider mb-3">
            Upcoming Events Without Posts ({events.length})
          </h2>
          <div className="space-y-2">
            {events.map(e => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-[#fb923c] font-bold shrink-0">
                  {new Date(e.start_time).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                </span>
                <span className="font-medium flex-1">{e.title}</span>
                <span className="text-[#64748b] shrink-0">{e.location_name}</span>
                <span className="bg-[#334155] text-[#94a3b8] text-xs px-2 py-0.5 rounded-full shrink-0">{e.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <GapCard label="No Image" count={noImage} total={places.length} icon="📷" />
        <GapCard label="No Description" count={noDesc} total={places.length} icon="📝" />
        <GapCard label="No Phone" count={noPhone} total={places.length} icon="📞" />
        <GapCard label="Sponsors w/o Image" count={sponsorsNoImage.length} total={sponsors.length} icon="⭐" critical />
      </div>

      {/* Sponsors without images — priority */}
      {sponsorsNoImage.length > 0 && (
        <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#f87171] uppercase tracking-wider mb-3">Sponsors Missing Images (Priority!)</h2>
          <div className="space-y-2">
            {sponsorsNoImage.map(s => (
              <div key={s.id} className="flex items-center gap-3 text-sm">
                <span className="text-[#fbbf24] font-bold">★{s.sponsor_weight}</span>
                <span className="font-medium">{s.name}</span>
                <span className="text-[#64748b]">{s.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All places without images */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
          Places Without Images ({noImage})
        </h2>
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {places.filter(p => !p.hero_image_url).slice(0, 50).map(p => (
            <div key={p.id} className="flex items-center gap-3 text-sm py-1 border-b border-[#334155]">
              <span className="text-[#64748b] w-24 shrink-0">{p.category}</span>
              <span className="font-medium">{p.name}</span>
              {p.sponsor_weight > 0 && <span className="text-[#fbbf24] text-xs">★{p.sponsor_weight}</span>}
            </div>
          ))}
          {noImage > 50 && <div className="text-xs text-[#64748b] pt-2">... and {noImage - 50} more</div>}
        </div>
      </div>

      {/* Places without descriptions */}
      <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
          Places Without Descriptions ({noDesc})
        </h2>
        <div className="max-h-[400px] overflow-y-auto space-y-1">
          {places.filter(p => !p.description || p.description.length < 20).slice(0, 50).map(p => (
            <div key={p.id} className="flex items-center gap-3 text-sm py-1 border-b border-[#334155]">
              <span className="text-[#64748b] w-24 shrink-0">{p.category}</span>
              <span className="font-medium">{p.name}</span>
              {p.sponsor_weight > 0 && <span className="text-[#fbbf24] text-xs">★{p.sponsor_weight}</span>}
            </div>
          ))}
          {noDesc > 50 && <div className="text-xs text-[#64748b] pt-2">... and {noDesc - 50} more</div>}
        </div>
      </div>
    </div>
  )
}

function GapCard({ label, count, total, icon, critical }: { label: string; count: number; total: number; icon: string; critical?: boolean }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div className={`rounded-xl border p-4 ${critical && count > 0 ? 'bg-[#f87171]/10 border-[#f87171]/30' : 'bg-[#1e293b] border-[#334155]'}`}>
      <div className="text-lg mb-1">{icon}</div>
      <div className="text-2xl font-bold text-[#f87171]">{count}</div>
      <div className="text-[10px] text-[#64748b] uppercase tracking-wider">{label} ({pct}%)</div>
    </div>
  )
}
