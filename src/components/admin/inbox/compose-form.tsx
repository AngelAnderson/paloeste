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

const CAMPO = 'w-full min-h-12 bg-[#0f172a] text-white border border-[#475569] rounded-lg px-3 py-2 text-base focus:outline-none focus:border-[#38bdf8]'
const ETIQUETA = 'block text-base font-medium text-[#e2e8f0] mb-1'

export function ComposeForm({
  initialTo,
  initialBody,
  initialChannel,
  contactName,
  contactType,
  contactNotes,
  lastMessage,
  placeSlug,
}: Props) {
  const router = useRouter()
  const [to, setTo] = useState(initialTo)
  const [nombre, setNombre] = useState(contactName || '')
  const [body, setBody] = useState(initialBody)
  const [channel, setChannel] = useState<'whatsapp' | 'sms'>(initialChannel)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plantillaSalio, setPlantillaSalio] = useState(false)

  async function handleSend() {
    if (!to.trim() || !body.trim()) {
      setError('Falta el teléfono o el mensaje.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/send-outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: to.trim(), body: body.trim(), channel, name: nombre.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        const code = data.twilio_code ? ` [Twilio ${data.twilio_code}]` : ''
        throw new Error(`${data.error || 'No salió. Intenta otra vez.'}${code}`)
      }

      // Server auto-logs relationship contact when phone matches an active relationship,
      // so no client-side log call needed. Single source of truth = send-outbound route.

      // Lo escrito espera en la conversación hasta que la persona conteste.
      if (data.plantilla) {
        setPlantillaSalio(true)
        try {
          localStorage.setItem(`inbox-borrador-${data.conversationId}`, body.trim())
        } catch {
          /* sin almacenamiento, el texto queda en la pantalla */
        }
      }

      setSent(true)
      const delay = data.plantilla ? 5000 : 1500
      setTimeout(() => router.push('/admin/inbox'), delay)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No salió. Intenta otra vez.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="space-y-4 p-4 max-w-2xl mx-auto min-h-dvh bg-[#0f172a] text-white">
      <button
        type="button"
        onClick={() => router.push('/admin/inbox')}
        className="min-h-12 text-base text-[#7dd3fc] underline"
      >
        Volver al inbox
      </button>
      <h1 className="text-xl font-semibold">Mensaje nuevo</h1>

      {(contactNotes || lastMessage || placeSlug) && (
        <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 space-y-2">
          {contactType && <span className="text-base text-[#cbd5e1] capitalize">{contactType}</span>}
          {placeSlug && (
            <a
              href={`/negocio/${placeSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-base text-[#7dd3fc] hover:underline flex items-center gap-1"
            >
              Ver perfil <ExternalLink size={16} aria-hidden="true" />
            </a>
          )}
          {contactNotes && <p className="text-base text-[#e2e8f0] italic">{contactNotes}</p>}
          {lastMessage && (
            <p className="text-base text-[#cbd5e1] border-t border-[#334155] pt-2">
              Último mensaje: <span className="italic">{lastMessage.body.slice(0, 120)}{lastMessage.body.length > 120 ? '…' : ''}</span>
            </p>
          )}
        </div>
      )}

      <div>
        <label htmlFor="to" className={ETIQUETA}>Teléfono</label>
        <input id="to" type="tel" autoComplete="off" value={to} onChange={(e) => setTo(e.target.value)} placeholder="787-555-1234" className={CAMPO} />
      </div>

      <div>
        <label htmlFor="nombre" className={ETIQUETA}>Nombre</label>
        <input id="nombre" type="text" autoComplete="off" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Richie" className={CAMPO} />
      </div>

      <div role="group" aria-label="Canal">
        <p className={ETIQUETA}>Canal</p>
        <div className="flex gap-2">
          <button
            type="button"
            aria-pressed={channel === 'whatsapp'}
            onClick={() => setChannel('whatsapp')}
            className={`flex-1 min-h-12 px-3 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${
              channel === 'whatsapp' ? 'bg-[#166534] text-white' : 'bg-[#1e293b] text-[#e2e8f0] hover:bg-[#334155]'
            }`}
          >
            <MessageSquare size={18} className="inline mr-1" aria-hidden="true" /> WhatsApp
          </button>
          <button
            type="button"
            aria-pressed={channel === 'sms'}
            onClick={() => setChannel('sms')}
            className={`flex-1 min-h-12 px-3 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${
              channel === 'sms' ? 'bg-[#075985] text-white' : 'bg-[#1e293b] text-[#e2e8f0] hover:bg-[#334155]'
            }`}
          >
            <Phone size={18} className="inline mr-1" aria-hidden="true" /> SMS
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="mensaje" className={ETIQUETA}>Mensaje</label>
        <textarea
          id="mensaje"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={8}
          className="w-full bg-[#0f172a] text-white border border-[#475569] rounded-lg p-3 text-base resize-none focus:outline-none focus:border-[#38bdf8]"
        />
      </div>

      <p className="text-base text-[#cbd5e1]">
        Si la persona nunca te ha escrito, primero sale un saludo aprobado por WhatsApp. Cuando conteste, tu mensaje te espera en su conversación.
      </p>

      {error && <p role="alert" className="text-[#fca5a5] text-base">{error}</p>}

      {sent ? (
        <div role="status" className="flex flex-col items-center gap-1 text-white font-medium py-3 bg-[#166534] rounded-lg text-base">
          <span className="flex items-center gap-2"><Check size={18} aria-hidden="true" /> Salió desde el 7711</span>
          {plantillaSalio && <span className="px-3 text-center">Salió el saludo. Te aviso cuando conteste.</span>}
        </div>
      ) : (
        <button
          onClick={handleSend}
          disabled={sending || !to.trim() || !body.trim()}
          className="w-full min-h-12 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-base font-bold bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] disabled:opacity-50 transition-colors cursor-pointer"
        >
          <Send size={18} aria-hidden="true" /> {sending ? 'Enviando' : 'Enviar'}
        </button>
      )}
    </div>
  )
}
