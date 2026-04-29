'use client'

import { useEffect, useRef, useState } from 'react'
import type { InboxConversation, InboxMessage } from '@/lib/types'
import { ComposeBar } from './compose-bar'
import { FlagModal } from './flag-modal'
import { Star, Clock, AlertCircle, Check } from 'lucide-react'

interface MessageThreadProps {
  messages: InboxMessage[]
  loading: boolean
  onSend: (message: string, channel?: string) => Promise<void>
  contactName: string | null
  contactPhone: string
  conversationId?: string | null
  conversation?: InboxConversation | null
  onShowContact?: () => void
  onBack?: () => void
  onFlagChanged?: (action: string, applied: Record<string, unknown>) => void
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

export function MessageThread({ messages, loading, onSend, contactName, contactPhone, conversationId, conversation, onShowContact, onBack, onFlagChanged }: MessageThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const [flaggingMessage, setFlaggingMessage] = useState<InboxMessage | null>(null)
  const [flaggedIds, setFlaggedIds] = useState<Set<number>>(new Set())
  const [flagging, setFlagging] = useState(false)

  const isStarred = !!conversation?.is_starred
  const isAwaiting = !!conversation?.awaiting_info
  const isResolved = !!conversation?.resolved_at
  const isSnoozed = conversation?.snoozed_until ? new Date(conversation.snoozed_until) > new Date() : false

  async function applyFlag(action: string, snoozeDays?: number) {
    if (!conversationId || flagging) return
    setFlagging(true)
    try {
      const res = await fetch('/api/inbox/flag', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, action, snoozeDays }),
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
      <div className="flex items-center gap-2 p-3 border-b border-[#334155] bg-[#0f172a] shrink-0">
        {onBack && (
          <button onClick={onBack} className="text-[#94a3b8] hover:text-white">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 10H5M5 10l5 5M5 10l5-5"/></svg>
          </button>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate flex items-center gap-1.5">
            {isStarred && <Star size={14} className="text-[#fbbf24] fill-[#fbbf24] shrink-0" />}
            {isAwaiting && <Clock size={14} className="text-[#fb923c] shrink-0" />}
            {isResolved && <Check size={14} className="text-[#4ade80] shrink-0" />}
            <span className="truncate">{contactName || contactPhone}</span>
          </p>
          {contactName && <p className="text-[#64748b] text-xs truncate">{contactPhone}</p>}
        </div>

        {/* Quick-action buttons */}
        {conversationId && (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => applyFlag(isStarred ? 'unstar' : 'star')}
              disabled={flagging}
              title={isStarred ? 'Quitar estrella' : 'Star (importante)'}
              className={`p-1.5 rounded hover:bg-[#1e293b] transition-colors ${isStarred ? 'text-[#fbbf24]' : 'text-[#64748b] hover:text-[#fbbf24]'}`}
            >
              <Star size={16} className={isStarred ? 'fill-[#fbbf24]' : ''} />
            </button>
            <button
              onClick={() => applyFlag(isAwaiting ? 'unawaiting' : 'awaiting')}
              disabled={flagging}
              title={isAwaiting ? 'Ya no espero info' : 'Esperando info'}
              className={`p-1.5 rounded hover:bg-[#1e293b] transition-colors ${isAwaiting ? 'text-[#fb923c]' : 'text-[#64748b] hover:text-[#fb923c]'}`}
            >
              <AlertCircle size={16} />
            </button>
            <button
              onClick={() => {
                if (isSnoozed) applyFlag('unsnooze')
                else {
                  const days = parseInt(prompt('¿Cuántos días posponer? (1-30)', '3') || '3', 10)
                  if (days >= 1 && days <= 30) applyFlag('snooze', days)
                }
              }}
              disabled={flagging}
              title={isSnoozed ? `Posponed hasta ${new Date(conversation!.snoozed_until!).toLocaleDateString('es-PR')}` : 'Snooze (posponer)'}
              className={`p-1.5 rounded hover:bg-[#1e293b] transition-colors ${isSnoozed ? 'text-[#a78bfa]' : 'text-[#64748b] hover:text-[#a78bfa]'}`}
            >
              <Clock size={16} />
            </button>
            <button
              onClick={() => applyFlag(isResolved ? 'reopen' : 'resolve')}
              disabled={flagging}
              title={isResolved ? 'Reabrir' : 'Marcar como resuelto'}
              className={`p-1.5 rounded hover:bg-[#1e293b] transition-colors ${isResolved ? 'text-[#4ade80]' : 'text-[#64748b] hover:text-[#4ade80]'}`}
            >
              <Check size={16} />
            </button>
          </div>
        )}

        {onShowContact && (
          <button onClick={onShowContact} className="text-[#94a3b8] hover:text-[#38bdf8] text-xs shrink-0 ml-1">
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
