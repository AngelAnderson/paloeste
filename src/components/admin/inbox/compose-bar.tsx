'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

const PITCH_TEMPLATES = [
  {
    label: '📋 Corto (SMS — 2 segmentos)',
    text: 'Mijo, hay [X] [categoría] en Cabo Rojo y NINGUNO está en La Vitrina. $799 al año — un pago y cada vez que alguien textea "[categoría]" al 787-417-7711, TÚ sales primero. El que madruga, Dios lo ayuda. ¿Te interesa?',
  },
  {
    label: '📋 Medio (WhatsApp)',
    text: 'Bendición — te escribo porque hay [X] [categoría] en el directorio de Cabo Rojo y NINGUNO es sponsor todavía. Eso quiere decir que el primer negocio que entre, domina la categoría completa.\n\nPor $799 al año recibes: prioridad en El Veci (787-417-7711), tu página en CaboRojo.com, mención semanal en Facebook, newsletter a 1,000+ caborrojeños, y posicionamiento en Google.\n\nLuis David Refrigeración lleva meses y le funciona — cuando buscan "aire acondicionado", él sale primero.\n\nEl que llega primero, come caliente. ¿Quieres ser el primero en [categoría]?',
  },
  {
    label: '📋 Completo (WhatsApp/Email)',
    text: 'Saludos — te escribo del directorio de CaboRojo.com. Solo hay [X] [categoría] registrados en Cabo Rojo y NINGUNO tiene La Vitrina todavía.\n\nPor $799 al año — un solo pago — esto es lo que recibes:\n\n✅ El Veci — Cuando alguien textea "[categoría]" al 787-417-7711, TÚ sales primero. No el de al lado.\n✅ Página dedicada en CaboRojo.com y MapaDeCaboRojo.com — con tus fotos, horario, mapa y teléfono.\n✅ Facebook semanal — Te mencionamos en la página de CaboRojo.com usando lo que TÚ publiques.\n✅ Newsletter — Sales en el email semanal que le llega a 1,000+ caborrojeños directo al inbox.\n✅ Google SEO — Tu negocio indexado para que te encuentren en Google también.\n✅ Reporte — Data real de cuántas veces buscaron "[categoría]" en el directorio.\n\nLuis David Refrigeración ya está y le funciona — cuando se daña un aire, la gente no googlea, textea al 787-417-7711 y él sale primero.\n\n$799 al año. Un pago. Pa\'lante todo el año, 24/7. El que llega primero, come caliente — ¿va a ser tu negocio o el de enfrente?',
  },
]

interface ComposeBarProps {
  onSend: (message: string, channel?: string) => Promise<void>
  conversationId?: string | null
  disabled?: boolean
  defaultChannel?: string
}

export function ComposeBar({ onSend, conversationId, disabled, defaultChannel = 'sms' }: ComposeBarProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [channel, setChannel] = useState(defaultChannel)
  const [showTemplates, setShowTemplates] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset state when conversation changes
  useEffect(() => {
    setSuggestions([])
    setShowTemplates(false)
    setSendError(null)
    setText('')
    setChannel(defaultChannel)
  }, [conversationId, defaultChannel])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setSendError(null)
    try {
      await onSend(trimmed, channel)
      setText('')
      setSuggestions([])
      setShowTemplates(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (e: any) {
      setSendError(e?.message || 'Error al enviar mensaje')
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
      {/* Error toast */}
      {sendError && (
        <div className="mx-3 mt-2 px-3 py-2 bg-[#f87171]/20 border border-[#f87171]/40 rounded-lg flex items-center justify-between">
          <span className="text-xs text-[#f87171]">{sendError}</span>
          <button onClick={() => setSendError(null)} className="text-[#f87171] hover:text-white text-xs ml-2">✕</button>
        </div>
      )}

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

      {/* Templates */}
      {showTemplates && (
        <div className="px-3 pt-3 pb-1 space-y-1.5 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] uppercase tracking-wider text-[#64748b]">Templates de Pitch</span>
            <button
              onClick={() => setShowTemplates(false)}
              className="text-[10px] text-[#64748b] hover:text-white"
            >
              Cerrar
            </button>
          </div>
          {PITCH_TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => { pickSuggestion(t.text); setShowTemplates(false) }}
              className="w-full text-left px-3 py-2 bg-[#1e293b] hover:bg-[#334155] border border-[#334155] rounded-lg text-xs text-[#f1f5f9] transition-colors"
            >
              <span className="font-medium">{t.label}</span>
              <p className="text-[#64748b] truncate mt-0.5">{t.text.slice(0, 80)}...</p>
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
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={disabled}
          className="px-2.5 py-2 bg-[#1e293b] border border-[#334155] text-[#94a3b8] hover:text-[#f59e0b] hover:border-[#f59e0b] rounded-lg text-sm shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Templates de pitch"
        >
          📋
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
        {/* Channel selector */}
        <button
          onClick={() => setChannel(channel === 'sms' ? 'whatsapp' : 'sms')}
          disabled={disabled || sending}
          className={`px-2 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 border transition-colors ${
            channel === 'sms'
              ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30 hover:border-[#38bdf8]'
              : 'bg-[#4ade80]/10 text-[#4ade80] border-[#4ade80]/30 hover:border-[#4ade80]'
          }`}
          title={`Enviando por ${channel === 'sms' ? 'SMS' : 'WhatsApp'}. Click para cambiar.`}
        >
          {channel === 'sms' ? 'SMS' : 'WA'}
        </button>
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
