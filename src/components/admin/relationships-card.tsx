'use client'

import Link from 'next/link'
import { Send, ChevronRight } from 'lucide-react'
import type { OverdueRelationship } from '@/lib/types'

const TYPE_COLOR: Record<string, string> = {
  inbound_lead: '#f87171',
  personal: '#fbbf24',
  prospect: '#a78bfa',
  client: '#4ade80',
  partner: '#38bdf8',
  cold: '#64748b',
}

export function RelationshipsCard({
  overdue,
  onMessage,
}: {
  overdue: OverdueRelationship[]
  onMessage: (rel: OverdueRelationship) => void
}) {
  const top = overdue.slice(0, 3)

  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">❤️</span>
          <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">Relaciones Overdue</h2>
        </div>
        <Link
          href="/admin/contactos"
          className="flex items-center gap-1 text-xs text-[#64748b] hover:text-[#38bdf8] transition-colors"
        >
          {overdue.length > 3 ? `${overdue.length - 3} más` : 'Ver'}
          <ChevronRight size={12} />
        </Link>
      </div>

      {top.length === 0 ? (
        <p className="text-[#64748b] text-sm py-2">Todo al día. 🎉</p>
      ) : (
        <div className="space-y-2">
          {top.map((rel) => {
            const color = TYPE_COLOR[rel.type] || '#64748b'
            return (
              <div
                key={rel.id}
                className="flex items-center gap-3 p-2 rounded-lg bg-[#0f172a] border border-[#334155]"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: color + '30', color }}
                    >
                      {rel.type.replace('_', ' ')}
                    </span>
                    <span className="font-semibold text-sm text-white truncate">{rel.name}</span>
                  </div>
                  <div className="text-xs text-[#64748b] flex items-center gap-2">
                    <span>{rel.days_since_contact}d sin contacto</span>
                    {rel.revenue_potential_cents != null && rel.revenue_potential_cents > 0 && (
                      <span className="text-[#4ade80]">
                        ${(rel.revenue_potential_cents / 100).toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
                {rel.contact_phone ? (
                  <button
                    onClick={() => onMessage(rel)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30 transition-colors cursor-pointer"
                  >
                    <Send size={11} />
                    Mensaje
                  </button>
                ) : (
                  <span className="text-[10px] text-[#475569] px-2">Sin tel</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
