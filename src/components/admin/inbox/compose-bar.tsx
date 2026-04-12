'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface ComposeBarProps {
  onSend: (message: string) => Promise<void>
  conversationId?: string | null
  disabled?: boolean
}

export function ComposeBar({ onSend, conversationId, disabled }: ComposeBarProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset suggestions when conversation changes
  useEffect(() => {
    setSuggestions([])
    setText('')
  }, [conversationId])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      await onSend(trimmed)
      setText('')
      setSuggestions([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } finally {
      setSending(false)
    }
  }, [text, sending, onSend])

  const fetchSuggestions = useCallback(async () => {
    if (!conversationId || loadingSuggestions) return
    setLoadingSuggestions(true)
    try {
      const res = await fetch('/api/inbox/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId }),
      })
      const data = await res.json()
      setSuggestions(data.suggestions || [])
    } catch (e) {
      console.error('Failed to load suggestions:', e)
    } finally {
      setLoadingSuggestions(false)
    }
  }, [conversationId, loadingSuggestions])

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setText(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 120) + 'px'
  }

  function pickSuggestion(s: string) {
    setText(s)
    setSuggestions([])
    if (textareaRef.current) {
      textareaRef.current.focus()
      // Resize after content is set
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
        }
      }, 0)
    }
  }

  return (
    <div className="border-t border-[#334155] bg-[#0f172a]">
      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-3 pt-3 pb-1 space-y-1.5 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-[#64748b]">Sugerencias AI</span>
            <button
              onClick={() => setSuggestions([])}
              className="text-[10px] text-[#64748b] hover:text-white"
            >
              Cerrar
            </button>
          </div>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => pickSuggestion(s)}
              className="w-full text-left px-3 py-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-lg text-xs text-[#f1f5f9] transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Compose */}
      <div className="flex items-end gap-2 p-3">
        <button
          onClick={fetchSuggestions}
          disabled={!conversationId || loadingSuggestions || disabled}
          className="px-2.5 py-2 bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-[#38bdf8] hover:border-[#38bdf8] rounded-lg text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Sugerencias AI"
        >
          {loadingSuggestions ? '...' : '✨'}
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="flex-1 bg-[#1e293b] text-[#f1f5f9] border border-[#334155] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#38bdf8] placeholder:text-[#64748b] disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="px-4 py-2 bg-[#38bdf8] text-[#0f172a] rounded-lg text-sm font-medium hover:bg-[#7dd3fc] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
