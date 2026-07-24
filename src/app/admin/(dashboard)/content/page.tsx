import Link from 'next/link'
import { getAdminPlaces, getUpcomingEventsWithoutContent } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

const KIND_LABEL: Record<string, { label: string; emoji: string }> = {
  page_create: { label: 'Página nueva', emoji: '🆕' },
  page_rewrite: { label: 'Reescritura', emoji: '✏️' },
  comment_reply: { label: 'Respuesta a vecino', emoji: '💬' },
  note: { label: 'Nota del agente', emoji: '📌' },
}

export default async function ContentPage() {
  const supabase = await createSupabaseAdminClient()
  const [places, events, { data: opsPending }] = await Promise.all([
    getAdminPlaces(),
    getUpcomingEventsWithoutContent(),
    supabase
      .from('ops_queue')
      .select('id, kind, title, summary, created_at')
      .eq('status', 'pending')
      .order('created_at', { ascending: true }),
  ])

  const drafts = (opsPending || []).filter((d) => d.kind !== 'note')
  const notes = (opsPending || []).filter((d) => d.kind === 'note')

  const noImage = places.filter((p) => !p.hero_image_url)
  const noDesc = places.filter((p) => !p.description || p.description.length < 20)
  const noPhone = places.filter((p) => !p.phone)
  const sponsors = places.filter((p) => p.sponsor_weight > 0)
  const sponsorsNoImage = sponsors.filter((p) => !p.hero_image_url)

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1">Contenido</h1>
      <p className="text-[#64748b] text-sm mb-6">Drafts esperando tu dale, eventos sin post, y qué le falta al directorio. Todo accionable.</p>

      {/* Drafts del executor — lo que espera tu dale */}
      {drafts.length > 0 && (
        <div className="bg-[#38bdf8]/10 border border-[#38bdf8]/30 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-[#38bdf8] uppercase tracking-wider">
              Drafts esperando tu dale ({drafts.length})
            </h2>
            <Link href="/admin/ops" className="text-xs bg-[#38bdf8] text-[#0f172a] font-bold px-3 py-1.5 rounded-full hover:bg-[#7dd3fc] transition-colors">
              Abrir cockpit →
            </Link>
          </div>
          <div className="space-y-2">
            {drafts.map((d) => {
              const k = KIND_LABEL[d.kind] || KIND_LABEL.note
              return (
                <Link key={d.id} href="/admin/ops" className="flex items-start gap-3 text-sm py-2 px-3 rounded-lg bg-[#0f172a]/40 hover:bg-[#0f172a]/70 transition-colors">
                  <span className="shrink-0">{k.emoji}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-white truncate">{d.title}</p>
                    <p className="text-[#94a3b8] text-xs mt-0.5 line-clamp-2">{d.summary}</p>
                  </div>
                  <span className="ml-auto shrink-0 text-[10px] text-[#64748b] bg-[#334155] px-2 py-0.5 rounded-full">{k.label}</span>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Notas del agente (informativas) */}
      {notes.length > 0 && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 mb-6">
          <h2 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-2">
            Notas del agente ({notes.length}) — demanda sin página
          </h2>
          <div className="flex flex-wrap gap-2">
            {notes.map((n) => (
              <span key={n.id} className="text-xs bg-[#334155] text-[#cbd5e1] px-2.5 py-1 rounded-full">
                {n.title.replace('Nota del agente: ', '')}
              </span>
            ))}
          </div>
          <Link href="/admin/ops" className="inline-block mt-3 text-xs text-[#38bdf8] hover:underline">Revisar en el cockpit →</Link>
        </div>
      )}

      {/* Eventos próximos sin post */}
      {events.length > 0 && (
        <div className="bg-[#fb923c]/10 border border-[#fb923c]/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#fb923c] uppercase tracking-wider mb-3">
            Eventos próximos sin post ({events.length})
          </h2>
          <div className="space-y-2">
            {events.map((e) => (
              <div key={e.id} className="flex items-center gap-3 text-sm">
                <span className="text-[#fb923c] font-bold shrink-0">
                  {new Date(e.start_time).toLocaleDateString('es', { month: 'short', day: 'numeric' })}
                </span>
                <span className="font-medium flex-1">{e.title}</span>
                <span className="text-[#64748b] shrink-0">{e.location_name}</span>
                <span className="bg-[#334155] text-[#94a3b8] text-xs px-2 py-0.5 rounded-full shrink-0">{e.category}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resumen de gaps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <GapCard label="Sin foto" count={noImage.length} total={places.length} icon="📷" />
        <GapCard label="Sin descripción" count={noDesc.length} total={places.length} icon="📝" />
        <GapCard label="Sin teléfono" count={noPhone.length} total={places.length} icon="📞" />
        <GapCard label="Sponsors sin foto" count={sponsorsNoImage.length} total={sponsors.length} icon="⭐" critical />
      </div>

      {/* Sponsors sin foto — prioridad */}
      {sponsorsNoImage.length > 0 && (
        <div className="bg-[#f87171]/10 border border-[#f87171]/30 rounded-xl p-5 mb-6">
          <h2 className="text-sm font-semibold text-[#f87171] uppercase tracking-wider mb-3">Sponsors sin foto (¡prioridad!)</h2>
          <div className="space-y-1">
            {sponsorsNoImage.map((s) => (
              <EditRow key={s.id} id={s.id} name={s.name} category={s.category} weight={s.sponsor_weight} />
            ))}
          </div>
        </div>
      )}

      {/* Sin foto */}
      <GapList title="Negocios sin foto" places={noImage} total={noImage.length} />
      {/* Sin descripción */}
      <div className="mt-6">
        <GapList title="Negocios sin descripción" places={noDesc} total={noDesc.length} />
      </div>
    </div>
  )
}

type P = { id: string; name: string; category: string; sponsor_weight: number }

function GapList({ title, places, total }: { title: string; places: P[]; total: number }) {
  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
      <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
        {title} ({total}) — toca pa&apos; editar
      </h2>
      <div className="max-h-[400px] overflow-y-auto space-y-1">
        {places.slice(0, 50).map((p) => (
          <EditRow key={p.id} id={p.id} name={p.name} category={p.category} weight={p.sponsor_weight} />
        ))}
        {total > 50 && <div className="text-xs text-[#64748b] pt-2">... y {total - 50} más</div>}
      </div>
    </div>
  )
}

function EditRow({ id, name, category, weight }: { id: string; name: string; category: string; weight: number }) {
  return (
    <Link href={`/admin/editar/${id}`} className="flex items-center gap-3 text-sm py-1.5 px-2 -mx-2 rounded-md border-b border-[#334155] hover:bg-[#334155]/40 transition-colors">
      <span className="text-[#64748b] w-24 shrink-0 truncate">{category}</span>
      <span className="font-medium flex-1 truncate">{name}</span>
      {weight > 0 && <span className="text-[#fbbf24] text-xs shrink-0">★{weight}</span>}
      <span className="text-[#38bdf8] text-xs shrink-0">editar →</span>
    </Link>
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
