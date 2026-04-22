'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface LeadRow {
  date: string
  channel: string
  amount_cents: number
}

export function LeadDetail({
  leadCount,
  totalCents,
  leads,
}: {
  leadCount: number
  totalCents: number
  leads: LeadRow[]
}) {
  const [open, setOpen] = useState(false)
  const avg = leadCount > 0 ? totalCents / leadCount : 0

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[#38bdf8] text-xs hover:underline cursor-pointer"
      >
        {leadCount} leads · ${(totalCents / 100).toFixed(0)}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && (
        <div className="mt-2 bg-[#0f172a] rounded-lg p-3 text-xs space-y-2">
          <div className="text-[#94a3b8]">
            {leadCount} leads × ${(avg / 100).toFixed(2)} = <span className="text-white font-bold">${(totalCents / 100).toFixed(0)}</span>
          </div>
          {leads.length > 0 && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {leads.slice(0, 20).map((l, i) => {
                const d = new Date(l.date)
                const ago = Math.floor((Date.now() - d.getTime()) / 86400000)
                return (
                  <div key={i} className="flex justify-between text-[#64748b]">
                    <span>{d.toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })} ({ago}d)</span>
                    <span>{l.channel}</span>
                    <span>${(l.amount_cents / 100).toFixed(2)}</span>
                  </div>
                )
              })}
            </div>
          )}
          {leads.length > 0 && (
            <div className="text-[#64748b]">
              Último lead: hace {Math.floor((Date.now() - new Date(leads[0].date).getTime()) / 86400000)} días
            </div>
          )}
        </div>
      )}
    </div>
  )
}
