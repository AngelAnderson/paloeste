'use client'

import { useEffect, useRef, useState } from 'react'
import type { InboxMessage } from '@/lib/types'
import { ComposeBar } from './compose-bar'
import { FlagModal } from './flag-modal'

interface MessageThreadProps {
  messages: InboxMessage[]
  loading: boolean
  onSend: (message: string, channel?: string) => Promise<void>
  contactName: string | null
  contactPhone: string
  conversationId?: string | null
  onShowContact?: () => void
  onBack?: () => void
}

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

export function MessageThread({ messages, loading, onSend, contactName, contactPhone, conversationId, onShowContact, onBack }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [flaggingMessage, setFlaggingMessage] = useState<InboxMessage | null>(null)
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (!messages.length && !loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 flex items-center justify-center text-[#64748b] text-sm">
          {onBack ? 'No hay mensajes' : 'Selecciona una conversacion'}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 border-b border-[#334155] bg-[#0f172a] shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-[#94a3b8] hover:text-white">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10H5M5 10l5 5M5 10l5-5"/></svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{contactName || contactPhone}</p>
          {contactName && <p className="text-[#64748b] text-xs truncate">{contactPhone}</p>}
        </div>
        {onShowContact && (
          <button onClick={onShowContact} className="text-[#94a3b8] hover:text-[#38bdf8] text-xs shrink-0">
            Info
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="text-center text-[#64748b] text-sm py-4">Cargando mensajes...</div>
        )}
        {messages.map(msg => {
          const isOutbound = msg.direction === 'outbound'
          const isBotResponse = isOutbound && msg.source === 'twilio-webhook'
          const isFlagged = flaggedIds.has(msg.id)
          return (
            <div key={msg.id} className={`flex ${isOutbound ? 'justify-end' : 'justify-start'} group`}>
              <div className={`max-w-[80%] rounded-xl px-3 py-2 relative ${
                isOutbound
                  ? 'bg-[#38bdf8]/20 text-[#f1f5f9]'
                  : 'bg-[#1e293b] text-[#f1f5f9]'
              }`}>
                <p className="text-sm whitespace-pre-wrap break-words">{msg.body || '(sin contenido)'}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[10px] text-[#64748b]">{formatTime(msg.created_at)}</span>
                  {msg.intent && (
                    <span className="text-[10px] text-[#64748b] bg-[#0f172a] px-1.5 py-0.5 rounded">{msg.intent}</span>
                  )}
                  {msg.source === 'admin' && (
                    <span className="text-[10px] text-[#38bdf8]">manual</span>
                  )}
                  {isOutbound && msg.status && (
                    <span className={`text-[10px] ${
                      msg.status === 'delivered' ? 'text-[#4ade80]'
                        : msg.status === 'undelivered' || msg.status === 'failed' ? 'text-[#f87171]'
                        : 'text-[#64748b]'
                    }`}>
                      {msg.status === 'delivered' ? '✓ entregado'
                        : msg.status === 'undelivered' ? '✗ no entregado'
                        : msg.status === 'failed' ? '✗ falló'
                        : msg.status === 'sent' ? '↑ enviado'
                        : msg.status}
                      {msg.error_code ? ` (${msg.error_code})` : ''}
                    </span>
                  )}
                  {isFlagged && (
                    <span className="text-[10px] text-[#f87171]">marcada</span>
                  )}
                  {isBotResponse && !isFlagged && (
                    <button
                      onClick={() => setFlaggingMessage(msg)}
                      className="text-[10px] text-[#64748b] hover:text-[#f87171] ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Marcar respuesta como mala"
                    >
                      🚩
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Compose */}
      <ComposeBar onSend={onSend} conversationId={conversationId} defaultChannel="sms" />

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
