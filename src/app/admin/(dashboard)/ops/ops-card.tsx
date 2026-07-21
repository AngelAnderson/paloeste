'use client'

import { useState, useTransition } from 'react'
import { approveOpsItem, revertOpsItem, dismissOpsItem, editReplyText, teachLesson } from './actions'

interface OpsItem {
  id: string
  kind: string
  title: string
  summary: string | null
  cost: string | null
  mins: number | null
  status: string
  created_at: string
  payload: {
    slug?: string; old_content?: string; new_content?: string; days_stale?: number
    comment_id?: number; author?: string; comment_text?: string; reply_text?: string; post_title?: string; post_link?: string
  }
}

export function TeachBox() {
  const [pending, startTransition] = useTransition()
  const [text, setText] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="font-semibold text-gray-900">Enséñale al agente</div>
      <p className="mt-1 text-xs text-gray-500">Una lección directa que entra al prompt de la próxima corrida. Ej: "Nunca toques la página /semana/, se actualiza sola."</p>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} className="mt-2 w-full rounded-lg border border-gray-300 p-2 text-sm" placeholder="Escribe la lección..." />
      <div className="mt-2 flex items-center gap-2">
        <button
          onClick={() => startTransition(async () => { const r = await teachLesson(text); setMsg(r.message); if (r.ok) setText('') })}
          disabled={pending || !text.trim()}
          className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Enseñar'}
        </button>
        {msg && <span className="text-sm text-gray-600">{msg}</span>}
      </div>
    </div>
  )
}

function stripBlocks(html: string): string {
  return html
    .replace(/<!--\s*\/?wp:[^>]*-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function ReplyEditor({ id, initial }: { id: string; initial: string }) {
  const [pending, startTransition] = useTransition()
  const [text, setText] = useState(initial)
  const [msg, setMsg] = useState<string | null>(null)
  const dirty = text !== initial
  return (
    <div>
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-gray-300 p-2 text-sm" />
      {dirty && (
        <button
          onClick={() => startTransition(async () => { const r = await editReplyText(id, text); setMsg(r.message) })}
          disabled={pending}
          className="mt-1 rounded-lg border border-teal-600 px-3 py-1 text-xs font-semibold text-teal-700 disabled:opacity-50"
        >
          {pending ? 'Guardando…' : 'Guardar edición'}
        </button>
      )}
      {msg && <span className="ml-2 text-xs text-gray-600">{msg}</span>}
    </div>
  )
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

      {item.kind === 'comment_reply' && (
        <div className="mt-3 space-y-2">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="text-xs font-bold uppercase text-gray-500">💬 {item.payload.author} comentó{item.payload.post_title ? ` en "${item.payload.post_title}"` : ''}</div>
            <div className="mt-1 text-sm text-gray-700">{item.payload.comment_text}</div>
          </div>
          <div className="rounded-lg border border-teal-200 bg-white p-3">
            <div className="text-xs font-bold uppercase text-teal-700">Tu respuesta (edítala si quieres, la edición también le enseña)</div>
            <ReplyEditor id={item.id} initial={item.payload.reply_text || ''} />
          </div>
        </div>
      )}

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
        {(item.payload.slug || item.payload.post_link) && (
          <a href={item.payload.post_link || `https://caborojo.com/${item.payload.slug}/`} target="_blank" rel="noreferrer" className="text-sm text-gray-500 underline">
            Ver página live →
          </a>
        )}
        {msg && <span className="text-sm text-gray-700">{msg}</span>}
      </div>
    </div>
  )
}
