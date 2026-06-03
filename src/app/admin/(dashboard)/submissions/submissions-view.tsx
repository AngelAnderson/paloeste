'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ContentSubmission } from '@/lib/admin-queries'
import { setSubmissionStatus } from './actions'

interface Props {
  submissions: ContentSubmission[]
  filter: 'pending' | 'published' | 'rejected' | 'archived' | 'all'
}

const REVIEWED_BY = 'angel'

const FILTERS: Array<{ key: Props['filter']; label: string }> = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'published', label: 'Publicadas' },
  { key: 'archived', label: 'Archivadas' },
  { key: 'rejected', label: 'Rechazadas' },
  { key: 'all', label: 'Todas' },
]

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function fmt(ts: string): string {
  return new Date(ts).toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico' })
}

export function SubmissionsView({ submissions, filter }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  function act(id: string, status: 'published' | 'rejected' | 'archived') {
    const labels = { published: 'marcar como publicada', rejected: 'rechazar', archived: 'archivar' }
    if (!confirm(`¿Seguro que quieres ${labels[status]} esta contribución?`)) return
    startTransition(async () => {
      try {
        await setSubmissionStatus(id, status, REVIEWED_BY)
        router.refresh()
      } catch (e: unknown) {
        alert(`Error: ${errorMessage(e)}`)
      }
    })
  }

  function copyBody(id: string, body: string) {
    navigator.clipboard.writeText(body).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 1500)
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Submissions</h1>
        <p className="text-sm text-gray-600">
          Noticias, eventos y fotos que la gente le mandó al Veci (*7711) para compartir en la página.
          Revisa, copia el texto, publícalo tú en FB, y marca el estado. El bot NO publica solo.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map(f => (
          <Link
            key={f.key}
            href={`/admin/submissions?status=${f.key}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {submissions.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          {filter === 'pending' ? 'No hay contribuciones pendientes. ✅' : 'Sin resultados.'}
        </div>
      ) : (
        <div className="space-y-3">
          {submissions.map(s => {
            const phone = s.contact.replace('whatsapp:', '')
            const waLink = `https://wa.me/${phone.replace(/[^0-9]/g, '')}`
            return (
              <article key={s.id} className="rounded-lg border bg-white p-4 shadow-sm">
                <header className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-mono text-gray-500">
                      {phone} · <span className="text-gray-400">{fmt(s.submitted_at)}</span>
                    </div>
                    <div className="mt-1 text-base font-semibold">
                      {s.submitter_name || <span className="italic text-gray-400">sin nombre</span>}
                      <span className="ml-2 text-xs font-normal text-gray-400">vía {s.channel || s.source}</span>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    s.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    s.status === 'published' ? 'bg-green-100 text-green-800' :
                    s.status === 'archived' ? 'bg-gray-100 text-gray-700' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {s.status}
                  </span>
                </header>

                <div className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-800">
                  {s.body}
                </div>

                {s.media_urls.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {s.media_urls.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="block">
                        <img
                          src={url}
                          alt={`foto ${i + 1}`}
                          className="h-24 w-24 rounded-md border object-cover hover:opacity-80"
                        />
                      </a>
                    ))}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => copyBody(s.id, s.body)}
                    className="rounded-md bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                  >
                    {copiedId === s.id ? '✓ Copiado' : '📋 Copiar texto'}
                  </button>
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100"
                  >
                    💬 Responder por WhatsApp
                  </a>
                  {s.conversation_id && (
                    <Link
                      href={`/admin/inbox?c=${s.conversation_id}`}
                      className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
                    >
                      Ver hilo →
                    </Link>
                  )}
                </div>

                {s.status === 'pending' && (
                  <div className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                    <button type="button" onClick={() => act(s.id, 'published')} disabled={pending} className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50">✓ Marcar publicada</button>
                    <button type="button" onClick={() => act(s.id, 'archived')} disabled={pending} className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50">🗄 Archivar</button>
                    <button type="button" onClick={() => act(s.id, 'rejected')} disabled={pending} className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50">✗ Rechazar</button>
                  </div>
                )}

                {s.status !== 'pending' && s.reviewed_at && (
                  <div className="mt-2 text-xs text-gray-500">
                    {s.status} · {fmt(s.reviewed_at)}{s.reviewed_by ? ` por ${s.reviewed_by}` : ''}
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
