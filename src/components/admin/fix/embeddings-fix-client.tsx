'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type BatchResult = {
  ok: boolean
  processed?: number
  succeeded?: number
  remaining?: number
  results?: { name: string; status: string }[]
  error?: string
}

export function EmbeddingsFixClient({ totalCount }: { totalCount: number }) {
  const router = useRouter()
  const [running, setRunning] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalProcessed, setTotalProcessed] = useState(0)
  const [totalSucceeded, setTotalSucceeded] = useState(0)

  async function runBatches() {
    setRunning(true)
    setError(null)
    setDone(false)
    setLogs([])
    setTotalProcessed(0)
    setTotalSucceeded(0)

    let batch = 1
    let totalOK = 0
    let totalProc = 0

    while (true) {
      try {
        const res = await fetch('/api/admin/fix/embeddings', { method: 'POST' })
        const data: BatchResult = await res.json()
        if (!res.ok || !data.ok) {
          setError(data.error || 'Batch failed')
          break
        }
        const proc = data.processed || 0
        const ok = data.succeeded || 0
        const remaining = data.remaining || 0
        totalProc += proc
        totalOK += ok
        setTotalProcessed(totalProc)
        setTotalSucceeded(totalOK)
        const msg = `Lote ${batch}: ${ok}/${proc} OK · ${remaining} restantes`
        setLogs(prev => [...prev, msg])

        if (proc === 0 || remaining === 0) {
          setDone(true)
          break
        }
        batch++
        // Brief pause between batches to avoid rate limits
        await new Promise(r => setTimeout(r, 500))
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Error inesperado')
        break
      }
    }

    setRunning(false)
    // Refresh page data after done
    if (!error) router.refresh()
  }

  return (
    <div className="space-y-3">
      {!running && !done && (
        <button
          onClick={runBatches}
          className="w-full px-4 py-3 rounded-lg bg-[#D4321E] hover:bg-[#b8281a] text-white font-bold text-sm cursor-pointer transition-colors"
        >
          Generar embeddings ({totalCount}) →
        </button>
      )}

      {running && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="animate-pulse w-3 h-3 rounded-full bg-[#fbbf24]"></div>
            <span className="text-sm font-medium">Procesando…</span>
          </div>
          <div className="text-xs text-[#94a3b8]">
            {totalSucceeded}/{totalProcessed} embeddings generados · ~$
            {(totalProcessed * 0.0001).toFixed(4)} gastado
          </div>
        </div>
      )}

      {logs.length > 0 && (
        <div className="bg-[#0f172a] border border-[#334155] rounded p-3 max-h-40 overflow-y-auto font-mono text-xs space-y-1">
          {logs.map((log, i) => (
            <div key={i} className="text-[#94a3b8]">{log}</div>
          ))}
        </div>
      )}

      {done && (
        <div className="bg-[#022c22] border border-[#16a34a] rounded p-3 text-[#4ade80] text-sm">
          ✓ Listo. {totalSucceeded} embeddings generados ({totalProcessed - totalSucceeded} fallaron).
        </div>
      )}

      {error && (
        <div className="bg-[#7f1d1d] border border-[#dc2626] rounded p-3 text-[#f87171] text-sm">
          Error: {error}
        </div>
      )}
    </div>
  )
}
