import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getPlaceBySlugWithToken, getSponsorLeadsWeekly, getCategoryPosition, getSponsorLeadsTotal, getProfileCompleteness } from '@/lib/admin-queries'
import { WeeklyLeadsChart } from './weekly-leads-chart'

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const place = await getPlaceBySlugWithToken(slug)
  if (!place) return { title: 'No encontrado' }
  return {
    title: `${place.name} — Reporte Sponsor`,
    robots: { index: false, follow: false },
  }
}

export default async function SponsorReportePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const token = sp?.token

  if (!token) notFound()

  const place = await getPlaceBySlugWithToken(slug)
  if (!place || place.vitrina_token !== token) notFound()

  const [weeklyLeads, position, leadsTotal, completeness] = await Promise.all([
    getSponsorLeadsWeekly(place.id, 12),
    getCategoryPosition(place.id),
    getSponsorLeadsTotal(place.id),
    getProfileCompleteness(place),
  ])

  const completenessColor = completeness.score >= 80 ? '#4ade80' : completeness.score >= 50 ? '#fbbf24' : '#f87171'

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <header className="text-center space-y-3">
          {place.hero_image_url && (
            <img
              src={place.hero_image_url}
              alt={place.name}
              className="w-20 h-20 rounded-2xl object-cover mx-auto"
            />
          )}
          <h1 className="text-2xl font-bold">{place.name}</h1>
          <span className="inline-block text-xs font-bold uppercase px-3 py-1 rounded-full bg-[#4ade80]/20 text-[#4ade80]">
            Sponsor Activo
          </span>
        </header>

        {/* Block 1 — Tus Clientes */}
        <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Tus Clientes</h2>
          <div className="text-center">
            <p className="text-5xl font-black text-[#4ade80]">{leadsTotal.total}</p>
            <p className="text-[#64748b] text-sm mt-1">clientes enviados en total</p>
          </div>

          {/* Channel breakdown */}
          {leadsTotal.by_channel.length > 0 && (
            <div className="flex justify-center gap-6">
              {leadsTotal.by_channel.map((ch) => (
                <div key={ch.channel} className="text-center">
                  <p className="text-lg font-bold">{ch.count}</p>
                  <p className="text-[#64748b] text-xs">{ch.channel}</p>
                </div>
              ))}
            </div>
          )}

          {/* Weekly chart */}
          {weeklyLeads.length > 0 && (
            <WeeklyLeadsChart data={weeklyLeads} />
          )}
        </section>

        {/* Block 2 — Tu Categoría */}
        {position && (
          <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 space-y-4">
            <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Tu Categoría</h2>
            <p className="text-[#94a3b8]">
              <span className="text-white font-bold">{position.searches_30d}</span> personas buscaron{' '}
              <span className="text-white font-bold">{position.category}</span> este mes en Cabo Rojo
            </p>
            <div className="flex justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-black text-[#38bdf8]">#{position.rank}</p>
                <p className="text-[#64748b] text-xs">tu posición</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-black">{position.total}</p>
                <p className="text-[#64748b] text-xs">en tu categoría</p>
              </div>
            </div>
          </section>
        )}

        {/* Block 3 — Tu Perfil */}
        <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 space-y-4">
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Tu Perfil</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-[#94a3b8]">Completitud</span>
              <span className="font-bold" style={{ color: completenessColor }}>{completeness.score}%</span>
            </div>
            <div className="bg-[#334155] rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all"
                style={{ width: `${completeness.score}%`, backgroundColor: completenessColor }}
              />
            </div>
          </div>
          {completeness.missing.length > 0 && (
            <div className="space-y-2">
              <p className="text-[#64748b] text-xs">Añade estos datos para aparecer en más búsquedas:</p>
              {completeness.missing.map((item) => (
                <div key={item} className="flex items-center gap-2 text-sm">
                  <span className="text-[#f87171]">○</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <footer className="text-center text-[#64748b] text-sm pt-4 space-y-1">
          <p>¿Preguntas? Textea al 787-417-7711</p>
          <p>Powered by <a href="https://caborojo.com" className="text-[#38bdf8] hover:underline">CaboRojo.com</a></p>
        </footer>

      </div>
    </div>
  )
}
