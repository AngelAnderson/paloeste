'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Send, ExternalLink } from 'lucide-react'
import { SendMessageModal } from '@/components/admin/send-message-modal'
import { CopyVitrinaLink } from '@/components/admin/copy-vitrina-link'
import { CopyMessageButton } from '@/components/admin/copy-message-button'
import { LeadDetail } from '@/components/admin/lead-detail'
import type { UnbilledBusiness } from '@/lib/admin-queries'
import type { ConversionOpportunity, SponsorROI, AdminOverview } from '@/lib/types'

const COLLECT_TEMPLATE = 'Oye {name}, este mes El Veci te envió {lead_count} clientes buscando {category}. Son ${amount}. ¿Te paso el link de pago?'
const PITCH_TEMPLATE = '{name}, el mes pasado {search_count} personas buscaron {category} en Cabo Rojo por El Veci. Tu negocio salió {match_count} veces. Con La Vitrina sales primero. Mira: chequeodenegocio.com'
const REFERRAL_TEMPLATE = 'Oye {name}, ¿conoces algún negocio en {category} que le interese aparecer en el directorio? Si me refieres a alguien y se activa, te doy un mes gratis.'

interface ModalState {
  businessName: string
  phone: string | null
  message: string
}

export function RevenueDashboard({
  unbilled,
  totalUnbilled,
  opportunities,
  opPhones,
  sponsors,
  sponsorMeta,
  missingPhotos,
  overview,
}: {
  unbilled: UnbilledBusiness[]
  totalUnbilled: number
  opportunities: ConversionOpportunity[]
  opPhones: Record<string, string | null>
  sponsors: SponsorROI[]
  sponsorMeta: Record<string, { token: string; slug: string }>
  missingPhotos: { id: string; name: string; category: string; address: string; sponsor_weight: number }[]
  overview: AdminOverview
}) {
  const [modal, setModal] = useState<ModalState | null>(null)

  function openCollect(u: UnbilledBusiness) {
    const msg = COLLECT_TEMPLATE
      .replace('{name}', u.business_name)
      .replace('{lead_count}', String(u.lead_count))
      .replace('{category}', u.category || 'tu categoría')
      .replace('{amount}', (u.total_cents / 100).toFixed(0))
    setModal({ businessName: u.business_name, phone: u.phone, message: msg })
  }

  function openPitch(o: ConversionOpportunity) {
    const msg = PITCH_TEMPLATE
      .replace('{name}', o.name)
      .replace('{search_count}', String(o.lead_count))
      .replace('{category}', o.category || '')
      .replace('{match_count}', String(o.lead_count))
    setModal({ businessName: o.name, phone: opPhones[o.place_id] || null, message: msg })
  }

  function openSponsorMessage(s: SponsorROI) {
    const meta = sponsorMeta[s.place_id]
    const msg = REFERRAL_TEMPLATE
      .replace('{name}', s.name)
      .replace('{category}', s.category || '')
    // Use phone from sponsorMeta or null
    setModal({ businessName: s.name, phone: null, message: msg })
  }

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
                <div key={u.business_id} className="space-y-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/editar/${u.business_id}`}
                        className="font-medium text-sm text-[#38bdf8] hover:underline"
                      >
                        {u.business_name}
                        <ExternalLink size={10} className="inline ml-1 opacity-50" />
                      </Link>
                      <span className="text-[#64748b] text-xs ml-2">{u.category}</span>
                      {daysSince >= 7 && (
                        <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#f87171]/20 text-[#f87171]">
                          {daysSince}d sin cobrar
                        </span>
                      )}
                    </div>
                    {u.phone ? (
                      <button
                        onClick={() => openCollect(u)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30 transition-colors cursor-pointer"
                      >
                        <Send size={12} />
                        Enviar
                      </button>
                    ) : (
                      <CopyMessageButton
                        template={COLLECT_TEMPLATE}
                        variables={{ name: u.business_name, lead_count: u.lead_count, category: u.category || '', amount: (u.total_cents / 100).toFixed(0) }}
                      />
                    )}
                  </div>
                  <LeadDetail leadCount={u.lead_count} totalCents={u.total_cents} leads={u.leads} />
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
                  <Link
                    href={`/admin/editar/${o.place_id}`}
                    className="font-medium text-sm text-[#38bdf8] hover:underline"
                  >
                    {o.name}
                    <ExternalLink size={10} className="inline ml-1 opacity-50" />
                  </Link>
                  <span className="text-[#64748b] text-xs ml-2">{o.category}</span>
                  <span className="text-[#4ade80] text-xs ml-2">{o.lead_count} leads gratis · ${(o.total_value_cents / 100).toFixed(0)}</span>
                </div>
                {opPhones[o.place_id] ? (
                  <button
                    onClick={() => openPitch(o)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#a78bfa]/20 text-[#a78bfa] hover:bg-[#a78bfa]/30 transition-colors cursor-pointer"
                  >
                    <Send size={12} />
                    Enviar pitch
                  </button>
                ) : (
                  <CopyMessageButton
                    template={PITCH_TEMPLATE}
                    variables={{ name: o.name, search_count: o.lead_count, category: o.category || '', match_count: o.lead_count }}
                    label="Copiar pitch"
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Block 3 — TUS SPONSORS */}
      <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-lg">⭐</span>
          <h2 className="text-sm font-semibold text-[#fbbf24] uppercase tracking-wider">Tus Sponsors</h2>
        </div>
        {sponsors.length === 0 ? (
          <p className="text-[#64748b] text-sm">No hay sponsors activos.</p>
        ) : (
          <div className="space-y-4">
            {sponsors.map((s) => {
              const health = s.leads_30d > 0 && s.profile_completeness >= 80 ? 'green'
                : (s.leads_30d === 0 && s.profile_completeness < 60) ? 'red'
                : 'yellow'
              const healthEmoji = health === 'green' ? '🟢' : health === 'yellow' ? '🟡' : '🔴'
              const meta = sponsorMeta[s.place_id]
              return (
                <div key={s.place_id} className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span>{healthEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/admin/editar/${s.place_id}`}
                        className="font-medium text-sm text-[#38bdf8] hover:underline"
                      >
                        {s.name}
                        <ExternalLink size={10} className="inline ml-1 opacity-50" />
                      </Link>
                      <span className="text-[#64748b] text-xs ml-2">
                        {s.leads_30d} leads/30d · {s.leads_total} total · {s.profile_completeness}% perfil
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 ml-7">
                    {meta?.token && (
                      <CopyVitrinaLink slug={meta.slug} token={meta.token} />
                    )}
                    <button
                      onClick={() => openSponsorMessage(s)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#334155] hover:bg-[#475569] transition-colors cursor-pointer"
                    >
                      <Send size={12} className="text-[#94a3b8]" />
                      <span className="text-[#94a3b8]">Pedir referido</span>
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* Block 4 — PENDIENTE FOTOS (Noelia) */}
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
                <Link href={`/admin/editar/${p.id}`} className="flex-1 font-medium text-[#38bdf8] hover:underline">
                  {p.name}
                </Link>
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

      {/* Send Message Modal */}
      {modal && (
        <SendMessageModal
          businessName={modal.businessName}
          phone={modal.phone}
          defaultMessage={modal.message}
          onClose={() => setModal(null)}
        />
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
