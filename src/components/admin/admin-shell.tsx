'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { AdminBadges } from '@/lib/admin-badges'

const NAV = [
  { href: '/admin/hoy', label: 'HOY', icon: '\uD83D\uDD25' },
  { href: '/admin/revenue', label: 'Command Center', icon: '\u26A1' },
  { href: '/admin/cartera', label: 'La Cartera', icon: '\uD83C\uDFE2' },
  { href: '/admin/agentes', label: 'Agentes', icon: '\uD83D\uDC65' },
  { href: '/admin/decisiones', label: 'Decisiones', icon: '\uD83D\uDCE5' },
  { href: '/admin/inbox', label: 'Inbox', icon: '\uD83D\uDCAC' },
  { href: '/admin/contactos', label: 'Contactos', icon: '\u2764\uFE0F' },
  { href: '/admin/pipeline', label: 'Pipeline', icon: '\uD83C\uDFAF' },
  { href: '/admin/campanas', label: 'Campa\u00F1as', icon: '\uD83C\uDFAC' },
  { href: '/admin/dinero', label: 'Dinero', icon: '\uD83D\uDCB0' },
  { href: '/admin/bot', label: 'Bot Health', icon: '\uD83E\uDD16' },
  { href: '/admin/directorio', label: 'Directorio', icon: '\uD83D\uDCCD' },
  { href: '/admin/tareas', label: 'Tareas', icon: '\u2705' },
  { href: '/admin/edits', label: 'Edits', icon: '\uD83D\uDEE0\uFE0F' },
  { href: '/admin/submissions', label: 'Submissions', icon: '\uD83D\uDCE8' },
  { href: '/admin/content', label: 'Contenido', icon: '\uD83D\uDCDD' },
  { href: '/admin/docs', label: 'Docs', icon: '\uD83D\uDCDA' },
  { href: '/admin/tablero', label: 'Tableros', icon: '\uD83D\uDEF0\uFE0F' },
]

// 6 grupos (panel cockpit): organiza las 18 secciones por trabajo, no por dato.
const GROUPS: Record<string, string> = {
  '/admin/hoy': 'HOY',
  '/admin/revenue': 'DINERO', '/admin/dinero': 'DINERO', '/admin/pipeline': 'DINERO', '/admin/campanas': 'DINERO', '/admin/tablero': 'DINERO',
  '/admin/decisiones': 'APROBACIONES', '/admin/inbox': 'APROBACIONES', '/admin/agentes': 'APROBACIONES',
  '/admin/contactos': 'CONTACTOS', '/admin/cartera': 'CONTACTOS',
  '/admin/content': 'CONTENIDO', '/admin/submissions': 'CONTENIDO', '/admin/edits': 'CONTENIDO',
  '/admin/directorio': 'MANTENIMIENTO', '/admin/tareas': 'MANTENIMIENTO', '/admin/bot': 'MANTENIMIENTO', '/admin/docs': 'MANTENIMIENTO',
}
const GROUP_ORDER = ['HOY', 'DINERO', 'APROBACIONES', 'CONTACTOS', 'CONTENIDO', 'MANTENIMIENTO']

export function AdminShell({ children, badges = {} }: { children: React.ReactNode; badges?: AdminBadges }) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
    router.refresh()
  }

  const sidebar = (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-[#334155]">
        <h2 className="text-lg font-bold text-white">PalOeste</h2>
        <p className="text-xs text-[#64748b]">Command Center</p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
        {GROUP_ORDER.map(group => (
        <div key={group}>
          {group !== 'HOY' && (
            <p className="px-3 pt-4 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#475569]">{group}</p>
          )}
          {NAV.filter(i => (GROUPS[i.href] || 'MANTENIMIENTO') === group).map(item => {
          const active = pathname.startsWith(item.href)
          const count = badges[item.href] || 0
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-[#38bdf8]/10 text-[#38bdf8]'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#1e293b]'
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span className="flex-1">{item.label}</span>
              {count > 0 && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                    active ? 'bg-[#38bdf8] text-[#0f172a]' : 'bg-[#f87171] text-white'
                  }`}
                  aria-label={`${count} pendientes`}
                >
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          )
        })}
        </div>
        ))}
      </nav>
      <div className="p-3 border-t border-[#334155]">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-[#64748b] hover:text-[#f87171] hover:bg-[#1e293b] transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0f172a] text-[#f1f5f9]">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-[#0f172a] border-b border-[#334155] px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-white p-1">
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
        </button>
        <span className="text-sm font-semibold">Command Center</span>
        <div className="w-8" />
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-[#0f172a] border-r border-[#334155]">
            {sidebar}
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-56 lg:flex-col bg-[#0f172a] border-r border-[#334155]">
        {sidebar}
      </div>

      {/* Main content */}
      <main className="lg:pl-56 pt-14 lg:pt-0">
        <div className="max-w-[1400px] mx-auto p-4 lg:p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
