'use client'

import { useState } from 'react'

interface Query {
  query: string
  count: number
}

export function QueryActions({ queries }: { queries: Query[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
      {queries.map((q, i) => (
        <div key={i} className="border-b border-[#334155]">
          <button
            onClick={() => setExpanded(expanded === q.query ? null : q.query)}
            className="flex items-center justify-between text-sm py-2 w-full text-left hover:bg-[#334155]/30 px-2 rounded transition-colors"
          >
            <span className="text-[#e2e8f0] truncate">{q.query}</span>
            <div className="flex items-center gap-2 shrink-0 ml-2">
              <span className="text-[#38bdf8] font-semibold">{q.count}</span>
              <span className="text-[#64748b] text-xs">{expanded === q.query ? '▲' : '▼'}</span>
            </div>
          </button>
          {expanded === q.query && (
            <div className="px-2 pb-3 flex flex-wrap gap-2">
              <a
                href={`sms:7874177711?body=${encodeURIComponent(q.query)}`}
                className="inline-flex items-center gap-1 text-xs bg-[#38bdf8]/10 text-[#38bdf8] px-3 py-1.5 rounded-full hover:bg-[#38bdf8]/20 transition-colors"
              >
                📱 Test in bot
              </a>
              <a
                href={`https://caborojo.com/?s=${encodeURIComponent(q.query)}`}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-1 text-xs bg-[#4ade80]/10 text-[#4ade80] px-3 py-1.5 rounded-full hover:bg-[#4ade80]/20 transition-colors"
              >
                🔍 Search site
              </a>
              <button
                onClick={() => {
                  const text = `La gente de Cabo Rojo está buscando "${q.query}" — ${q.count} veces esta semana.\n\n¿Conoces un buen lugar? Textea al 787-417-7711 y El Veci te ayuda.\n\n#CaboRojo`
                  navigator.clipboard.writeText(text)
                  alert('FB post draft copied!')
                }}
                className="inline-flex items-center gap-1 text-xs bg-[#a78bfa]/10 text-[#a78bfa] px-3 py-1.5 rounded-full hover:bg-[#a78bfa]/20 transition-colors"
              >
                📋 Copy FB post
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
