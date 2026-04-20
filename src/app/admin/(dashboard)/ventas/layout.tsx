'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/ventas', label: 'Dashboard' },
  { href: '/admin/ventas/sponsors', label: 'Sponsors' },
  { href: '/admin/ventas/pipeline', label: 'Pipeline' },
  { href: '/admin/ventas/vitrina', label: 'Vitrina' },
  { href: '/admin/ventas/demand', label: 'Demand' },
]

export default function VentasLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Ventas</h1>
        <p className="text-[#64748b] text-sm">Revenue, sponsors, pipeline, demand signals</p>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 mb-6 bg-[#1e293b] rounded-lg p-1 w-fit overflow-x-auto">
        {TABS.map(t => {
          const active = t.href === '/admin/ventas'
            ? pathname === '/admin/ventas'
            : pathname.startsWith(t.href)
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                active ? 'bg-[#38bdf8]/10 text-[#38bdf8]' : 'text-[#94a3b8] hover:text-white'
              }`}
            >
              {t.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
