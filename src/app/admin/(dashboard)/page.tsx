import { getUnbilledLeadsByBusiness, getConversionOpportunities, getSponsorROI, getPlacesMissingPhotos, getAdminOverview } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { CopyMessageButton } from '@/components/admin/copy-message-button'
import { CopyVitrinaLink } from '@/components/admin/copy-vitrina-link'

export const dynamic = 'force-dynamic'

const COLLECT_TEMPLATE = 'Oye {name}, este mes El Veci te envió {lead_count} clientes buscando {category}. Son ${amount}. ¿Te paso el link de pago?'
const PITCH_TEMPLATE = '{name}, el mes pasado {search_count} personas buscaron {category} en Cabo Rojo por El Veci. Tu negocio salió {match_count} veces. Con La Vitrina sales primero. Mira: chequeodenegocio.com'

export default async function AdminDashboard() {
  const [unbilled, opportunities, sponsors, missingPhotos, overview] = await Promise.all([
    getUnbilledLeadsByBusiness(),
    getConversionOpportunities(3),
    getSponsorROI(),
    getPlacesMissingPhotos(),
    getAdminOverview(),
  ])

  // Get vitrina tokens and slugs for sponsors
  const sponsorMeta = new Map<string, { token: string; slug: string }>()
  if (sponsors.length > 0) {
    const supabase = await createSupabaseAdminClient()
    const { data: sponsorRows } = await supabase
      .from('places')
      .select('id, slug, vitrina_token')
      .in('id', sponsors.map(s => s.place_id))
    for (const row of sponsorRows || []) {
      if (row.vitrina_token && row.slug) {
        sponsorMeta.set(row.id, { token: row.vitrina_token, slug: row.slug })
      }
    }
  }

  const totalUnbilled = unbilled.reduce((sum, u) => sum + u.total_cents, 0)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Revenue Co-Pilot</h1>
      <p className="text-[#64748b] text-sm mb-6">Acciones que mueven dinero — hoy.</p>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Sin cobrar" value={`$${(totalUnbilled / 100).toFixed(0)}`} color="red" sub={`${unbilled.length} negocios`} />
        <KPI label="Sponsors" value={overview.active_sponsors} color="yellow" />
        <KPI label="Leads (7d)" value={overview.total_leads_7d} color="green" />
        <KPI label="Oportunidades" value={opportunities.length} color="sky" sub="free con demanda" />
      </div>

      {/* Block 1 — COBRA HOY */}
      <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">💰</span>
          <h2 className="text-sm font-semibold text-[#f87171] uppercase tracking-wider">Cobra Hoy</h2>
          {totalUnbilled > 0 && (
            <span className="ml-auto text-lg font-bold text-[#f87171]">${(totalUnbilled / 100).toFixed(0)} sin cobrar</span>
          )}
        </div>
        {unbilled.length === 0 ? (
          <p className="text-[#64748b] text-sm">Todo cobrado. 🎉</p>
        ) : (
          <div className="space-y-3">
            {unbilled.slice(0, 8).map((u) => {
              const daysSince = Math.floor((Date.now() - new Date(u.newest).getTime()) / 86400000)
              return (
                <div key={u.business_id} className="flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{u.business_name}</span>
                    <span className="text-[#64748b] text-xs ml-2">{u.lead_count} leads · ${(u.total_cents / 100).toFixed(0)}</span>
                    {daysSince >= 7 && (
                      <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#f87171]/20 text-[#f87171]">
                        {daysSince}d sin cobrar
                      </span>
                    )}
                  </div>
                  <CopyMessageButton
                    template={COLLECT_TEMPLATE}
                    variables={{
                      name: u.business_name,
                      lead_count: u.lead_count,
                      category: '',
                      amount: (u.total_cents / 100).toFixed(0),
                    }}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Block 2 — PITCHEA HOY */}
      <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">🎯</span>
          <h2 className="text-sm font-semibold text-[#a78bfa] uppercase tracking-wider">Pitchea Hoy</h2>
        </div>
        {opportunities.length === 0 ? (
          <p className="text-[#64748b] text-sm">No hay oportunidades con 3+ leads ahora mismo.</p>
        ) : (
          <div className="space-y-3">
            {opportunities.slice(0, 5).map((o) => (
              <div key={o.place_id} className="flex items-center gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm">{o.name}</span>
                  <span className="text-[#64748b] text-xs ml-2">{o.category}</span>
                  <span className="text-[#4ade80] text-xs ml-2">{o.lead_count} leads gratis · ${(o.total_value_cents / 100).toFixed(0)} valor</span>
                </div>
                <CopyMessageButton
                  template={PITCH_TEMPLATE}
                  variables={{
                    name: o.name,
                    search_count: o.lead_count,
                    category: o.category || '',
                    match_count: o.lead_count,
                  }}
                  label="Copiar pitch"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Block 3 — RETENCIÓN */}
      <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">📊</span>
          <h2 className="text-sm font-semibold text-[#fbbf24] uppercase tracking-wider">Retención</h2>
        </div>
        {sponsors.length === 0 ? (
          <p className="text-[#64748b] text-sm">No hay sponsors activos.</p>
        ) : (
          <div className="space-y-3">
            {sponsors.map((s) => {
              const health = s.leads_30d > 0 && s.profile_completeness >= 80 ? 'green'
                : (s.leads_30d === 0 && s.profile_completeness < 60) ? 'red'
                : 'yellow'
              const healthEmoji = health === 'green' ? '🟢' : health === 'yellow' ? '🟡' : '🔴'
              const meta = sponsorMeta.get(s.place_id)
              return (
                <div key={s.place_id} className="flex items-center gap-3 flex-wrap">
                  <span>{healthEmoji}</span>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{s.name}</span>
                    <span className="text-[#64748b] text-xs ml-2">
                      {s.leads_30d} leads/30d · {s.profile_completeness}% perfil
                    </span>
                  </div>
                  {meta && (
                    <CopyVitrinaLink slug={meta.slug} token={meta.token} />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Noelia Section — PENDIENTE FOTOS */}
      {missingPhotos.length > 0 && (
        <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📷</span>
            <h2 className="text-sm font-semibold text-[#38bdf8] uppercase tracking-wider">Pendiente — Fotos</h2>
            <span className="ml-auto text-xs text-[#64748b]">{missingPhotos.length} negocios sin foto</span>
          </div>
          <div className="space-y-2">
            {missingPhotos.slice(0, 10).map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm">
                <span className="flex-1 font-medium">{p.name}</span>
                <span className="text-[#64748b] text-xs">{p.category}</span>
                {p.sponsor_weight > 0 && (
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24]">
                    sponsor
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function KPI({ label, value, color, sub }: { label: string; value: string | number; color: string; sub?: string }) {
  const colors: Record<string, string> = {
    sky: 'text-[#38bdf8]', green: 'text-[#4ade80]', yellow: 'text-[#fbbf24]', red: 'text-[#f87171]',
  }
  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-4">
      <div className="text-[10px] text-[#64748b] uppercase tracking-wider">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${colors[color] || 'text-white'}`}>{value}</div>
      {sub && <div className="text-xs text-[#64748b] mt-0.5">{sub}</div>}
    </div>
  )
}
