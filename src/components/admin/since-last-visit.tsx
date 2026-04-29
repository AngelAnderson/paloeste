'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'

const STORAGE_KEY = 'admin:last_seen'
const MAX_DAYS = 14

interface DeltaResponse {
  leads: number
  inbound: number
  prospects: number
  events: number
  since: string
}

function formatRelative(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const hours = Math.round(ms / 3600000)
  if (hours < 1) return 'hace minutos'
  if (hours < 24) return `hace ${hours}h`
  const days = Math.round(hours / 24)
  return `hace ${days}d`
}

export function SinceLastVisit() {
  const [delta, setDelta] = useState<DeltaResponse | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const last = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null
    const now = new Date().toISOString()

    // Always update last_seen after 3s so this visit becomes the next baseline.
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, now)
      } catch {
        // ignore
      }
    }, 3000)

    if (last) {
      const lastMs = new Date(last).getTime()
      if (!isNaN(lastMs)) {
        const daysAgo = (Date.now() - lastMs) / 86400000
        if (daysAgo > 0.01 && daysAgo < MAX_DAYS) {
          fetch(`/api/admin/delta?since=${encodeURIComponent(last)}`, { cache: 'no-store' })
            .then(r => r.ok ? r.json() : null)
            .then((data: DeltaResponse | null) => {
              if (data) setDelta(data)
            })
            .catch(() => {})
        }
      }
    }

    return () => clearTimeout(timer)
  }, [])

  if (dismissed || !delta) return null

  const total = delta.leads + delta.inbound + delta.prospects + delta.events
  if (total === 0) return null

  const chips: { label: string; count: number; color: string; href: string }[] = [
    { label: 'inbounds', count: delta.inbound, color: '#38bdf8', href: '/admin/inbox' },
    { label: 'leads', count: delta.leads, color: '#4ade80', href: '/admin/dinero' },
    { label: 'prospects', count: delta.prospects, color: '#a78bfa', href: '/admin/pipeline' },
    { label: 'eventos', count: delta.events, color: '#fb923c', href: '/admin/content' },
  ].filter(c => c.count > 0)

  return (
    <div className="bg-[#1e293b] border border-[#38bdf8]/40 rounded-xl px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
      <span className="text-xs text-[#94a3b8]">
        Desde tu última visita ({formatRelative(delta.since)}):
      </span>
      <div className="flex items-center gap-2 flex-wrap flex-1">
        {chips.map(chip => (
          <Link
            key={chip.label}
            href={chip.href}
            className="text-xs font-medium px-2.5 py-1 rounded-full transition-opacity hover:opacity-80"
            style={{ backgroundColor: chip.color + '20', color: chip.color }}
          >
            {chip.count} {chip.label}
          </Link>
        ))}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-[#64748b] hover:text-white transition-colors"
        aria-label="Cerrar"
      >
        <X size={14} />
      </button>
    </div>
  )
}
