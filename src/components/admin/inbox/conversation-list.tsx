'use client'

import { useState, useRef, useEffect } from 'react'
import type { InboxConversation } from '@/lib/types'

interface ConversationListProps {
  conversations: InboxConversation[]
  selectedId: string | null
  onSelect: (conv: InboxConversation) => void
  onFilterChange: (filters: { needsHuman?: boolean; channel?: string; search?: string }) => void
}

function formatPhone(contact: string) {
  return contact.replace('whatsapp:', '').replace(/^\+1/, '')
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d`
  return new Date(iso).toLocaleDateString('es-PR', { month: 'short', day: 'numeric' })
}

export function ConversationList({ conversations, selectedId, onSelect, onFilterChange }: ConversationListProps) {
  const [search, setSearch] = useState('')
  const [filterHuman, setFilterHuman] = useState(false)
  const [filterChannel, setFilterChannel] = useState<string>('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Debounce search to avoid hammering the API on every keystroke
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChange({
        search: search || undefined,
        needsHuman: filterHuman || undefined,
        channel: filterChannel || undefined,
      })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  function handleSearch(val: string) {
    setSearch(val)
  }

  function toggleHuman() {
    const next = !filterHuman
    setFilterHuman(next)
    onFilterChange({ search: search || undefined, needsHuman: next || undefined, channel: filterChannel || undefined })
  }

  function handleChannel(val: string) {
    setFilterChannel(val)
    onFilterChange({ search: search || undefined, needsHuman: filterHuman || undefined, channel: val || undefined })
  }

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="p-3 border-b border-[#334155] space-y-2">
        <h2 className="text-sm font-semibold text-white">Inbox</h2>
        <input
          type="text"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          placeholder="Buscar nombre, telefono, texto..."
          className="w-full bg-[#1e293b] text-[#f1f5f9] border border-[#334155] rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-[#38bdf8] placeholder:text-[#64748b]"
        />
        <div className="flex gap-1.5">
          <button
            onClick={toggleHuman}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
              filterHuman ? 'bg-[#f87171]/20 text-[#f87171]' : 'bg-[#1e293b] text-[#64748b] hover:text-[#94a3b8]'
            }`}
          >
            Needs Human
          </button>
          <select
            value={filterChannel}
            onChange={e => handleChannel(e.target.value)}
            className="bg-[#1e293b] text-[#94a3b8] border-none rounded text-[10px] px-1.5 py-0.5 focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="sms">SMS</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="text-center text-[#64748b] text-xs py-8">No hay conversaciones</p>
        )}
        {conversations.map(conv => {
          const isSelected = conv.id === selectedId
          const phone = formatPhone(conv.contact)
          const name = conv.display_name || phone
          return (
            <button
              key={conv.id}
              onClick={() => onSelect(conv)}
              className={`w-full text-left px-3 py-3 border-b border-[#334155]/50 transition-colors ${
                isSelected ? 'bg-[#1e293b]' : 'hover:bg-[#1e293b]/50'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-white truncate">{name}</span>
                    {conv.needs_human && (
                      <span className="w-2 h-2 rounded-full bg-[#f87171] shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-[#64748b] truncate mt-0.5">
                    {conv.last_inbound_body || '(sin mensaje)'}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] text-[#64748b]">{timeAgo(conv.last_message_at)}</span>
                  <span className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    conv.channel === 'whatsapp' ? 'bg-[#4ade80]/10 text-[#4ade80]' : 'bg-[#38bdf8]/10 text-[#38bdf8]'
                  }`}>
                    {conv.channel === 'whatsapp' ? 'WA' : 'SMS'}
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
