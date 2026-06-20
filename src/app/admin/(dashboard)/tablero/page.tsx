import Link from 'next/link'
import { getAllDashboards } from '@/lib/dashboards'

export const dynamic = 'force-dynamic'

export default function TableroIndex() {
  const dashes = getAllDashboards()
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">🛰️ Tableros</h1>
        <p className="text-[#94a3b8] text-sm">Tus dashboards, detrás de tu login. Ábrelos desde el teléfono.</p>
      </div>
      <div className="grid gap-3">
        {dashes.map(d => (
          <Link
            key={d.slug}
            href={`/admin/tablero/${d.slug}`}
            className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 hover:border-[#38bdf8] flex items-center gap-3"
          >
            <span className="text-3xl">{d.emoji}</span>
            <span className="text-white font-semibold">{d.title}</span>
          </Link>
        ))}
        {dashes.length === 0 && (
          <p className="text-[#64748b] text-sm">No hay tableros todavía.</p>
        )}
      </div>
    </div>
  )
}
