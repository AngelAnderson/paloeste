'use client'

import { useState, useCallback, useEffect } from 'react'
import type { InboxContact, InboxConversation } from '@/lib/types'

interface DemandData {
  total_queries: number
  categories: string[]
  recent_queries: string[]
}

interface ContactPanelProps {
  contact: InboxContact | null
  conversation: InboxConversation | null
  demandData?: DemandData | null
  onSaveContact: (conversationId: string, data: { name: string; notes: string }) => Promise<void>
  onClose?: () => void
}

export function ContactPanel({ contact, conversation, demandData, onSaveContact, onClose }: ContactPanelProps) {
  const [name, setName] = useState('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Sync state when conversation/contact changes
  useEffect(() => {
    setName(contact?.display_name || conversation?.display_name || '')
    setNotes(contact?.notes_internal || conversation?.internal_note || '')
    setSaved(false)
  }, [contact, conversation?.id, conversation?.display_name, conversation?.internal_note])

  const origName = contact?.display_name || conversation?.display_name || ''
  const origNotes = contact?.notes_internal || conversation?.internal_note || ''
  const hasChanges = name !== origName || notes !== origNotes

  const handleSave = useCallback(async () => {
    if (!conversation || !hasChanges) return
    setSaving(true)
    try {
      await onSaveContact(conversation.id, { name, notes })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } finally {
      setSaving(false)
    }
  }, [conversation, name, notes, hasChanges, onSaveContact])

  if (!conversation) {
    return (
      <div className="flex items-center justify-center h-full text-[#cbd5e1] text-base">
        Escoge una conversación
      </div>
    )
  }

  const phone = contact?.phone_e164 || conversation.contact.replace('whatsapp:', '')

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="p-4 border-b border-[#334155] flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Contacto</h3>
        {onClose && (
          <button onClick={onClose} aria-label="Cerrar" className="min-h-12 min-w-12 text-[#e2e8f0] hover:text-white text-xl">&times;</button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Editable Name */}
        <div>
          <p className="text-base text-[#cbd5e1] mb-1">Nombre</p>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Agregar nombre..."
            className="w-full bg-[#1e293b] text-white border border-[#475569] rounded-lg min-h-12 px-3 py-2 text-base focus:outline-none focus:border-[#38bdf8] placeholder:text-[#cbd5e1]"
          />
        </div>

        {/* Phone (read-only) */}
        <div>
          <p className="text-base text-[#cbd5e1] mb-1">Teléfono</p>
          <p className="text-[#e2e8f0] text-base">{phone}</p>
        </div>

        {/* Channel & Status */}
        <div className="flex gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded text-base font-medium bg-[#1e293b] text-[#e2e8f0]">
            {conversation.channel}
          </span>
          <span className={`px-2 py-0.5 rounded text-base font-medium ${
            conversation.needs_human ? 'bg-[#f87171]/20 text-[#f87171]' : 'bg-[#1e293b] text-[#e2e8f0]'
          }`}>
            {conversation.needs_human ? 'Necesita atención' : conversation.status || 'bot'}
          </span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 text-base">
          <div className="bg-[#1e293b] rounded-lg p-2">
            <p className="text-[#cbd5e1]">Mensajes</p>
            <p className="text-white font-medium">{conversation.message_count}</p>
          </div>
          <div className="bg-[#1e293b] rounded-lg p-2">
            <p className="text-[#cbd5e1]">Último tema</p>
            <p className="text-white font-medium text-base">{conversation.intent || conversation.last_intent || '-'}</p>
          </div>
        </div>

        {/* Demand data */}
        {demandData && demandData.total_queries > 0 && (
          <div>
            <p className="text-base text-[#cbd5e1] mb-1">Lo que ha buscado</p>
            <div className="bg-[#1e293b] rounded-lg p-3 space-y-2">
              <div className="flex justify-between text-base">
                <span className="text-[#cbd5e1]">Búsquedas</span>
                <span className="text-[#38bdf8] font-bold">{demandData.total_queries}</span>
              </div>
              {demandData.categories.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {demandData.categories.map(cat => (
                    <span key={cat} className="px-1.5 py-0.5 bg-[#fbbf24]/10 text-[#fbbf24] rounded text-base">{cat}</span>
                  ))}
                </div>
              )}
              {demandData.recent_queries.length > 0 && (
                <div className="space-y-1">
                  <p className="text-base text-[#cbd5e1]">Buscó:</p>
                  {demandData.recent_queries.map(q => (
                    <p key={q} className="text-base text-[#e2e8f0] italic">&ldquo;{q}&rdquo;</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tags */}
        {contact?.tags && contact.tags.length > 0 && (
          <div>
            <p className="text-base text-[#cbd5e1] mb-1">Tags</p>
            <div className="flex gap-1 flex-wrap">
              {contact.tags.map(tag => (
                <span key={tag} className="px-2 py-0.5 bg-[#38bdf8]/10 text-[#38bdf8] rounded text-base">{tag}</span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <p className="text-base text-[#cbd5e1] mb-1">Notas</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-[#1e293b] text-[#f1f5f9] border border-[#475569] rounded-lg min-h-12 px-3 py-2 text-base resize-none focus:outline-none focus:border-[#38bdf8] placeholder:text-[#cbd5e1]"
            placeholder="Agregar notas..."
          />
        </div>

        {/* Save button */}
        {(hasChanges || saved) && (
          <button
            onClick={handleSave}
            disabled={saving || saved || !hasChanges}
            className={`w-full min-h-12 px-3 py-2 rounded-lg text-base font-medium transition-colors ${
              saved
                ? 'bg-[#4ade80]/20 text-[#4ade80]'
                : 'bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] disabled:opacity-50'
            }`}
          >
            {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar'}
          </button>
        )}

      </div>
    </div>
  )
}
