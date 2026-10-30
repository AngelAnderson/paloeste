'use client'

import { useEffect, useRef, useState } from 'react'
import type { InboxConversation, InboxMessage } from '@/lib/types'
import { ComposeBar } from './compose-bar'
import { FlagModal } from './flag-modal'
import { ArrowLeft, Check } from 'lucide-react'

interface MessageThreadProps {
  messages: InboxMessage[]
  loading: boolean
  onSend: (message: string) => Promise<void>
  contactName: string | null
  contactPhone: string
  conversationId?: string | null
  conversation?: InboxConversation | null
  nota?: string | null
  onShowContact?: () => void
  onBack?: () => void
  onFlagChanged?: (action: string, applied: Record<string, unknown>) => void
}

const VENTANA_MS = 24 * 60 * 60 * 1000

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)
  const isYesterday = d.toDateString() === yesterday.toDateString()

  const time = d.toLocaleTimeString('es-PR', { hour: 'numeric', minute: '2-digit', hour12: true })
  if (isToday) return time
  if (isYesterday) return `Ayer ${time}`
  return d.toLocaleDateString('es-PR', { month: 'short', day: 'numeric' }) + ' ' + time
}

function quienEscribio(msg: InboxMessage, contactName: string | null) {
  if (msg.direction !== 'outbound') return contactName || 'Vecino'
  return msg.source === 'admin' ? 'Angel' : 'Veci'
}

function textoDeEstado(status: string | null | undefined) {
  if (status === 'delivered') return 'Entregado'
  if (status === 'undelivered') return 'No entregado'
  if (status === 'failed') return 'Falló'
  return null
}

export function MessageThread({ messages, loading, onSend, contactName, contactPhone, conversationId, conversation, nota, onShowContact, onBack, onFlagChanged }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [flaggingMessage, setFlaggingMessage] = useState<InboxMessage | null>(null)
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set())
  const [flagging, setFlagging] = useState(false)

  const isResolved = !!conversation?.resolved_at
  const esWhatsApp = conversation?.channel === 'whatsapp'
  const ultimoEntrante = [...messages].reverse().find(m => m.direction === 'inbound')
  const ventanaCerrada = esWhatsApp && !loading && !!ultimoEntrante
    && Date.now() - new Date(ultimoEntrante.created_at).getTime() > VENTANA_MS

  async function applyFlag(action: string) {
    if (!conversationId || flagging) return
    setFlagging(true)
    try {
      const res = await fetch('/api/inbox/flag', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, action }),
      })
      const data = await res.json()
      if (res.ok && onFlagChanged) onFlagChanged(action, data.applied || {})
    } catch (e) {
      console.error('flag error:', e)
    } finally {
      setFlagging(false)
    }
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b border-[#334155] bg-[#0f172a] shrink-0">
        {onBack && (
          <button onClick={onBack} aria-label="Volver a la lista" className="lg:hidden min-h-12 min-w-12 flex items-center justify-center text-[#e2e8f0] hover:text-white">
            <ArrowLeft size={24} aria-hidden="true" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-white text-base font-medium truncate">{contactName || contactPhone}</h2>
          <p className="text-[#cbd5e1] text-base truncate">
            {contactName ? `${contactPhone} · ` : ''}{esWhatsApp ? 'WhatsApp' : 'SMS'}
          </p>
        </div>

        {conversationId && (
          <button
            onClick={() => applyFlag(isResolved ? 'reopen' : 'resolve')}
            disabled={flagging}
            className={`min-h-12 px-3 flex items-center gap-1.5 rounded-lg text-base font-medium shrink-0 transition-colors disabled:opacity-50 ${
              isResolved ? 'bg-[#1e293b] text-[#e2e8f0]' : 'bg-[#166534] text-white hover:bg-[#15803d]'
            }`}
          >
            <Check size={18} aria-hidden="true" /> {isResolved ? 'Reabrir' : 'Resuelto'}
          </button>
        )}

        {onShowContact && (
          <button onClick={onShowContact} className="xl:hidden min-h-12 px-3 text-[#7dd3fc] hover:text-white text-base shrink-0">
            Notas
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
        {loading && (
          <p className="text-center text-[#cbd5e1] text-base py-4" role="status">Cargando mensajes...</p>
        )}
        {!loading && messages.length === 0 && (
          <p className="text-center text-[#cbd5e1] text-base py-4">Todavía no hay mensajes.</p>
        )}
        {messages.map(msg => {
          const isOutbound = msg.direction === 'outbound'
          const isBotResponse = isOutbound && msg.source === 'twilio-webhook'
          const isFlagged = flaggedIds.has(msg.id)
          const estado = isOutbound ? textoDeEstado(msg.status) : null
          const falloEntrega = msg.status === 'undelivered' || msg.status === 'failed'
          return (
            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 ${
                isOutbound
                  ? msg.source === 'admin' ? 'bg-[#075985] text-white' : 'bg-[#334155] text-white'
                  : 'bg-[#1e293b] text-white'
              }`}>
                <p className="text-base font-semibold">{quienEscribio(msg, contactName)}</p>
                <p className="text-base whitespace-pre-wrap break-words">{msg.body || '(sin contenido)'}</p>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <span className="text-base text-[#e2e8f0]">{formatTime(msg.created_at)}</span>
                  {estado && (
                    <span className={`text-base ${falloEntrega ? 'text-[#fca5a5]' : 'text-[#e2e8f0]'}`}>{estado}</span>
                  )}
                  {isFlagged && <span className="text-base text-[#fca5a5]">Marcada</span>}
                  {isBotResponse && !isFlagged && (
                    <button
                      onClick={() => setFlaggingMessage(msg)}
                      className="min-h-12 px-2 text-base text-[#e2e8f0] underline hover:text-white ml-auto"
                    >
                      Estuvo mal
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {(ventanaCerrada || nota) && (
        <p role="status" className="mx-3 mt-2 px-3 py-2 bg-[#78350f] text-white text-base rounded-lg">
          {nota || 'Pasaron más de 24 horas desde su último mensaje. Tu respuesta saldrá por SMS.'}
        </p>
      )}

      {/* Compose */}
      <ComposeBar onSend={onSend} conversationId={conversationId} />

      {/* Flag modal */}
      {flaggingMessage && conversationId && (
        <FlagModal
          messageId={flaggingMessage.id}
          conversationId={conversationId}
          originalBody={flaggingMessage.body || ''}
          onClose={() => setFlaggingMessage(null)}
          onSaved={() => {
            setFlaggedIds(prev => new Set(prev).add(flaggingMessage.id))
          }}
        />
      )}
    </div>
  )
}
