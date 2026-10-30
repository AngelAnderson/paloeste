'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type { InboxConversation, InboxMessage, InboxContact } from '@/lib/types'
import { ConversationList, type InboxFilters } from './conversation-list'
import { MessageThread } from './message-thread'
import { ContactPanel } from './contact-panel'

interface InboxViewProps {
  initialConversations: InboxConversation[]
  initialSelected?: InboxConversation | null
  standalone?: boolean
}

// 30 oct 2026: reemplaza a Realtime. messages y conversations no se leen desde el navegador
// (RLS solo service_role), así que la suscripción nunca recibía nada.
const REFRESCO_MS = 15000

export function InboxView({ initialConversations, initialSelected = null, standalone = false }: InboxViewProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selected, setSelected] = useState<InboxConversation | null>(null)
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [contact, setContact] = useState<InboxContact | null>(null)
  const [demandData, setDemandData] = useState<{ total_queries: number; categories: string[]; recent_queries: string[] } | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')
  const [sinConexion, setSinConexion] = useState(false)
  const [nota, setNota] = useState<string | null>(null)
  const filtros = useRef<InboxFilters>({ attention: true })
  const abierta = useRef<InboxConversation | null>(null)

  // Sesión vencida: de vuelta al login, y al entrar regresa a esta misma pantalla.
  const pedir = useCallback(async (url: string) => {
    const res = await fetch(url)
    if (res.status === 401) {
      window.location.assign(`/admin/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`)
      throw new Error('sesion')
    }
    if (!res.ok) throw new Error('error')
    return res.json()
  }, [])

  const urlDeMensajes = (conv: InboxConversation) => {
    const phone = conv.contact.replace('whatsapp:', '')
    return `/api/inbox/messages?conversationId=${conv.id}${conv.contact_id ? `&contactId=${conv.contact_id}` : ''}&phone=${encodeURIComponent(phone)}`
  }

  const cargarLista = useCallback(async () => {
    const f = filtros.current
    const params = new URLSearchParams()
    if (f.attention) params.set('attention', '1')
    if (f.resolved) params.set('resolved', '1')
    if (f.search) params.set('search', f.search)
    const data = await pedir(`/api/inbox/conversations?${params}`)
    setConversations(data.conversations || [])
  }, [pedir])

  // Fetch messages when conversation is selected
  const selectConversation = useCallback(async (conv: InboxConversation) => {
    abierta.current = conv
    setSelected(conv)
    setMobileView('thread')
    setLoadingMessages(true)
    setMessages([])
    setContact(null)
    setDemandData(null)
    setNota(null)
    window.history.replaceState(null, '', `?c=${conv.id}`)

    try {
      const data = await pedir(urlDeMensajes(conv))
      setMessages(data.messages || [])
      if (data.contact) setContact(data.contact)
      if (data.demandData) setDemandData(data.demandData)
      setSinConexion(false)
    } catch (e) {
      if ((e as Error).message !== 'sesion') setSinConexion(true)
    } finally {
      setLoadingMessages(false)
    }
  }, [pedir])

  const volverALista = useCallback(() => {
    abierta.current = null
    setMobileView('list')
    window.history.replaceState(null, '', window.location.pathname)
  }, [])

  // El enlace de un aviso abre su conversación directo.
  const primeraCarga = useRef(initialSelected)
  useEffect(() => {
    if (primeraCarga.current) selectConversation(primeraCarga.current)
  }, [selectConversation])

  // Lo nuevo aparece solo mientras la pantalla está abierta, y al volver a ella.
  useEffect(() => {
    const refrescar = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        await cargarLista()
        if (abierta.current) {
          const data = await pedir(urlDeMensajes(abierta.current))
          setMessages(data.messages || [])
        }
        setSinConexion(false)
      } catch (e) {
        if ((e as Error).message !== 'sesion') setSinConexion(true)
      }
    }
    const reloj = setInterval(refrescar, REFRESCO_MS)
    document.addEventListener('visibilitychange', refrescar)
    return () => {
      clearInterval(reloj)
      document.removeEventListener('visibilitychange', refrescar)
    }
  }, [cargarLista, pedir])

  // Send message
  const handleSend = useCallback(async (body: string) => {
    if (!selected) return

    const to = selected.contact
    const sendChannel = selected.channel === 'whatsapp' ? 'whatsapp' : 'sms'

    const res = await fetch('/api/send-message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversationId: selected.id,
        body,
        to,
        channel: sendChannel,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const code = err.twilio_code ? ` [Twilio ${err.twilio_code}]` : ''
      throw new Error((err.error || err.details?.message || 'No salió. Intenta otra vez.') + code)
    }

    const result = await res.json()
    const channelUsed: 'whatsapp' | 'sms' = result.channel_used || sendChannel

    // Optimistically add message to thread (use post-fallback channel)
    const now = new Date().toISOString()
    const botNumber = '+17874177711'
    setMessages(prev => [...prev, {
      id: Date.now(),
      conversation_id: selected.id,
      direction: 'outbound',
      body,
      intent: 'manual_reply',
      source: 'admin',
      channel: channelUsed,
      from: botNumber,
      to,
      created_at: now,
      status: 'sent',
      error_code: null,
    }])

    setNota(result.fallback_reason || null)

    // Update conversation preview in list
    setConversations(prev => prev.map(c =>
      c.id === selected.id ? { ...c, last_body: body, last_direction: 'outbound', last_message_at: now } : c
    ))
  }, [selected])

  // Save contact name + notes
  const handleSaveContact = useCallback(async (conversationId: string, data: { name: string; notes: string }) => {
    await fetch('/api/inbox/contact', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, name: data.name, notes: data.notes }),
    })
    // Update local state
    setContact(prev => prev ? { ...prev, display_name: data.name, notes_internal: data.notes } : null)
    setSelected(prev => prev ? { ...prev, display_name: data.name, internal_note: data.notes } : null)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, display_name: data.name } : c))
  }, [])

  // Filter conversations
  const handleFilterChange = useCallback(async (nuevos: InboxFilters) => {
    filtros.current = nuevos
    try {
      await cargarLista()
      setSinConexion(false)
    } catch (e) {
      if ((e as Error).message !== 'sesion') setSinConexion(true)
    }
  }, [cargarLista])

  const contactPhone = selected?.contact.replace('whatsapp:', '') || ''
  const altura = standalone ? 'h-dvh' : 'h-[calc(100dvh-3.5rem)] lg:h-[calc(100dvh-1.5rem)]'

  return (
    <div className={`${altura} flex flex-col bg-[#0f172a] pt-[env(safe-area-inset-top)]`}>
      {sinConexion && (
        <p role="status" className="px-4 py-2 bg-[#78350f] text-white text-base shrink-0">
          Sin conexión. Lo que escribiste sigue guardado aquí.
        </p>
      )}
      <div className="flex-1 min-h-0 flex">
        {/* Conversation List - hidden on mobile when viewing thread */}
        <div className={`w-full lg:w-96 lg:border-r lg:border-[#334155] shrink-0 ${
          mobileView === 'thread' ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
        }`}>
          <ConversationList
            conversations={conversations}
            selectedId={selected?.id || null}
            onSelect={selectConversation}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Message Thread - hidden on mobile when viewing list */}
        <div className={`flex-1 min-w-0 ${
          mobileView === 'list' ? 'hidden lg:flex lg:flex-col' : 'flex flex-col'
        }`}>
          {selected ? (
            <MessageThread
              messages={messages}
              loading={loadingMessages}
              onSend={handleSend}
              contactName={selected.display_name || selected.place_name}
              contactPhone={contactPhone}
              conversationId={selected.id}
              conversation={selected}
              nota={nota}
              onShowContact={() => setShowContact(true)}
              onBack={volverALista}
              onFlagChanged={(_action, applied) => {
                // Reflect in selected + list state
                setSelected(prev => prev ? { ...prev, ...applied } as typeof prev : prev)
                setConversations(prev => prev.map(c => c.id === selected.id ? { ...c, ...applied } : c))
              }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-[#cbd5e1] text-base">
              Escoge una conversación
            </div>
          )}
        </div>

        {/* Contact Panel - desktop only (mobile uses sheet) */}
        <div className="hidden xl:flex xl:flex-col w-80 border-l border-[#334155] shrink-0">
          <ContactPanel
            contact={contact}
            conversation={selected}
            demandData={demandData}
            onSaveContact={handleSaveContact}
          />
        </div>
      </div>

      {/* Mobile contact sheet */}
      {showContact && selected && (
        <div className="xl:hidden fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Contacto">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowContact(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw]">
            <ContactPanel
              contact={contact}
              conversation={selected}
              demandData={demandData}
              onSaveContact={handleSaveContact}
              onClose={() => setShowContact(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
