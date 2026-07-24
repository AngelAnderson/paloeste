'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

type DocMeta = { slug: string; title: string; order: number; emoji: string }

export function DocsList({ docs }: { docs: DocMeta[] }) {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase()
    if (!term) return docs
    return docs.filter((d) => d.title.toLowerCase().includes(term) || d.slug.toLowerCase().includes(term))
  }, [q, docs])

  return (
    <div className="space-y-3">
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={`Buscar entre ${docs.length} tutoriales...`}
        className="w-full bg-[#1e293b] border border-[#334155] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#64748b] focus:border-[#38bdf8] focus:outline-none"
      />

      {filtered.length === 0 ? (
        <p className="text-[#64748b] text-sm py-8 text-center">Ningún tutorial coincide con &quot;{q}&quot;.</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <Link
              key={doc.slug}
              href={`/admin/docs/${doc.slug}`}
              className="block bg-[#1e293b] border border-[#334155] rounded-xl p-4 hover:border-[#38bdf8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{doc.emoji}</span>
                <div className="min-w-0">
                  <p className="text-white font-medium text-sm truncate">{doc.title}</p>
                  <p className="text-[#64748b] text-xs mt-0.5">Tutorial {doc.order}</p>
                </div>
                <span className="ml-auto text-[#38bdf8] text-xs shrink-0">abrir →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
