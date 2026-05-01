import type { NightlyAgentRun } from '@/lib/admin-queries'

const FRIENDLY_NAMES: Record<string, string> = {
  'mañana-completa-daily': '🌅 Mañana Completa',
  'admin-pulse-daily': '📊 Admin Pulse',
  'detect-inbound-lead-every-15min': '💬 Inbound Lead Detector',
  'family-nudge-daily': '❤️ Family Nudge',
  'dato-triage-monday': '🔍 DATO Triage',
  'weekly-incomplete-report': '📋 Weekly Report',
  'renewal-reminder-weekly': '🔔 Renewal Reminders',
  'que-hacer-hoy-daily': '✅ Qué Hacer Hoy',
  'kelo-newsletter-friday': '📰 Kelo Newsletter',
  'espejo-diario': '🪞 Espejo Diario',
  'auto-enrichment-nightly': '🌃 Auto Enrichment',
  'detect-recall': '💊 Recall Detector',
  'event-followup-daily': '🎉 Event Followup',
  'top50-monthly': '🏆 Top 50',
  'facu-monthly-report': '🧾 Facu Monthly',
  'vitrina-push-daily': '⭐ Vitrina Push',
}

const CURATED_PREFIXES = [
  'mañana-completa',
  'admin-pulse',
  'detect-inbound-lead',
  'family-nudge',
  'dato-triage',
  'weekly-incomplete',
  'renewal-reminder',
  'kelo-newsletter',
  'que-hacer-hoy',
  'auto-enrichment',
  'top50-monthly',
  'facu-monthly',
  'vitrina-push',
  'event-followup',
]

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'ahora'
  if (min < 60) return `${min}m`
  const h = Math.round(min / 60)
  if (h < 48) return `${h}h`
  const d = Math.round(h / 24)
  return `${d}d`
}

function humanizeSchedule(cron: string): string {
  const map: Record<string, string> = {
    '0 11 * * *': 'Diario 7am AT',
    '0 14 * * *': 'Diario 10am AT',
    '0 13 * * *': 'Diario 9am AT',
    '0 12 * * *': 'Diario 8am AT',
    '0 10 * * *': 'Diario 6am AT',
    '*/15 * * * *': 'Cada 15min',
    '*/30 * * * *': 'Cada 30min',
    '*/5 * * * *': 'Cada 5min',
    '0 * * * *': 'Cada hora',
    '0 13 * * 1': 'Lunes 9am AT',
    '0 11 * * 1': 'Lunes 7am AT',
    '0 14 * * 6': 'Sábado 10am AT',
    '0 13 * * 5': 'Viernes 9am AT',
    '0 12 1 * *': 'Mensual día 1',
  }
  return map[cron] || cron
}

export function NightlyAgentsCard({ runs }: { runs: NightlyAgentRun[] }) {
  const curated = runs
    .filter(r => CURATED_PREFIXES.some(p => r.jobname.startsWith(p)))
    .slice(0, 8)

  if (curated.length === 0) return null

  const failingNow = curated.filter(r => r.last_status === 'failed' || r.failures_24h > 0)

  return (
    <section className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">🌙</span>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Agentes Ambientales</h2>
        {failingNow.length > 0 && (
          <span className="ml-auto text-xs text-[#f87171] font-medium">
            {failingNow.length} con fallos
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {curated.map((run) => {
          const failed = run.last_status === 'failed' || run.failures_24h > 0
          const color = failed ? '#f87171' : run.last_status === 'succeeded' ? '#4ade80' : '#fbbf24'
          const display = FRIENDLY_NAMES[run.jobname] || run.jobname

          return (
            <div
              key={run.jobid}
              className="flex items-center gap-2 p-2 rounded-lg bg-[#0f172a] border border-[#334155]"
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: color }}
                aria-label={run.last_status}
              />
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white truncate">{display}</div>
                <div className="text-[10px] text-[#64748b]">
                  {humanizeSchedule(run.schedule)} · hace {relativeTime(run.last_start)}
                  {run.failures_24h > 0 && (
                    <span className="text-[#f87171]"> · {run.failures_24h} fallo{run.failures_24h > 1 ? 's' : ''} 24h</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
