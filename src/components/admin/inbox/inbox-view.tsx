'use client'

import { useState, useCallback, useEffect } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import type { InboxConversation, InboxMessage, InboxContact } from '@/lib/types'
import { ConversationList } from './conversation-list'
import { MessageThread } from './message-thread'
import { ContactPanel } from './contact-panel'

interface InboxViewProps {
  initialConversations: InboxConversation[]
}

export function InboxView({ initialConversations }: InboxViewProps) {
  const [conversations, setConversations] = useState(initialConversations)
  const [selected, setSelected] = useState<InboxConversation | null>(null)
  const [messages, setMessages] = useState<InboxMessage[]>([])
  const [contact, setContact] = useState<InboxContact | null>(null)
  const [demandData, setDemandData] = useState<{ total_queries: number; categories: string[]; recent_queries: string[] } | null>(null)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [showContact, setShowContact] = useState(false)
  const [mobileView, setMobileView] = useState<'list' | 'thread'>('list')

  // Fetch messages when conversation is selected
  const selectConversation = useCallback(async (conv: InboxConversation) => {
    setSelected(conv)
    setMobileView('thread')
    setLoadingMessages(true)
    setMessages([])
    setContact(null)
    setDemandData(null)

    try {
      const phone = conv.contact.replace('whatsapp:', '')
      const res = await fetch(`/api/inbox/messages?conversationId=${conv.id}${conv.contact_id ? `&contactId=${conv.contact_id}` : ''}&phone=${encodeURIComponent(phone)}`)
      const data = await res.json()
      setMessages(data.messages || [])
      if (data.contact) setContact(data.contact)
      if (data.demandData) setDemandData(data.demandData)
    } catch (e) {
      console.error('Failed to load messages:', e)
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // Send message
  const handleSend = useCallback(async (body: string, channel?: string) => {
    if (!selected) return

    const to = selected.contact
    const sendChannel = channel || 'sms'

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
      throw new Error(err.error || err.details?.message || 'Error al enviar')
    }

    const result = await res.json()

    // Optimistically add message to thread
    const now = new Date().toISOString()
    const botNumber = '+17874177711'
    setMessages(prev => [...prev, {
      id: Date.now(),
      conversation_id: selected.id,
      direction: 'outbound',
      body,
      intent: 'manual_reply',
      source: 'admin',
      channel: sendChannel,
      from: botNumber,
      to,
      created_at: now,
      status: 'sent',
      error_code: null,
    }])

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

  // Update conversation status
  const handleUpdateStatus = useCallback(async (conversationId: string, status: string) => {
    await fetch('/api/inbox/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ conversationId, status }),
    })
    setSelected(prev => prev ? { ...prev, status } : null)
    setConversations(prev => prev.map(c => c.id === conversationId ? { ...c, status } : c))
  }, [])

  // Filter conversations
  const handleFilterChange = useCallback(async (filters: { needsHuman?: boolean; channel?: string; search?: string }) => {
    const params = new URLSearchParams()
    if (filters.needsHuman) params.set('needsHuman', '1')
    if (filters.channel) params.set('channel', filters.channel)
    if (filters.search) params.set('search', filters.search)

    try {
      const res = await fetch(`/api/inbox/conversations?${params}`)
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch (e) {
      console.error('Filter failed:', e)
    }
  }, [])

  // Realtime subscription
  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const channel = supabase
      .channel('inbox-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMsg = payload.new as any
        // If it's for the selected conversation, add it
        if (selected && newMsg.conversation_id === selected.id && newMsg.source !== 'admin') {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg as InboxMessage]
          })
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload) => {
        const updated = payload.new as any
        setConversations(prev => prev.map(c =>
          c.id === updated.id ? { ...c, last_message_at: updated.last_message_at, last_inbound_body: updated.last_inbound_body, message_count: updated.message_count, needs_human: updated.needs_human, last_body: updated.last_inbound_body || c.last_body } : c
        ))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [selected])

  const contactPhone = selected?.contact.replace('whatsapp:', '') || ''

  return (
    <div className="h-[calc(100vh-3.5rem)] lg:h-[calc(100vh-1.5rem)] flex">
      {/* Conversation List - hidden on mobile when viewing thread */}
      <div className={`w-full lg:w-80 lg:border-r lg:border-[#334155] shrink-0 ${
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
            onShowContact={() => setShowContact(true)}
            onBack={() => setMobileView('list')}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-[#64748b] text-sm">
            Selecciona una conversacion
          </div>
        )}
      </div>

      {/* Contact Panel - desktop only (mobile uses sheet) */}
      <div className="hidden lg:flex lg:flex-col w-72 border-l border-[#334155] shrink-0">
        <ContactPanel
          contact={contact}
          conversation={selected}
          demandData={demandData}
          onSaveContact={handleSaveContact}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      {/* Mobile contact sheet */}
      {showContact && selected && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowContact(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-80 max-w-[85vw]">
            <ContactPanel
              contact={contact}
              conversation={selected}
              demandData={demandData}
              onSaveContact={handleSaveContact}
              onUpdateStatus={handleUpdateStatus}
              onClose={() => setShowContact(false)}
            />
          </div>
        </div>
      )}
    </div>
  )
}
