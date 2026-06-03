'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Send, ChevronDown, Sparkles } from 'lucide-react'
import { SendMessageModal } from '@/components/admin/send-message-modal'
import { ARCHETYPES, BUSINESS_PLAYS, buildPlanMessage, type BusinessPlay } from '@/lib/campaigns'
import type { ConversionOpportunity } from '@/lib/types'

const STATUS_META: Record<BusinessPlay['status'], { label: string; color: string }> = {
  sponsor: { label: 'sponsor', color: '#fbbf24' },
  prospecto: { label: 'prospecto', color: '#38bdf8' },
  cliente: { label: 'cliente', color: '#4ade80' },
}

interface PlanModal {
  businessName: string
  phone: string | null
  message: string
}

export function CampanasView({
  opportunities,
  phones,
}: {
  opportunities: ConversionOpportunity[]
  phones: Record<string, string | null>
}) {
  const [modal, setModal] = useState<PlanModal | null>(null)

  function planFromPlay(play: BusinessPlay) {
    setModal({
      businessName: play.business,
      phone: null,
      message: buildPlanMessage({
        businessName: play.business,
        campaignName: play.campaignName,
        hook: play.hook,
      }),
    })
  }

  function planFromDemand(o: ConversionOpportunity) {
    setModal({
      businessName: o.name,
      phone: phones[o.place_id] || null,
      message: buildPlanMessage({
        businessName: o.name,
        campaignName: 'Campaña de Resultado',
        hook: 'Te mando clientes que ya te están buscando — no posts sueltos.',
        demand: { leadCount: o.lead_count, category: o.category || 'tu categoría' },
      }),
    })
  }

  const archetypeById = Object.fromEntries(ARCHETYPES.map((a) => [a.id, a]))

  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold mb-1">🎬 Campañas</h1>
      <p className="text-[#64748b] text-sm mb-6">
        Vendemos campañas con meta, no publicaciones. El plan de una página es gratis — la ejecución es la Vitrina.
      </p>

      {/* ── Qualifies NOW (live bot demand) ── the surprise: actionable swipe file ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-[#f87171]" />
          <h2 className="text-sm font-semibold text-[#f87171] uppercase tracking-wider">Califican hoy para Campaña de Resultado</h2>
        </div>
        <p className="text-xs text-[#64748b] mb-3">
          Negocios con demanda real en *7711 (3+ leads) que aún no pagan. La data ya prueba que la gente los busca.
        </p>
        {opportunities.length === 0 ? (
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 text-sm text-[#64748b]">
            Ahora mismo ningún negocio cruza el umbral de 3+ leads sin cobrar.
          </div>
        ) : (
          <div className="space-y-2">
            {opportunities.slice(0, 10).map((o) => (
              <div
                key={o.place_id}
                className="flex items-center gap-3 rounded-xl border border-[#334155] bg-[#1e293b] p-3"
              >
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/editar/${o.place_id}`} className="font-semibold text-sm text-white hover:text-[#38bdf8] truncate">
                    {o.name}
                  </Link>
                  <p className="text-xs text-[#94a3b8] truncate">
                    {o.category} · <span className="text-[#4ade80]">{o.lead_count} leads gratis</span> · valor ${(o.total_value_cents / 100).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => planFromDemand(o)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
                >
                  <Send size={13} />
                  Generar plan
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Curated plays (oportunidades escondidas) ── */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Oportunidades escondidas — planes listos</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {BUSINESS_PLAYS.map((play) => {
            const arch = archetypeById[play.archetypeId]
            const st = STATUS_META[play.status]
            return (
              <div key={play.business} className="rounded-xl border border-[#334155] bg-[#1e293b] p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span>{play.emoji}</span>
                  <span className="font-semibold text-sm text-white">{play.business}</span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full" style={{ backgroundColor: st.color + '22', color: st.color }}>
                    {st.label}
                  </span>
                </div>
                <div className="text-xs" style={{ color: arch?.accent }}>
                  {arch?.emoji} {arch?.name} — “{play.campaignName}”
                </div>
                <p className="text-xs text-[#94a3b8]"><span className="text-[#64748b]">Oportunidad:</span> {play.hiddenOpportunity}</p>
                <p className="text-xs text-[#94a3b8]"><span className="text-[#64748b]">Meta:</span> {play.metric}</p>
                <p className="text-xs text-[#cbd5e1] italic">“{play.hook}”</p>
                <button
                  onClick={() => planFromPlay(play)}
                  className="mt-1 self-start flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#334155] hover:bg-[#475569] transition-colors cursor-pointer text-white"
                >
                  <Send size={12} />
                  Generar plan de 1 página
                </button>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── The 6 archetypes (reference) ── */}
      <section>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Los 6 arquetipos</h2>
        <div className="space-y-2">
          {ARCHETYPES.map((a) => (
            <details key={a.id} className="group rounded-xl border border-[#334155] bg-[#1e293b] overflow-hidden">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none select-none hover:bg-[#243349] transition-colors">
                <ChevronDown size={14} className="text-[#64748b] transition-transform group-open:rotate-180" />
                <span style={{ color: a.accent }}>{a.emoji}</span>
                <span className="text-sm font-medium text-white">{a.name}</span>
                <span className="ml-auto text-xs text-[#64748b]">{a.tier}</span>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-[#94a3b8] space-y-1">
                <p><span className="text-[#64748b]">Siente:</span> “{a.feels}”</p>
                <p><span className="text-[#64748b]">Mecanismo:</span> {a.mechanism}</p>
                <p><span className="text-[#64748b]">Meta:</span> {a.metric}</p>
                <p><span className="text-[#64748b]">Fits:</span> {a.fits}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

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
