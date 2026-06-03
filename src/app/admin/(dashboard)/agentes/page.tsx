import Link from 'next/link'
import { getCarteraAllAgentsRoster, type CarteraAgentRosterRow, type CarteraAutonomyLevel } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

const AUTONOMY_META: Record<CarteraAutonomyLevel, { label: string; color: string; emoji: string }> = {
  draft_only:                 { label: 'Draft only',    color: '#fbbf24', emoji: '✍️' },
  autonomous_within_playbook: { label: 'Autonomous',    color: '#4ade80', emoji: '🤖' },
  restricted:                 { label: 'Restricted',    color: '#f87171', emoji: '🔒' },
}

// ── Shifts ────────────────────────────────────────────────────────────────
type ShiftKey = 'continuous' | 'day' | 'swing' | 'night' | 'ondemand'

const SHIFT_META: Record<ShiftKey, { label: string; window: string; emoji: string; accent: string; blurb: string }> = {
  continuous: { label: 'Siempre corriendo', window: '24/7', emoji: '🔁', accent: '#38bdf8', blurb: 'No duerme. Vigilancia continua cada pocos minutos.' },
  day:        { label: 'Day Shift',   window: '6am–2pm AT',  emoji: '🌅', accent: '#fbbf24', blurb: 'El turno de la mañana: salud del sistema → briefing → pitches → contenido. Casi todo el equipo clockea aquí.' },
  swing:      { label: 'Swing Shift', window: '2pm–10pm AT', emoji: '🌆', accent: '#fb923c', blurb: 'Tarde/noche: follow-ups, listas, prep del Live de las 8:30.' },
  night:      { label: 'Mid / Night Shift', window: '10pm–6am AT', emoji: '🌙', accent: '#a78bfa', blurb: 'Madrugada: limpieza, compilación, trabajo pesado mientras duermes.' },
  ondemand:   { label: 'On-demand', window: 'sin horario fijo', emoji: '⚡', accent: '#64748b', blurb: 'Corren cuando los invocas, no por reloj.' },
}

const SHIFT_ORDER: ShiftKey[] = ['continuous', 'day', 'swing', 'night', 'ondemand']
const DOW = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

/** Parse a cron schedule (UTC) → shift + human-readable AT time + sort key. */
function parseSchedule(schedule: string | null): { shift: ShiftKey; when: string; sortKey: number } {
  if (!schedule) return { shift: 'ondemand', when: 'on-demand', sortKey: 9999 }
  const parts = schedule.trim().split(/\s+/)
  const [min, hour, , , dow] = parts
  // Sub-hourly or hourly = continuous watcher
  if (min.includes('/') || hour === '*' || hour.includes('/')) {
    const everyMin = min.replace('*/', '')
    return { shift: 'continuous', when: min.includes('/') ? `cada ${everyMin} min` : 'cada hora', sortKey: 0 }
  }
  const hUTC = parseInt(hour, 10)
  const m = parseInt(min, 10) || 0
  if (isNaN(hUTC)) return { shift: 'ondemand', when: schedule, sortKey: 9999 }
  const hAT = (hUTC - 4 + 24) % 24
  const hh = String(hAT).padStart(2, '0')
  const mm = String(m).padStart(2, '0')
  const dayLabel = dow && dow !== '*' ? `${DOW[parseInt(dow, 10)] || dow} ` : ''
  const when = `${dayLabel}${hh}:${mm} AT`
  let shift: ShiftKey
  if (hAT >= 6 && hAT < 14) shift = 'day'
  else if (hAT >= 14 && hAT < 22) shift = 'swing'
  else shift = 'night'
  return { shift, when, sortKey: hAT * 60 + m }
}

function formatRelative(iso: string | null): string {
  if (!iso) return 'sin runs'
  const diff = Date.now() - new Date(iso).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `hace ${min}m`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `hace ${hr}h`
  const days = Math.floor(hr / 24)
  return `hace ${days}d`
}

function statusColor(status: string | null): string {
  if (!status) return '#64748b'
  if (status === 'success' || status === 'sent') return '#4ade80'
  if (status === 'awaiting_review' || status === 'partial') return '#fbbf24'
  if (status === 'failed' || status === 'rejected') return '#f87171'
  return '#64748b'
}

type EnrichedAgent = CarteraAgentRosterRow & { _shift: ShiftKey; _when: string; _sortKey: number }

