'use client'

import { useState, useTransition } from 'react'
import { approveOpsItem, revertOpsItem, dismissOpsItem } from './actions'

interface OpsItem {
  id: string
  kind: string
  title: string
  summary: string | null
  cost: string | null
  mins: number | null
  status: string
  created_at: string
  payload: { slug?: string; old_content?: string; new_content?: string; days_stale?: number }
}

function stripBlocks(html: string): string {
  return html
    .replace(/<!--\s*\/?wp:[^>]*-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function OpsCard({ item }: { item: OpsItem }) {
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<string | null>(null)
  const [showDiff, setShowDiff] = useState(false)

  const ageDays = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86_400_000)

  const run = (fn: (id: string) => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const r = await fn(item.id)
      setMsg(r.message)
    })

  return (
    <div id={item.id} className="rounded-xl border border-amber-300 bg-amber-50/50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-gray-900">{item.title}</div>
          {item.summary && <div className="mt-1 text-sm text-gray-600">{item.summary}</div>}
          <div className="mt-1 text-xs text-gray-500">
            {item.mins ? `~${item.mins} min ahorrados · ` : ''}en cola {ageDays === 0 ? 'desde hoy' : `hace ${ageDays}d`}
          </div>
          {item.cost && <div className="mt-1 text-xs text-red-700">Si no: {item.cost}</div>}
        </div>
      </div>

      {item.kind === 'page_rewrite' && (
        <div className="mt-3">
          <button onClick={() => setShowDiff(!showDiff)} className="text-sm font-medium text-teal-700 underline">
            {showDiff ? 'Cerrar preview' : 'Ver antes / después'}
          </button>
          {showDiff && (
            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-red-200 bg-white p-3">
                <div className="mb-1 text-xs font-bold uppercase text-red-600">Antes ({item.payload.days_stale}d viejo)</div>
                <div className="max-h-72 overflow-y-auto whitespace-pre-wrap text-xs text-gray-700">{stripBlocks(item.payload.old_content || '')}</div>
              </div>
              <div className="rounded-lg border border-green-200 bg-white p-3">
                <div className="mb-1 text-xs font-bold uppercase text-green-700">Después (draft)</div>
                <div className="max-h-72 overflow-y-auto whitespace-pre-wrap text-xs text-gray-700">{stripBlocks(item.payload.new_content || '')}</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {item.status === 'pending' && (
          <>
            {item.kind !== 'note' && (
            <button
              onClick={() => run(approveOpsItem)}
              disabled={pending}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {pending ? 'Publicando…' : 'Publicar'}
            </button>
            )}
            <button
              onClick={() => run(dismissOpsItem)}
              disabled={pending}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 disabled:opacity-50"
            >
              Descartar
            </button>
          </>
        )}
        {item.status === 'approved' && (
          <button
            onClick={() => run(revertOpsItem)}
            disabled={pending}
            className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-700 disabled:opacity-50"
          >
            {pending ? 'Revirtiendo…' : 'Revertir'}
          </button>
        )}
        {item.payload.slug && (
          <a href={`https://caborojo.com/${item.payload.slug}/`} target="_blank" rel="noreferrer" className="text-sm text-gray-500 underline">
            Ver página live →
          </a>
        )}
        {msg && <span className="text-sm text-gray-700">{msg}</span>}
      </div>
    </div>
  )
}
