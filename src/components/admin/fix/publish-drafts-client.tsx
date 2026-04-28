'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function PublishDraftsClient({ totalCount }: { totalCount: number }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processed, setProcessed] = useState(0)
  const [confirming, setConfirming] = useState(false)

  async function runFix() {
    setRunning(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/fix/publish-drafts', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setError(data.error || 'Fix failed')
        return
      }
      setProcessed(data.processed || 0)
      setDone(true)
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado')
    } finally {
      setRunning(false)
    }
  }

  if (done) {
    return (
      <div className="bg-[#022c22] border border-[#16a34a] rounded p-3 text-[#4ade80] text-sm">
        ✓ {processed} negocios publicados. Ahora visibles en el directorio + bot.
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[#7f1d1d] border border-[#dc2626] rounded p-3 text-[#f87171] text-sm">
        Error: {error}
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="space-y-2">
        <div className="bg-[#78350f] border border-[#f59e0b] rounded p-3 text-[#fbbf24] text-sm">
          Confirmar: voy a poner {totalCount} negocios como{' '}
          <code className="text-white">visibility=published</code>. ¿Continuar?
        </div>
        <div className="flex gap-2">
          <button
            onClick={runFix}
            disabled={running}
            className="flex-1 px-4 py-2 rounded-lg bg-[#dc2626] hover:bg-[#b91c1c] text-white font-bold text-sm cursor-pointer disabled:opacity-50"
          >
            {running ? 'Publicando…' : `Sí, publicar ${totalCount} →`}
          </button>
          <button
            onClick={() => setConfirming(false)}
            disabled={running}
            className="px-4 py-2 rounded-lg bg-[#334155] hover:bg-[#475569] text-white text-sm cursor-pointer"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="w-full px-4 py-3 rounded-lg bg-[#D4321E] hover:bg-[#b8281a] text-white font-bold text-sm cursor-pointer transition-colors"
    >
      Publicar todos los {totalCount} →
    </button>
  )
}
