'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import type { InboxConversation } from '@/lib/types'

export interface InboxFilters {
  attention?: boolean
  resolved?: boolean
  search?: string
}

type Pestana = 'atencion' | 'todo' | 'resueltos'

const PESTANAS: { id: Pestana; texto: string }[] = [
  { id: 'atencion', texto: 'Para ti' },
  { id: 'todo', texto: 'Todo' },
  { id: 'resueltos', texto: 'Resueltos' },
]

interface ConversationListProps {
  conversations: InboxConversation[]
  selectedId: string | null
  onSelect: (conv: InboxConversation) => void
  onFilterChange: (filters: InboxFilters) => void
}

function formatPhone(contact: string) {
  return contact.replace('whatsapp:', '').replace(/^\+1/, '')
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs} h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days} d`
  return new Date(iso).toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })
}

function filtrosDe(pestana: Pestana, search: string): InboxFilters {
  return {
    attention: pestana === 'atencion' || undefined,
    resolved: pestana === 'resueltos' || undefined,
    search: search || undefined,
  }
}

export function ConversationList({ conversations, selectedId, onSelect, onFilterChange }: ConversationListProps) {
  const [search, setSearch] = useState('')
  const [pestana, setPestana] = useState<Pestana>('atencion')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const montado = useRef(false)

  useEffect(() => {
    if (!montado.current) {
      montado.current = true
      return
    }
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onFilterChange(filtrosDe(pestana, search)), 300)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function cambiarPestana(siguiente: Pestana) {
    setPestana(siguiente)
    onFilterChange(filtrosDe(siguiente, search))
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="p-3 border-b border-[#334155] space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h1 className="text-xl font-semibold text-white">Inbox del 7711</h1>
          <Link
            href="/admin/inbox/compose"
            className="min-h-12 px-4 flex items-center rounded-lg bg-[#38bdf8] text-[#0f172a] text-base font-semibold hover:bg-[#7dd3fc]"
          >
            Mensaje nuevo
          </Link>
        </div>
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar nombre, teléfono o texto"
          aria-label="Buscar conversaciones"
          className="w-full min-h-12 bg-[#1e293b] text-[#f1f5f9] border border-[#475569] rounded-lg px-3 py-2 text-base focus:outline-none focus:border-[#38bdf8] placeholder:text-[#cbd5e1]"
        />
        <div className="grid grid-cols-3 gap-2" role="group" aria-label="Qué conversaciones ver">
          {PESTANAS.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => cambiarPestana(p.id)}
              aria-pressed={pestana === p.id}
              className={`min-h-12 rounded-lg text-base font-medium transition-colors ${
                pestana === p.id ? 'bg-[#38bdf8] text-[#0f172a]' : 'bg-[#1e293b] text-[#e2e8f0] hover:bg-[#334155]'
              }`}
            >
              {p.texto}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="text-center text-[#cbd5e1] text-base py-8 px-4">
            {pestana === 'atencion' ? 'Nada espera por ti.' : 'No hay conversaciones.'}
          </p>
        )}
        {conversations.map(conv => {
          const isSelected = conv.id === selectedId
          const phone = formatPhone(conv.contact)
          const name = conv.display_name || conv.place_name || phone
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              aria-current={isSelected ? 'true' : undefined}
              className={`w-full min-h-12 text-left px-4 py-3 border-b border-[#334155]/50 transition-colors ${
                isSelected ? 'bg-[#1e293b]' : 'hover:bg-[#1e293b]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-medium truncate text-white">{name}</span>
                    {conv.needs_human && !conv.resolved_at && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f87171] shrink-0" role="img" aria-label="Necesita atención" />
                    )}
                  </div>
                  <p className="text-base text-[#cbd5e1] truncate mt-0.5">
                    {conv.last_body
                      ? `${conv.last_direction === 'outbound' ? 'Salió: ' : ''}${conv.last_body}`
                      : '(sin mensaje)'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-base text-[#cbd5e1]">{timeAgo(conv.last_message_at)}</span>
                  <span className={`text-base ${conv.channel === 'whatsapp' ? 'text-[#4ade80]' : 'text-[#7dd3fc]'}`}>
                    {conv.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
