'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Sparkles, ListPlus } from 'lucide-react'

// Respuestas rápidas — servicio primero, venta después (Kern: sin presión, con permiso de salida).
const PITCH_TEMPLATES = [
  {
    label: 'Disculpa y lo cojo yo',
    text: 'Saludos, soy Angel, el humano detrás del Veci. Vi que no te pudo resolver bien, disculpa. Dime qué buscas y te lo consigo yo mismo.',
  },
  {
    label: 'Añadir negocio gratis',
    text: 'Claro que sí, te lo añado gratis al directorio. Mándame: nombre del negocio, dirección, teléfono, horario y 1 o 2 fotos. Con eso queda en CaboRojo.com y el Veci lo recomienda cuando pregunten.',
  },
  {
    label: 'Gracias por el dato',
    text: 'Gracias por el dato, eso es oro. Lo verifico y lo monto en el directorio. Si ves algo más así, mándamelo cuando quieras.',
  },
  {
    label: 'Evento recibido',
    text: 'Qué bueno. Mándame fecha, hora, lugar y un flyer o foto si tienes, y lo monto en el calendario de CaboRojo.com.',
  },
]

const claveDeBorrador = (id?: string | null) => `inbox-borrador-${id}`

function leerBorrador(id?: string | null) {
  try {
    return localStorage.getItem(claveDeBorrador(id)) || ''
  } catch {
    return ''
  }
}

function guardarBorrador(id: string | null | undefined, texto: string) {
  try {
    if (texto) localStorage.setItem(claveDeBorrador(id), texto)
    else localStorage.removeItem(claveDeBorrador(id))
  } catch {
    /* sin almacenamiento se sigue escribiendo igual */
  }
}

interface ComposeBarProps {
  onSend: (message: string) => Promise<void>
  conversationId?: string | null
  disabled?: boolean
}

export function ComposeBar({ onSend, conversationId, disabled }: ComposeBarProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Reset state when conversation changes; lo que quedó escrito vuelve.
  useEffect(() => {
    setSuggestions([])
    setShowTemplates(false)
    setSendError(null)
    setText(leerBorrador(conversationId))
  }, [conversationId])

  const cambiarTexto = useCallback((nuevo: string) => {
    setText(nuevo)
    guardarBorrador(conversationId, nuevo)
  }, [conversationId])

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setSendError(null)
    try {
      await onSend(trimmed)
      cambiarTexto('')
      setSuggestions([])
      setShowTemplates(false)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } catch (e: unknown) {
      setSendError(e instanceof Error ? e.message : 'No salió. Intenta otra vez.')
    } finally {
      setSending(false)
    }
  }, [text, sending, onSend, cambiarTexto])

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
    // En el teléfono, Enter es línea nueva; se envía con el botón.
    const esTactil = window.matchMedia('(pointer: coarse)').matches
    if (e.key === 'Enter' && !e.shiftKey && !esTactil) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    cambiarTexto(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  function pickSuggestion(s: string) {
    cambiarTexto(s)
    setSuggestions([])
    if (textareaRef.current) {
      textareaRef.current.focus()
      // Resize after content is set
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto'
          textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 160) + 'px'
        }
      }, 0)
    }
  }

  const opcion = 'w-full min-h-12 text-left px-3 py-2 bg-[#1e293b] hover:bg-[#334155] border border-[#475569] rounded-lg text-base text-[#f1f5f9] transition-colors'
  const boton = 'min-h-12 min-w-12 flex items-center justify-center bg-[#1e293b] border border-[#475569] text-[#e2e8f0] hover:text-white rounded-lg shrink-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'

  return (
    <div className="border-t border-[#334155] bg-[#0f172a] pb-[env(safe-area-inset-bottom)] shrink-0">
      {/* Error toast */}
      {sendError && (
        <div role="alert" className="mx-3 mt-2 px-3 py-2 bg-[#7f1d1d] rounded-lg flex items-center justify-between gap-2">
          <span className="text-base text-white">{sendError}</span>
          <button onClick={() => setSendError(null)} aria-label="Cerrar el error" className="min-h-12 min-w-12 text-white text-base">✕</button>
        </div>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="px-3 pt-3 pb-1 space-y-1.5 max-h-56 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-base text-[#cbd5e1]">Sugerencias</span>
            <button onClick={() => setSuggestions([])} className="min-h-12 px-2 text-base text-[#cbd5e1] hover:text-white">Cerrar</button>
          </div>
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => pickSuggestion(s)} className={opcion}>{s}</button>
          ))}
        </div>
      )}

      {/* Templates */}
      {showTemplates && (
        <div className="px-3 pt-3 pb-1 space-y-1.5 max-h-64 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <span className="text-base text-[#cbd5e1]">Respuestas rápidas</span>
            <button onClick={() => setShowTemplates(false)} className="min-h-12 px-2 text-base text-[#cbd5e1] hover:text-white">Cerrar</button>
          </div>
          {PITCH_TEMPLATES.map((t, i) => (
            <button key={i} onClick={() => { pickSuggestion(t.text); setShowTemplates(false) }} className={opcion}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Compose */}
      <div className="flex items-end gap-2 p-2">
        <button
          onClick={fetchSuggestions}
          disabled={!conversationId || loadingSuggestions || disabled}
          aria-label="Sugerir una respuesta"
          className={boton}
        >
          <Sparkles size={20} aria-hidden="true" />
        </button>
        <button
          onClick={() => setShowTemplates(!showTemplates)}
          disabled={disabled}
          aria-label="Respuestas rápidas"
          aria-expanded={showTemplates}
          className={boton}
        >
          <ListPlus size={20} aria-hidden="true" />
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          disabled={disabled || sending}
          placeholder="Escribe aquí"
          aria-label="Tu mensaje"
          rows={1}
          className="flex-1 min-w-0 min-h-12 bg-[#1e293b] text-[#f1f5f9] border border-[#475569] rounded-lg px-3 py-2.5 text-base resize-none focus:outline-none focus:border-[#38bdf8] placeholder:text-[#cbd5e1] disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className="min-h-12 px-4 bg-[#38bdf8] text-[#0f172a] rounded-lg text-base font-semibold hover:bg-[#7dd3fc] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
        >
          {sending ? 'Enviando' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
