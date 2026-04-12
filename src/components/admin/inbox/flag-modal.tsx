'use client'

import { useState } from 'react'

interface FlagModalProps {
  messageId: number
  conversationId: string
  originalBody: string
  onClose: () => void
  onSaved: () => void
}

export function FlagModal({ messageId, conversationId, originalBody, onClose, onSaved }: FlagModalProps) {
  const [reason, setReason] = useState('')
  const [suggested, setSuggested] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSave() {
    if (!reason.trim() || !suggested.trim()) {
      setError('Completa ambos campos')
      return
    }
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/inbox/flag-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId,
          conversationId,
          reason,
          suggestedResponse: suggested,
          originalBody,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Error al guardar')
      }
      onSaved()
      onClose()
    } catch (e: any) {
      setError(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#0f172a] border border-[#334155] rounded-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Marcar respuesta como mala</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-white text-xl leading-none">&times;</button>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">Respuesta original del bot</p>
          <p className="text-xs text-[#94a3b8] whitespace-pre-wrap line-clamp-4">{originalBody}</p>
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#64748b] mb-1">
            ¿Por que esta respuesta fue mala?
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="Ej: Le dio informacion incorrecta del horario..."
            className="w-full bg-[#1e293b] text-white border border-[#334155] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#38bdf8] placeholder:text-[#64748b]"
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-wider text-[#64748b] mb-1">
            ¿Que deberia haber contestado?
          </label>
          <textarea
            value={suggested}
            onChange={e => setSuggested(e.target.value)}
            rows={3}
            placeholder="Escribe la respuesta correcta..."
            className="w-full bg-[#1e293b] text-white border border-[#334155] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#38bdf8] placeholder:text-[#64748b]"
          />
        </div>

        {error && <p className="text-[#f87171] text-xs">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-3 py-2 bg-[#1e293b] border border-[#334155] text-[#94a3b8] rounded-lg text-sm hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !reason.trim() || !suggested.trim()}
            className="flex-1 px-3 py-2 bg-[#38bdf8] text-[#0f172a] rounded-lg text-sm font-medium hover:bg-[#7dd3fc] disabled:opacity-40"
          >
            {saving ? 'Guardando...' : 'Guardar para mejorar'}
          </button>
        </div>
      </div>
    </div>
  )
}
