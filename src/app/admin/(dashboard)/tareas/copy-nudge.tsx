'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyNudgeButton({ message }: { message: string }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard.writeText(message)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <button
      onClick={copy}
      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#a78bfa] text-[#0f172a] hover:bg-[#c4b5fd] transition-colors cursor-pointer"
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copiado' : 'Copiar mensaje'}
    </button>
  )
}
