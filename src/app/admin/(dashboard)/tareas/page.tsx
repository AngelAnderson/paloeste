import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { applyVerified } from './actions'
import Refresher from './Refresher'

export const dynamic = 'force-dynamic'

type Row = {
  task_type: string
  place_name: string
  status: string
  result: Record<string, unknown>
  note: string | null
  updated_at: string
}

const META: Record<string, { label: string; emoji: string }> = {
  health_verify: { label: 'Verificación de Salud', emoji: '🩺' },
  pharmacy_audit: { label: 'Auditoría de Farmacias', emoji: '💊' },
}

export default async function TareasAdminPage() {
  const sb = await createSupabaseAdminClient()
  const { data } = await sb
    .from('noelia_tasks')
    .select('task_type,place_name,status,result,note,updated_at')
    .order('updated_at', { ascending: false })
  const rows = (data ?? []) as Row[]

  const noeToken = process.env.TAREAS_NOELIA_TOKEN || ''
  const types = ['health_verify', 'pharmacy_audit']
  const doneTotal = rows.filter((r) => r.status === 'done').length
  const applicable = rows.filter(
    (r) => r.status === 'done' && (r.task_type === 'pharmacy_audit' || (r.result as Record<string, unknown>)?.ok === true)
  ).length

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto">
      <Refresher seconds={20} />
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-xl font-bold text-zinc-900">✅ Tareas de Noelia</h1>
        <span className="text-xs text-zinc-400">en vivo · refresca cada 20s</span>
      </div>
      <p className="text-sm text-zinc-500 mb-5">
        Verificación colaborativa. Noelia trabaja desde su link; aquí ves el progreso y aplicas los verificados al
        directorio.
      </p>

      {/* Apply bar */}
      <div className="flex flex-wrap items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-3 mb-6">
        <div className="text-sm text-teal-900 flex-1">
          <b>{doneTotal}</b> completados · <b>{applicable}</b> listos para marcar verificados en el directorio
        </div>
        <form action={applyVerified}>
          <button
            type="submit"
            disabled={applicable === 0}
            className="bg-teal-600 disabled:opacity-40 text-white text-sm font-bold px-4 py-2 rounded-lg"
          >
            Aplicar {applicable} al directorio
          </button>
        </form>
      </div>

      {types.map((type) => {
        const meta = META[type]
        const all = rows.filter((r) => r.task_type === type)
        const done = all.filter((r) => r.status === 'done')
        const pct = all.length ? Math.round((done.length / all.length) * 100) : 0
        const noeLink = `/tareas?task=${type}&token=${noeToken}`
        return (
          <section key={type} className="mb-7">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-zinc-800">
                {meta.emoji} {meta.label}
              </h2>
              <a href={noeLink} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-700 underline">
                Abrir vista de Noelia ↗
              </a>
            </div>
            <div className="h-2 bg-zinc-200 rounded-full overflow-hidden mb-1">
              <div className="h-full bg-teal-500" style={{ width: pct + '%' }} />
            </div>
            <div className="text-xs text-zinc-500 mb-3">
              {done.length} de {all.length} completados
            </div>

            {done.length === 0 && <div className="text-sm text-zinc-400 italic">Todavía nada completado.</div>}
            <div className="space-y-2">
              {done.map((r, i) => {
                const res = r.result || {}
                const isFix = type === 'health_verify' && res.ok === false
                return (
                  <div
                    key={i}
                    className={`rounded-lg border p-2.5 text-sm ${
                      isFix ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50/50'
                    }`}
                  >
                    <div className="font-semibold text-zinc-800">{r.place_name}</div>
                    {type === 'health_verify' ? (
                      isFix ? (
                        <div className="text-amber-700 text-xs mt-0.5">✏️ {(res.fix as string) || r.note}</div>
                      ) : (
                        <div className="text-emerald-700 text-xs mt-0.5">✅ datos OK</div>
                      )
                    ) : (
                      <div className="text-zinc-600 text-xs mt-0.5">
                        {`Abierta: ${res.abierta || '—'} · Delivery: ${res.delivery || '—'} · Vacunas: ${
                          res.vacunas || '—'
                        } · Horario: ${res.horario || '—'} · Planes: ${res.planes || '—'}`}
                        {r.note ? ` · 📝 ${r.note}` : ''}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
