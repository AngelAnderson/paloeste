'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/dinero', label: 'Dashboard' },
  { href: '/admin/revenue', label: 'Revenue Detail' },
]

export default function DineroLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Dinero</h1>
        <p className="text-[#64748b] text-sm">Revenue, MRR, Stripe</p>
      </div>

      <div className="flex gap-1 mb-6 bg-[#1e293b] rounded-lg p-1 w-fit overflow-x-auto">
        {TABS.map(t => {
          const active = t.href === '/admin/dinero'
            ? pathname === '/admin/dinero'
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
