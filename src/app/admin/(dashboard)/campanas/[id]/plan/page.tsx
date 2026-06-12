import { notFound } from 'next/navigation'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { TIER_META, type CampaignIdea } from '@/lib/campaigns'
import { PrintButton } from './print-button'

export const dynamic = 'force-dynamic'

// One-pager imprimible de la campaña: el "plan de una página" que se le manda
// al prospecto. Por canon (producción regla #3) el precio NO sale por defecto;
// añadir ?precio=1 cuando ELLOS pregunten precio (Kern).
export default async function CampaignOnePager({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ precio?: string }>
}) {
  const { id } = await params
  const { precio } = await searchParams
  const showPrice = precio === '1'

  const supabase = await createSupabaseAdminClient()
  const { data } = await supabase.from('campaign_ideas').select('*').eq('id', id).single()
  if (!data) notFound()
  const idea = data as CampaignIdea

  const tier = TIER_META[idea.tier] || TIER_META.custom
  const copy = Array.isArray(idea.copy_bank) ? idea.copy_bank : []

  return (
    <div className="onepager max-w-3xl bg-white text-[#0f172a] rounded-xl p-8 print:p-0 print:rounded-none print:max-w-none">
      {/* print helper: hide admin shell, show only the one-pager */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .onepager, .onepager * { visibility: visible; }
          .onepager { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="no-print mb-4 flex justify-end">
        <PrintButton />
      </div>

      {/* Header */}
      <header className="border-b-4 border-[#0f766e] pb-4 mb-6">
        <p className="text-xs uppercase tracking-widest text-[#0f766e] font-bold">
          CaboRojo.com · El Veci 787-417-7711
        </p>
        <h1 className="text-3xl font-black mt-2">{idea.title}</h1>
        {idea.business_name && (
          <p className="text-lg text-[#475569] font-semibold mt-1">
            Preparado para {idea.business_name}
          </p>
        )}
      </header>

      {/* 1. Esto es lo que tengo */}
      <section className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-[#0f766e] mb-2">
          1 · Esto es lo que tengo
        </h2>
        {idea.trigger_reason && (
          <p className="text-base leading-relaxed">{idea.trigger_reason}</p>
        )}
        {idea.hook && (
          <p className="text-base leading-relaxed mt-2 font-medium">{idea.hook}</p>
        )}
      </section>

      {/* 2. Esto es lo que hace por ti */}
      <section className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-[#0f766e] mb-2">
          2 · Esto es lo que hace por ti
        </h2>
        <p className="text-base leading-relaxed mb-3">
          Tu negocio aparece todas las semanas donde Cabo Rojo se entera de las cosas.
          No publicaciones sueltas: una secuencia con meta. Cada mes rota por 4 ángulos
          y 3 de los 4 le dan algo útil al vecino antes de pedirle nada.
        </p>
        {copy.length > 0 && (
          <div className="border border-[#cbd5e1] rounded-lg overflow-hidden">
            <p className="bg-[#f0fdfa] px-4 py-2 text-sm font-bold text-[#0f766e]">
              Tu primer mes, ya escrito:
            </p>
            {copy.map((c) => (
              <div key={c.semana} className="px-4 py-3 border-t border-[#e2e8f0]">
                <p className="text-xs font-bold uppercase text-[#64748b] mb-1">
                  Semana {c.semana} · {c.angulo}
                </p>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{c.texto}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 3. Esto es lo que quiero que hagas */}
      <section className="mb-6">
        <h2 className="text-sm font-black uppercase tracking-wider text-[#0f766e] mb-2">
          3 · Esto es lo que quiero que hagas
        </h2>
        <p className="text-base leading-relaxed">
          Si esto te hace sentido, contéstame por aquí mismo y lo cuadramos esta semana.
          Todo por texto, sin reuniones. Si no es pa&apos; ti, no pasa nada: sigue tu camino.
        </p>
        {showPrice && (
          <div className="mt-4 inline-block border-2 border-[#0f766e] rounded-lg px-5 py-3">
            <p className="text-xs uppercase tracking-wider text-[#64748b] font-bold">Inversión</p>
            <p className="text-2xl font-black text-[#0f766e]">{tier.label}</p>
            {idea.trigger_window && (
              <p className="text-xs text-[#64748b] mt-1">Ventana: {idea.trigger_window}</p>
            )}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-[#cbd5e1] pt-4 mt-8">
        <p className="text-sm font-semibold">- Angel | Menos revolú, más sistema, mejor vida.</p>
        <p className="text-xs text-[#64748b] mt-1">
          CaboRojo.com · mapadecaborojo.com · El Veci: textea al 787-417-7711
        </p>
      </footer>
    </div>
  )
}
