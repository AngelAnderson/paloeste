'use client'

import { useState } from 'react'
import { Link, Check } from 'lucide-react'

export function CopyVitrinaLink({ slug, token }: { slug: string; token: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const url = `https://paloeste.com/vitrina/${slug}/reporte?token=${token}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#334155] hover:bg-[#475569] transition-colors cursor-pointer"
    >
      {copied ? (
        <>
          <Check size={14} className="text-[#4ade80]" />
          <span className="text-[#4ade80]">Copiado</span>
        </>
      ) : (
        <>
          <Link size={14} className="text-[#94a3b8]" />
          <span className="text-[#94a3b8]">Mandar reporte</span>
        </>
      )}
    </button>
  )
}
