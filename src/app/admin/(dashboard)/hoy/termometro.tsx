import Link from 'next/link'

export interface Termo {
  subs_nuevos_7d: number
  dms_respondidos_7d: number
  dms_cerrados_7d: number
  dinero_cerrado_7d: number
  silencios_7d: number
}

function AlarmCard({ title, sub, cta, href }: { title: string; sub: string; cta: string; href: string }) {
  return (
    <div className="rounded-xl border border-red-800 bg-red-950/40 p-4">
      <p className="text-red-200 font-bold text-sm">🚨 {title}</p>
      <p className="text-red-300/70 text-xs mt-1">{sub}</p>
      <Link
        href={href}
        className="inline-block mt-3 bg-red-600 hover:bg-red-500 text-white text-sm font-bold px-4 py-2 rounded-lg"
      >
        {cta} →
      </Link>
    </div>
  )
}

// El medidor de lo que SALE (las 2 alarmas que el admin no veía). Read-only,
// los datos vienen del RPC get_cockpit_termometro. Cuando suba a >0, las
// tarjetas rojas desaparecen solas.
export function Termometro({ t }: { t: Termo }) {
  const ganando = t.subs_nuevos_7d > 0 && t.dms_cerrados_7d > 0
  return (
    <div className="space-y-3 mb-6">
      <div
        className={
          'rounded-xl px-4 py-3 text-sm font-semibold border ' +
          (ganando
            ? 'bg-emerald-900/40 border-emerald-700 text-emerald-200'
            : 'bg-amber-900/30 border-amber-700 text-amber-200')
        }
      >
        Esta semana: <b>+{t.subs_nuevos_7d}</b> subs · <b>{t.dms_respondidos_7d}</b> respondidos ·{' '}
        <b>{t.dms_cerrados_7d}</b> cerrados · <b>${Math.round(t.dinero_cerrado_7d)}</b> cobrado
      </div>
      {(t.subs_nuevos_7d === 0 || t.dms_cerrados_7d === 0) && (
        <div className="grid gap-3 sm:grid-cols-2">
          {t.subs_nuevos_7d === 0 && (
            <AlarmCard
              title="0 suscriptores esta semana"
              sub="La lista propia no crece. El balde tiene hueco."
              cta="Poner captura en el próximo cívico"
              href="/admin/content"
            />
          )}
          {t.dms_cerrados_7d === 0 && (
            <AlarmCard
              title="0 ventas cerradas"
              sub="El dinero sin cerrar. Manda los recibos y marca el resultado."
              cta="Ir a Decisiones de Hoy"
              href="/admin/tablero/decisiones"
            />
          )}
        </div>
      )}
    </div>
  )
}
