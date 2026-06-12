'use client'

import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0f766e] text-white hover:bg-[#0d9488] transition-colors cursor-pointer"
    >
      <Printer size={13} />
      Imprimir / Guardar PDF
    </button>
  )
}
