'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { BusinessEdit } from '@/lib/admin-queries'
import { approveEdit, rejectEdit } from './actions'

interface Props {
  edits: BusinessEdit[]
  filter: 'pending' | 'applied' | 'rejected' | 'all'
}

const APPLIED_BY = 'angel'

const FILTERS: Array<{ key: Props['filter']; label: string }> = [
  { key: 'pending', label: 'Pendientes' },
  { key: 'applied', label: 'Aplicados' },
  { key: 'rejected', label: 'Rechazados' },
  { key: 'all', label: 'Todos' },
]

export function EditsView({ edits, filter }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  function onApprove(id: string) {
    if (!confirm('¿Aplicar este cambio? Recuerda hacer la edición real en /admin/places primero.')) return
    startTransition(async () => {
      try {
        await approveEdit(id, APPLIED_BY)
        router.refresh()
      } catch (e: any) {
        alert(`Error: ${e.message || e}`)
      }
    })
  }

  function onReject(id: string) {
    setRejectingId(id)
    setRejectReason('')
  }

  function confirmReject() {
    if (!rejectingId) return
    const id = rejectingId
    const reason = rejectReason
    startTransition(async () => {
      try {
        await rejectEdit(id, APPLIED_BY, reason || undefined)
        setRejectingId(null)
        setRejectReason('')
        router.refresh()
      } catch (e: any) {
        alert(`Error: ${e.message || e}`)
      }
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Edit requests</h1>
        <p className="text-sm text-gray-600">Tickets de edición que llegaron por *7711. Aplica → guarda en places, rechaza si es duplicado/spam.</p>
      </div>

      <div className="flex gap-2">
        {FILTERS.map(f => (
          <Link
            key={f.key}
            href={`/admin/edits?status=${f.key}`}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === f.key ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {edits.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center text-gray-500">
          {filter === 'pending' ? 'No hay edits pendientes. ✅' : 'Sin resultados.'}
        </div>
      ) : (
        <div className="space-y-3">
          {edits.map(e => (
            <article key={e.id} className="rounded-lg border bg-white p-4 shadow-sm">
              <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-mono text-gray-500">
                    {e.phone} · <span className="text-gray-400">{new Date(e.created_at).toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico' })}</span>
                  </div>
                  <div className="mt-1 text-base font-semibold">
                    {e.business_name || <span className="italic text-gray-400">sin negocio asociado</span>}
                  </div>
                  {e.place_id && (
                    <Link href={`/admin/editar/${e.place_id}`} className="text-xs text-blue-600 underline hover:text-blue-800">
                      Editar en /admin/editar →
                    </Link>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  e.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  e.status === 'applied' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {e.status}
                </span>
              </header>

              <div className="mt-3 whitespace-pre-wrap rounded-md bg-gray-50 p-3 text-sm text-gray-800">
                {e.requested_changes}
              </div>

              {e.notes && (
                <div className="mt-2 text-xs text-gray-500">📝 {e.notes}</div>
              )}

              {e.status === 'pending' && (
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => onApprove(e.id)}
                    disabled={pending}
                    className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                  >
                    ✓ Marcar aplicado
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(e.id)}
                    disabled={pending}
                    className="rounded-md bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    ✗ Rechazar
                  </button>
                </div>
              )}

              {e.status !== 'pending' && e.applied_at && (
                <div className="mt-2 text-xs text-gray-500">
                  {e.status === 'applied' ? '✓ Aplicado' : '✗ Rechazado'} {' '}
                  {new Date(e.applied_at).toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico' })}
                  {e.applied_by ? ` por ${e.applied_by}` : ''}
                </div>
              )}

              {rejectingId === e.id && (
                <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3">
                  <label className="block text-xs font-medium text-red-800 mb-1">Razón (opcional)</label>
                  <input
                    type="text"
                    value={rejectReason}
                    onChange={ev => setRejectReason(ev.target.value)}
                    placeholder="duplicado, spam, info errónea, etc."
                    className="w-full rounded-md border border-red-300 px-2 py-1 text-sm"
                  />
                  <div className="mt-2 flex gap-2">
                    <button type="button" onClick={confirmReject} disabled={pending} className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50">Confirmar rechazo</button>
                    <button type="button" onClick={() => setRejectingId(null)} className="rounded-md bg-white px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 border">Cancelar</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
