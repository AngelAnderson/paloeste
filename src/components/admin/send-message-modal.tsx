'use client'

import { useState } from 'react'
import { X, Send, MessageSquare, Phone } from 'lucide-react'

export function SendMessageModal({
  businessName,
  phone,
  defaultMessage,
  onClose,
}: {
  businessName: string
  phone: string | null
  defaultMessage: string
  onClose: () => void
}) {
  const [body, setBody] = useState(defaultMessage)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend(channel: 'sms' | 'whatsapp') {
    if (!phone || !body.trim()) return
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/send-outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, body: body.trim(), channel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setSent(true)
      setTimeout(onClose, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error enviando mensaje')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#1e293b] border border-[#334155] rounded-xl w-full max-w-lg p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm">{businessName}</h3>
          <button onClick={onClose} className="text-[#64748b] hover:text-white cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {phone ? (
          <>
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <Phone size={12} />
              <span>{phone}</span>
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#38bdf8]"
            />

            {error && <p className="text-[#f87171] text-xs">{error}</p>}

            {sent ? (
              <div className="text-center text-[#4ade80] font-medium text-sm py-2">Enviado</div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSend('sms')}
                  disabled={sending || !body.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#334155] hover:bg-[#475569] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <MessageSquare size={14} />
                  SMS
                </button>
                <button
                  onClick={() => handleSend('whatsapp')}
                  disabled={sending || !body.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send size={14} />
                  WhatsApp
                </button>
              </div>
            )}
          </>
        ) : (
          <p className="text-[#f87171] text-sm">No hay teléfono registrado para este negocio.</p>
        )}
      </div>
    </div>
  )
}