export default async function AgentesRosterPage() {
  const rosterRaw = await getCarteraAllAgentsRoster().catch(() => [] as CarteraAgentRosterRow[])
  const roster: EnrichedAgent[] = rosterRaw.map((a) => {
    const p = parseSchedule(a.schedule)
    return { ...a, _shift: p.shift, _when: p.when, _sortKey: p.sortKey }
  })

  const totalAgents = roster.length
  const totalRuns30d = roster.reduce((s, r) => s + r.runs_30d, 0)
  const draftOnlyCount = roster.filter((r) => r.autonomy_level === 'draft_only').length

  // Group by shift
  const byShift = new Map<ShiftKey, EnrichedAgent[]>()
  for (const a of roster) {
    const list = byShift.get(a._shift) || []
    list.push(a)
    byShift.set(a._shift, list)
  }
  for (const list of byShift.values()) list.sort((a, b) => a._sortKey - b._sortKey)

  const coverage = SHIFT_ORDER.map((k) => ({ k, n: byShift.get(k)?.length || 0 }))
  const nightEmpty = (byShift.get('night')?.length || 0) === 0

  return (
    <div className="max-w-5xl">
      <h1 className="text-2xl font-bold mb-1">👥 Tu equipo invisible</h1>
      <p className="text-[#64748b] text-sm mb-5">
        {totalAgents} agents · {draftOnlyCount} en draft-only · {totalRuns30d.toLocaleString()} runs (30d) · organizados por turno
      </p>

      {/* Shift coverage strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
        {coverage.map(({ k, n }) => {
          const m = SHIFT_META[k]
          return (
            <div key={k} className="bg-[#1e293b] rounded-xl border border-[#334155] p-3">
              <div className="text-[10px] text-[#64748b] uppercase tracking-wider truncate">{m.emoji} {m.label}</div>
              <div className="text-xl font-bold mt-0.5" style={{ color: n > 0 ? m.accent : '#475569' }}>{n}</div>
              <div className="text-[10px] text-[#64748b]">{m.window}</div>
            </div>
          )
        })}
      </div>

      {/* Reality check banner */}
      {nightEmpty && (
        <div className="bg-[#a78bfa]/10 border border-[#a78bfa]/30 rounded-xl px-4 py-3 mb-6 text-sm text-[#cbd5e1]">
          🌙 <b className="text-[#a78bfa]">Night shift vacío.</b> Casi todo el equipo clockea de mañana (6–10am AT) porque tú lees todo en el desayuno.
          Si quieres trabajo pesado corriendo mientras duermes (compilar, limpiar, pre-draftear), hay que mover o crear agents en la madrugada.
        </div>
      )}

      {/* Cost note — now instrumented for the LLM agents */}
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 mb-6 text-xs text-[#64748b]">
        💸 Costo: instrumentado en los agents con LLM — <span className="text-[#94a3b8]">Kelo</span> (gpt-4o) y <span className="text-[#94a3b8]">Besi</span> (gpt-4o-mini + tts-1-hd)
        ahora loggean <code className="text-[#475569]">cost_usd</code> + tokens en cada run (aparece tras el próximo run programado). Los demás 14 no usan LLM —
        su costo real es infra (Twilio/Supabase), ≈ $0.
      </div>

      {/* Shifts */}
      {SHIFT_ORDER.map((shiftKey) => {
        const list = byShift.get(shiftKey)
        if (!list || list.length === 0) return null
        const m = SHIFT_META[shiftKey]
        return (
          <section key={shiftKey} className="mb-7">
            <div className="flex items-baseline gap-2 mb-1">
              <span>{m.emoji}</span>
              <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: m.accent }}>{m.label}</h2>
              <span className="text-xs text-[#64748b]">{m.window}</span>
              <span className="text-xs text-[#475569] ml-auto">{list.length} agent{list.length === 1 ? '' : 's'}</span>
            </div>
            <p className="text-xs text-[#64748b] mb-3">{m.blurb}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((agent, idx) => {
                const auton = AUTONOMY_META[agent.autonomy_level] || AUTONOMY_META.draft_only
                const lastColor = statusColor(agent.last_run_status)
                const isDraft = agent.autonomy_level === 'draft_only'
                const successPct = (Number(agent.success_rate || 0) * 100).toFixed(0)
                return (
                  <Link
                    key={agent.agent_id}
                    href={`/admin/agentes/${encodeURIComponent(agent.agent_id)}`}
                    className="bg-[#1e293b] rounded-xl border border-[#334155] hover:border-[#475569] p-4 transition-colors block"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-white truncate">👤 {agent.persona_name}</div>
                        <div className="text-xs text-[#94a3b8] truncate">{agent.persona_title}</div>
                      </div>
                      <span
                        className="text-[9px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: `${auton.color}1a`, color: auton.color }}
                      >
                        {auton.emoji}
                      </span>
                    </div>

                    {/* When it clocks in (run order) */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-[10px] font-bold text-[#475569]">#{idx + 1}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: `${m.accent}1a`, color: m.accent }}>
                        🕐 {agent._when}
                      </span>
                      <span className="text-[10px] text-[#64748b] truncate">{agent.tenant_display_name}</span>
                    </div>

                    <div className="text-xs text-[#94a3b8] line-clamp-2 min-h-[2rem] mb-3">{agent.mission}</div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-[#334155]">
                      <div>
                        <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Runs 30d</div>
                        <div className="text-[#38bdf8] font-semibold">{agent.runs_30d}</div>
                      </div>
                      <div>
                        <div className="text-[#64748b] uppercase tracking-wider text-[9px]">{isDraft ? 'Modo' : 'Success'}</div>
                        <div className="font-semibold" style={{ color: isDraft ? '#fbbf24' : '#4ade80' }}>
                          {isDraft ? '✍️ draft' : agent.runs_30d > 0 ? `${successPct}%` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[#64748b] uppercase tracking-wider text-[9px]">Last</div>
                        <div style={{ color: lastColor }} className="text-[10px]">{formatRelative(agent.last_run_at)}</div>
                      </div>
                    </div>

                    {agent.pending_decisions > 0 && (
                      <div className="mt-2 pt-2 border-t border-[#334155]">
                        <span className="text-[10px] font-semibold text-[#f87171]">
                          ⏳ {agent.pending_decisions} draft{agent.pending_decisions === 1 ? '' : 's'} esperando review
                        </span>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}

      {roster.length === 0 && (
        <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-8 text-center">
          <p className="text-[#64748b] text-sm">No hay agents registrados.</p>
        </div>
      )}
    </div>
  )
}
