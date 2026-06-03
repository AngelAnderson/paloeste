'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Send, ExternalLink, ChevronRight, AlertTriangle, Moon, ChevronDown } from 'lucide-react'
import { SendMessageModal } from '@/components/admin/send-message-modal'
import { CopyVitrinaLink } from '@/components/admin/copy-vitrina-link'
import { LeadDetail } from '@/components/admin/lead-detail'
import { BotPulseCard } from '@/components/admin/bot-pulse-card'
import { RelationshipsCard } from '@/components/admin/relationships-card'
import { SinceLastVisit } from '@/components/admin/since-last-visit'
import { EodModal } from '@/components/admin/eod-modal'
import { NightlyAgentsCard } from '@/components/admin/nightly-agents-card'
import type { NightlyAgentRun } from '@/lib/admin-queries'
import { rankActions, type RankedAction } from '@/lib/admin-action-ranker'
import type { UnbilledBusiness } from '@/lib/admin-queries'
import type { ConversionOpportunity, SponsorROI, AdminOverview, Prospect, BotIntelligence, OverdueRelationship } from '@/lib/types'

const COLLECT_TEMPLATE = 'Oye {name}, este mes El Veci te envió {lead_count} clientes buscando {category}. Son ${amount}. ¿Te paso el link de pago?'
const PITCH_TEMPLATE = '{name}, el mes pasado {search_count} personas buscaron {category} en Cabo Rojo por El Veci. Tu negocio salió {match_count} veces. Con La Vitrina sales primero. Mira: chequeodenegocio.com'
const REFERRAL_TEMPLATE = 'Oye {name}, ¿conoces algún negocio en {category} que le interese aparecer en el directorio? Si me refieres a alguien y se activa, te doy un mes gratis.'

interface ModalState {
  businessName: string
  phone: string | null
  message: string
}

