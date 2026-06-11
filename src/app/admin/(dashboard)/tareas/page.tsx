import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { applyVerified } from './actions'
import Refresher from './Refresher'
import { CopyNudgeButton } from './copy-nudge'

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
  const pendingTotal = rows.length - doneTotal
  const applicable = rows.filter(
    (r) => r.status === 'done' && (r.task_type === 'pharmacy_audit' || (r.result as Record<string, unknown>)?.ok === true)
  ).length

  // Last activity → is Noelia active this week?
  const lastDone = rows.filter(r => r.status === 'done').map(r => r.updated_at).sort().pop()
  const daysSinceActivity = lastDone ? Math.floor((Date.now() - new Date(lastDone).getTime()) / 86400000) : null

  const nudgeMessage = `Noelia 💛 te quedan ${pendingTotal} verificaciones pendientes en tu lista (${rows.filter(r => r.task_type === 'health_verify' && r.status !== 'done').length} de salud + ${rows.filter(r => r.task_type === 'pharmacy_audit' && r.status !== 'done').length} de farmacias). Cuando tengas 15 minutos: https://www.paloeste.com/tareas?token=${noeToken}`

  return (
    <div className="max-w-3xl">
      <Refresher seconds={20} />
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-xl font-bold text-white">✅ Tareas de Noelia</h1>
        <span className="text-xs text-[#64748b]">en vivo · refresca cada 20s</span>
      </div>
      <p className="text-sm text-[#64748b] mb-5">
        Verificación colaborativa. Noelia trabaja desde su link; aquí ves el progreso y aplicas los verificados al directorio.
      </p>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-3">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Completados</div>
          <div className="text-xl font-bold text-[#4ade80] tabular-nums">{doneTotal}</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-3">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Pendientes</div>
          <div className="text-xl font-bold text-[#fbbf24] tabular-nums">{pendingTotal}</div>
        </div>
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-3">
          <div className="text-[10px] text-[#64748b] uppercase tracking-wider">Última actividad</div>
          <div className={`text-xl font-bold tabular-nums ${daysSinceActivity != null && daysSinceActivity > 7 ? 'text-[#f87171]' : 'text-white'}`}>
            {daysSinceActivity == null ? '—' : daysSinceActivity === 0 ? 'hoy' : `${daysSinceActivity}d`}
          </div>
        </div>
      </div>

      {/* Nudge para Noelia — mensaje listo, copiar y pegar en WhatsApp */}
      {pendingTotal > 0 && (
        <div className="flex flex-wrap items-center gap-3 bg-[#a78bfa]/10 border border-[#a78bfa]/30 rounded-xl p-3 mb-3">
          <div className="text-sm text-[#cbd5e1] flex-1 min-w-[200px]">
            💜 Mensaje listo pa&apos; Noelia con su link y lo que le queda
            {daysSinceActivity != null && daysSinceActivity > 7 && (
              <span className="text-[#f87171]"> · sin actividad hace {daysSinceActivity}d</span>
            )}
          </div>
          <CopyNudgeButton message={nudgeMessage} />
        </div>
      )}

      {/* Apply bar */}
      <div className="flex flex-wrap items-center gap-3 bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-xl p-3 mb-6">
        <div className="text-sm text-[#cbd5e1] flex-1">
          <b className="text-white">{doneTotal}</b> completados · <b className="text-white">{applicable}</b> listos para marcar verificados en el directorio
        </div>
        <form action={applyVerified}>
          <button
            type="submit"
            disabled={applicable === 0}
            className="bg-[#38bdf8] disabled:opacity-40 text-[#0f172a] text-sm font-bold px-4 py-2 rounded-lg hover:bg-[#7dd3fc] transition-colors cursor-pointer"
          >
            Aplicar {applicable} al directorio
          </button>
        </form>
      </div>

      {types.map((type) => {
        const meta = META[type]
        const all = rows.filter((r) => r.task_type === type)
        const done = all.filter((r) => r.status === 'done')
        const pending = all.filter((r) => r.status !== 'done')
        const pct = all.length ? Math.round((done.length / all.length) * 100) : 0
        const noeLink = `/tareas?task=${type}&token=${noeToken}`
        return (
          <section key={type} className="mb-7">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-bold text-white">
                {meta.emoji} {meta.label}
              </h2>
              <a href={noeLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[#38bdf8] underline">
                Abrir vista de Noelia ↗
              </a>
            </div>
            <div className="h-2 bg-[#334155] rounded-full overflow-hidden mb-1">
              <div className="h-full bg-[#38bdf8]" style={{ width: pct + '%' }} />
            </div>
            <div className="text-xs text-[#64748b] mb-3">
              {done.length} de {all.length} completados · {pending.length} pendientes
            </div>

            {pending.length > 0 && (
              <details className="mb-3">
                <summary className="text-xs text-[#fbbf24] cursor-pointer select-none">
                  ⏳ próximos {Math.min(pending.length, 8)} en la lista
                </summary>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {pending.slice(0, 8).map((r, i) => (
                    <span key={i} className="text-xs bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-1 text-[#94a3b8]">{r.place_name}</span>
                  ))}
                  {pending.length > 8 && <span className="text-xs text-[#64748b] py-1">+{pending.length - 8} más</span>}
                </div>
              </details>
            )}

            {done.length === 0 && <div className="text-sm text-[#475569] italic">Todavía nada completado.</div>}
            <div className="space-y-2">
              {done.map((r, i) => {
                const res = r.result || {}
                const isFix = type === 'health_verify' && res.ok === false
                return (
                  <div
                    key={i}
                    className={`rounded-lg border p-2.5 text-sm ${
                      isFix ? 'border-[#fbbf24]/40 bg-[#fbbf24]/5' : 'border-[#4ade80]/30 bg-[#4ade80]/5'
                    }`}
                  >
                    <div className="font-semibold text-white">{r.place_name}</div>
                    {type === 'health_verify' ? (
                      isFix ? (
                        <div className="text-[#fbbf24] text-xs mt-0.5">✏️ {(res.fix as string) || r.note}</div>
                      ) : (
                        <div className="text-[#4ade80] text-xs mt-0.5">✅ datos OK</div>
                      )
                    ) : (
                      <div className="text-[#94a3b8] text-xs mt-0.5">
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
