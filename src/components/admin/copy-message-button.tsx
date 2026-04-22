'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyMessageButton({
  template,
  variables,
  label = 'Copiar mensaje',
}: {
  template: string
  variables: Record<string, string | number>
  label?: string
}) {
  const [copied, setCopied] = useState(false)

  const message = Object.entries(variables).reduce(
    (msg, [key, val]) => msg.replaceAll(`{${key}}`, String(val)),
    template
  )

  async function handleCopy() {
    await navigator.clipboard.writeText(message)
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
          <Copy size={14} className="text-[#94a3b8]" />
          <span className="text-[#94a3b8]">{label}</span>
        </>
      )}
    </button>
  )
}