const TYPE_META: Record<RankedAction['type'], { label: string; emoji: string; color: string }> = {
  follow_up: { label: 'Follow-up', emoji: '📞', color: '#fbbf24' },
  unbilled: { label: 'Cobrar', emoji: '💰', color: '#f87171' },
  pitch: { label: 'Pitchear', emoji: '🎯', color: '#a78bfa' },
  sponsor_risk: { label: 'Sponsor en riesgo', emoji: '⚠️', color: '#fb923c' },
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
  followUps,
  staleCount,
  botIntel,
  overdueRels,
  nightlyRuns,
}: {
  unbilled: UnbilledBusiness[]
  totalUnbilled: number
  opportunities: ConversionOpportunity[]
  opPhones: Record<string, string | null>
  sponsors: SponsorROI[]
  sponsorMeta: Record<string, { token: string; slug: string; phone: string | null }>
  missingPhotos: { id: string; name: string; category: string; address: string; sponsor_weight: number }[]
  overview: AdminOverview
  followUps: Prospect[]
  staleCount: number
  botIntel: BotIntelligence | null
  overdueRels: OverdueRelationship[]
  nightlyRuns: NightlyAgentRun[]
}) {
  const [modal, setModal] = useState<ModalState | null>(null)
  const [eodOpen, setEodOpen] = useState(false)
  const nowMs = useMemo(() => new Date().getTime(), [])

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
    setModal({ businessName: s.name, phone: meta?.phone || null, message: msg })
  }

  function handleAction(action: RankedAction) {
    if (action.payload.type === 'follow_up') {
      const p = action.payload.prospect
      if (p.contact_phone) {
        setModal({ businessName: p.business_name, phone: p.contact_phone, message: p.next_action || '' })
      }
      return
    }
    if (action.payload.type === 'unbilled') return openCollect(action.payload.unbilled)
    if (action.payload.type === 'pitch') return openPitch(action.payload.opportunity)
    if (action.payload.type === 'sponsor_risk') return openSponsorMessage(action.payload.sponsor)
  }

  function openRelationshipMessage(rel: OverdueRelationship) {
    if (!rel.contact_phone) return
    setModal({ businessName: rel.name, phone: rel.contact_phone, message: rel.next_action || '' })
  }

  const rankedActions = rankActions({ followUps, unbilled, opportunities, sponsors })

  // The one money number: collectable now + opportunity value on the table
  const oppValue = opportunities.reduce((s, o) => s + (o.total_value_cents || 0), 0)
  const moneyInPlay = totalUnbilled + oppValue

  const top = rankedActions.slice(0, 6)
  const restCount = Math.max(0, rankedActions.length - top.length)

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1 className="text-xl font-bold">Revenue Co-Pilot</h1>
        <button
          onClick={() => setEodOpen(true)}
          className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-white hover:border-[#38bdf8] transition-colors"
        >
          <Moon size={13} />
          Cierra el día
        </button>
      </div>

      <SinceLastVisit />

      {/* Money in play — one glance */}
      <div className="mb-6">
        <div className="text-[11px] text-[#64748b] uppercase tracking-wider mb-1">Dinero en juego hoy</div>
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-4xl font-bold text-white tabular-nums">${(moneyInPlay / 100).toLocaleString()}</span>
          <span className="text-sm text-[#f87171]">${(totalUnbilled / 100).toLocaleString()} sin cobrar</span>
          <span className="text-sm text-[#a78bfa]">${(oppValue / 100).toLocaleString()} en oportunidades</span>
        </div>
      </div>

      {/* THE action queue — everything you should do, ranked */}
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-semibold text-[#38bdf8] uppercase tracking-wider">Haz esto hoy</h2>
          <span className="text-xs text-[#475569]">ranked por $ × urgencia</span>
          {staleCount > 0 && (
            <span className="ml-auto flex items-center gap-1 text-xs text-[#f87171]">
              <AlertTriangle size={11} />
              {staleCount} stale en pipeline
            </span>
          )}
        </div>

        {top.length === 0 ? (
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-8 text-center">
            <div className="text-2xl mb-1">🎉</div>
            <p className="text-sm text-[#94a3b8]">Todo al día. Nada que cobrar ni pitchear ahora mismo.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {top.map((action, idx) => {
              const meta = TYPE_META[action.type]
              const isTop = idx === 0
              return (
                <div
                  key={action.id}
                  className={`flex items-center gap-3 rounded-xl border bg-[#1e293b] p-3 transition-colors ${
                    isTop ? 'border-[#38bdf8]/40' : 'border-[#334155] hover:border-[#475569]'
                  }`}
                >
                  <span
                    className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: meta.color + '22', color: meta.color }}
                  >
                    {idx + 1}
                  </span>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        href={action.href}
                        className="font-semibold text-sm text-white hover:text-[#38bdf8] transition-colors truncate"
                      >
                        {action.title}
                      </Link>
                      <span className="text-[10px] shrink-0" style={{ color: meta.color }}>
                        {meta.emoji} {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#94a3b8] truncate">{action.reason}</p>
                  </div>

                  {action.amountCents != null && action.amountCents > 0 && (
                    <div className="shrink-0 text-right">
                      <div className="text-sm font-bold text-[#4ade80] tabular-nums">
                        ${(action.amountCents / 100).toLocaleString()}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => handleAction(action)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
                  >
                    {action.ctaLabel === 'Pipeline' ? <ChevronRight size={13} /> : <Send size={13} />}
                    {action.ctaLabel}
                  </button>
                </div>
              )
            })}
            {restCount > 0 && (
              <Link
                href="/admin/pipeline"
                className="block text-center text-xs text-[#64748b] hover:text-[#94a3b8] py-2 transition-colors"
              >
                + {restCount} acción{restCount > 1 ? 'es' : ''} más en el pipeline →
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Compact KPI strip */}
      <div className="grid grid-cols-4 gap-2 mb-6">
        <KPI label="Sin cobrar" value={`$${(totalUnbilled / 100).toFixed(0)}`} color="red" />
        <KPI label="Sponsors" value={overview.active_sponsors} color="yellow" />
        <KPI label="Leads 7d" value={overview.total_leads_7d} color="green" />
        <KPI label="Oportunidades" value={opportunities.length} color="sky" />
      </div>

      {/* Everything secondary — quiet, collapsible, zero data lost */}
      <div className="space-y-2">
        {(botIntel || overdueRels.length > 0) && (
          <Collapsible title="Pulso del bot & relaciones" badge={overdueRels.length > 0 ? `${overdueRels.length} overdue` : undefined}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {botIntel && <BotPulseCard intel={botIntel} />}
              <RelationshipsCard overdue={overdueRels} onMessage={openRelationshipMessage} />
            </div>
          </Collapsible>
        )}

        {nightlyRuns.length > 0 && (
          <Collapsible title="Agentes nocturnos" badge={`${nightlyRuns.length}`}>
            <NightlyAgentsCard runs={nightlyRuns} />
          </Collapsible>
        )}

        {sponsors.length > 0 && (
          <Collapsible title="Tus sponsors" badge={`${sponsors.length}`}>
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
                        <Link href={`/admin/editar/${s.place_id}`} className="font-medium text-sm text-[#38bdf8] hover:underline">
                          {s.name}
                          <ExternalLink size={10} className="inline ml-1 opacity-50" />
                        </Link>
                        <span className="text-[#64748b] text-xs ml-2">
                          {s.leads_30d} leads/30d · {s.leads_total} total · {s.profile_completeness}% perfil
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-7 flex-wrap">
                      {meta?.token && <CopyVitrinaLink slug={meta.slug} token={meta.token} />}
                      {meta?.phone && (
                        <button
                          onClick={() => setModal({ businessName: s.name, phone: meta.phone, message: '' })}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30 transition-colors cursor-pointer"
                        >
                          <Send size={12} />
                          Mensaje
                        </button>
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
          </Collapsible>
        )}

        {unbilled.length > 0 && (
          <Collapsible title="Cobros — detalle por lead" badge={`$${(totalUnbilled / 100).toFixed(0)}`}>
            <div className="space-y-3">
              {unbilled.slice(0, 12).map((u) => {
                const daysSince = Math.floor((nowMs - new Date(u.newest).getTime()) / 86400000)
                return (
                  <div key={u.business_id} className="space-y-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <Link href={`/admin/editar/${u.business_id}`} className="font-medium text-sm text-[#38bdf8] hover:underline">
                          {u.business_name}
                          <ExternalLink size={10} className="inline ml-1 opacity-50" />
                        </Link>
                        <span className="text-[#64748b] text-xs ml-2">{u.category}</span>
                        {daysSince >= 7 && (
                          <span className="ml-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#f87171]/20 text-[#f87171]">
                            {daysSince}d
                          </span>
                        )}
                      </div>
                      {u.phone && (
                        <button
                          onClick={() => openCollect(u)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30 transition-colors cursor-pointer"
                        >
                          <Send size={12} />
                          Enviar
                        </button>
                      )}
                    </div>
                    <LeadDetail leadCount={u.lead_count} totalCents={u.total_cents} leads={u.leads} nowMs={nowMs} />
                  </div>
                )
              })}
            </div>
          </Collapsible>
        )}

        {missingPhotos.length > 0 && (
          <Collapsible title="Pendiente — fotos (Noelia)" badge={`${missingPhotos.length}`}>
            <div className="space-y-2">
              {missingPhotos.slice(0, 12).map((p) => (
                <div key={p.id} className="flex items-center gap-3 text-sm">
                  <Link href={`/admin/editar/${p.id}`} className="flex-1 font-medium text-[#38bdf8] hover:underline">
                    {p.name}
                  </Link>
                  <span className="text-[#64748b] text-xs">{p.category}</span>
                  {p.sponsor_weight > 0 && (
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#fbbf24]/20 text-[#fbbf24]">sponsor</span>
                  )}
                </div>
              ))}
            </div>
          </Collapsible>
        )}
      </div>

      {modal && (
        <SendMessageModal
          businessName={modal.businessName}
          phone={modal.phone}
          defaultMessage={modal.message}
          onClose={() => setModal(null)}
        />
      )}

      {eodOpen && (
        <EodModal cobros={unbilled} rels={overdueRels} onClose={() => setEodOpen(false)} />
      )}
    </div>
  )
}

function Collapsible({ title, badge, children }: { title: string; badge?: string; children: React.ReactNode }) {
  return (
    <details className="group bg-[#1e293b] rounded-xl border border-[#334155] overflow-hidden">
      <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none select-none hover:bg-[#243349] transition-colors">
        <ChevronDown size={14} className="text-[#64748b] transition-transform group-open:rotate-180" />
        <span className="text-sm font-medium text-[#94a3b8]">{title}</span>
        {badge && <span className="ml-auto text-xs text-[#64748b]">{badge}</span>}
      </summary>
      <div className="px-4 pb-4 pt-1">{children}</div>
    </details>
  )
}

function KPI({ label, value, color }: { label: string; value: string | number; color: string }) {
  const colors: Record<string, string> = {
    sky: 'text-[#38bdf8]', green: 'text-[#4ade80]', yellow: 'text-[#fbbf24]', red: 'text-[#f87171]',
  }
  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-3">
      <div className="text-[10px] text-[#64748b] uppercase tracking-wider truncate">{label}</div>
      <div className={`text-xl font-bold mt-0.5 tabular-nums ${colors[color] || 'text-white'}`}>{value}</div>
    </div>
  )
}
