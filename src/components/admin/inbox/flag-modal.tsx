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
        const err = await res.json().catch((): { error?: string } => ({}))
        throw new Error(err.error || 'Error al guardar')
      }
      onSaved()
      onClose()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-[#0f172a] border border-[#334155] rounded-xl w-full max-w-md p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-semibold">Esta respuesta estuvo mal</h3>
          <button onClick={onClose} aria-label="Cerrar" className="min-h-12 min-w-12 text-[#e2e8f0] hover:text-white text-xl">&times;</button>
        </div>

        <div className="bg-[#1e293b] border border-[#475569] rounded-lg p-3">
          <p className="text-base text-[#cbd5e1] mb-1">Lo que contestó el Veci</p>
          <p className="text-base text-[#e2e8f0] whitespace-pre-wrap line-clamp-4">{originalBody}</p>
        </div>

        <div>
          <label className="block text-base text-[#cbd5e1] mb-1">
            ¿Qué estuvo mal?
          </label>
          <textarea
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={2}
            placeholder="Ej: Le dio información incorrecta del horario..."
            className="w-full bg-[#1e293b] text-white border border-[#475569] rounded-lg min-h-12 px-3 py-2 text-base resize-none focus:outline-none focus:border-[#38bdf8] placeholder:text-[#cbd5e1]"
          />
        </div>

        <div>
          <label className="block text-base text-[#cbd5e1] mb-1">
            ¿Qué debió contestar?
          </label>
          <textarea
            value={suggested}
            onChange={e => setSuggested(e.target.value)}
            rows={3}
            placeholder="Escribe la respuesta correcta..."
            className="w-full bg-[#1e293b] text-white border border-[#475569] rounded-lg min-h-12 px-3 py-2 text-base resize-none focus:outline-none focus:border-[#38bdf8] placeholder:text-[#cbd5e1]"
          />
        </div>

        {error && <p className="text-[#fca5a5] text-base">{error}</p>}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 min-h-12 px-3 py-2 bg-[#1e293b] border border-[#475569] text-[#e2e8f0] rounded-lg text-base hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !reason.trim() || !suggested.trim()}
            className="flex-1 min-h-12 px-3 py-2 bg-[#38bdf8] text-[#0f172a] rounded-lg text-base font-medium hover:bg-[#7dd3fc] disabled:opacity-40"
          >
            {saving ? 'Guardando...' : 'Guardar para mejorar'}
          </button>
        </div>
      </div>
    </div>
  )
}
