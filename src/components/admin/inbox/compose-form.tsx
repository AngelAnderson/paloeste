'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, MessageSquare, Phone, ExternalLink, Check } from 'lucide-react'

type Props = {
  initialTo: string
  initialBody: string
  initialChannel: 'whatsapp' | 'sms'
  contextId: string | null
  contactName: string | null
  contactType: string | null
  contactNotes: string | null
  lastMessage: { body: string; direction: string; created_at: string } | null
  placeSlug: string | null
}

export function ComposeForm({
  initialTo,
  initialBody,
  initialChannel,
  contextId,
  contactName,
  contactType,
  contactNotes,
  lastMessage,
  placeSlug,
}: Props) {
  const router = useRouter()
  const [to, setTo] = useState(initialTo)
  const [body, setBody] = useState(initialBody)
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>(initialChannel)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSend() {
    if (!to.trim() || !body.trim()) {
      setError('Falta destinatario o mensaje')
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/send-outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), body: body.trim(), channel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')

      if (contextId) {
        await fetch(`/api/admin/relationships/${contextId}/log`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: channel === 'whatsapp' ? 'WhatsApp enviado' : 'SMS enviado',
            notes: body.trim().slice(0, 200),
          }),
        }).catch(() => {})
      }

      setSent(true)
      setTimeout(() => router.push('/admin/inbox'), 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error enviando mensaje')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4">
      {(contactName || lastMessage) && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 space-y-2">
          {contactName && (
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{contactName}</div>
                {contactType && (
                  <span className="text-xs text-[#64748b] capitalize">{contactType}</span>
                )}
              </div>
              {placeSlug && (
                <a
                  href={`/negocio/${placeSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-[#38bdf8] hover:underline flex items-center gap-1"
                >
                  Ver perfil <ExternalLink size={12} />
                </a>
              )}
            </div>
          )}
          {contactNotes && (
            <p className="text-xs text-[#94a3b8] italic">{contactNotes}</p>
          )}
          {lastMessage && (
            <div className="text-xs text-[#64748b] border-t border-[#334155] pt-2">
              <span className="font-medium">
                Último mensaje ({lastMessage.direction}):
              </span>{' '}
              <span className="italic">{lastMessage.body.slice(0, 120)}{lastMessage.body.length > 120 ? '…' : ''}</span>
            </div>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#94a3b8] mb-1">Destinatario</label>
        <div className="flex items-center gap-2">
          <Phone size={14} className="text-[#64748b]" />
          <input
            type="text"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            placeholder="+17875551234"
            className="flex-1 bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38bdf8]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#94a3b8] mb-1">Canal</label>
        <div className="flex gap-2">
          <button
            onClick={() => setChannel('whatsapp')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              channel === 'whatsapp'
                ? 'bg-[#16a34a] text-white'
                : 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155]'
            }`}
          >
            <MessageSquare size={14} className="inline mr-1" /> WhatsApp
          </button>
          <button
            onClick={() => setChannel('sms')}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
              channel === 'sms'
                ? 'bg-[#38bdf8] text-white'
                : 'bg-[#1e293b] text-[#94a3b8] hover:bg-[#334155]'
            }`}
          >
            <Phone size={14} className="inline mr-1" /> SMS
          </button>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#94a3b8] mb-1">Mensaje</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={10}
          className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-sm font-mono resize-none focus:outline-none focus:border-[#38bdf8]"
          placeholder="Hola..."
        />
        <div className="text-xs text-[#64748b] mt-1 text-right">{body.length} caracteres</div>
      </div>

      {error && <p className="text-[#f87171] text-sm">{error}</p>}

      {sent ? (
        <div className="flex items-center justify-center gap-2 text-[#4ade80] font-medium py-3 bg-[#022c22] rounded-lg">
          <Check size={18} /> Enviado desde *7711
        </div>
      ) : (
        <button
          onClick={handleSend}
          disabled={sending || !to.trim() || !body.trim()}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold bg-[#D4321E] hover:bg-[#b8281a] disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Send size={16} /> {sending ? 'Enviando…' : `Enviar desde *7711 (${channel.toUpperCase()})`}
        </button>
      )}

      <p className="text-xs text-[#64748b] text-center">
        El mensaje sale desde 787-417-7711. Se loguea en la conversación + auto-crea prospecto si el número
        coincide con un negocio.
      </p>
    </div>
  )
}
