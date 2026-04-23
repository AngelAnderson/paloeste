'use client'

import { useState } from 'react'
import { X, Save, Send, MessageSquare, Phone, Clock, ChevronRight } from 'lucide-react'
import type { Prospect } from '@/lib/types'

const STAGES = [
  { key: 'lead', label: 'Lead', color: '#64748b' },
  { key: 'contacted', label: 'Contacted', color: '#38bdf8' },
  { key: 'pitched', label: 'Pitched', color: '#fbbf24' },
  { key: 'negotiating', label: 'Negotiating', color: '#fb923c' },
  { key: 'won', label: 'Won', color: '#4ade80' },
  { key: 'lost', label: 'Lost', color: '#f87171' },
] as const

type ProspectStage = typeof STAGES[number]['key']

interface ProspectPanelProps {
  prospect?: Prospect | null
  onClose: () => void
  onSaved: () => void
}

export function ProspectPanel({ prospect, onClose, onSaved }: ProspectPanelProps) {
  const isNew = !prospect
  const [form, setForm] = useState({
    business_name: prospect?.business_name || '',
    contact_name: prospect?.contact_name || '',
    contact_phone: prospect?.contact_phone || '',
    contact_method: prospect?.contact_method || 'sms',
    stage: (prospect?.stage || 'lead') as string,
    proposed_plan: prospect?.proposed_plan || '',
    proposed_amount_cents: prospect?.proposed_amount_cents || null as number | null,
    notes: prospect?.notes || '',
    next_action: prospect?.next_action || '',
    next_action_date: prospect?.next_action_date?.split('T')[0] || '',
    place_id: prospect?.place_id || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showMessage, setShowMessage] = useState(false)
  const [msgBody, setMsgBody] = useState('')
  const [msgSending, setMsgSending] = useState(false)
  const [msgSent, setMsgSent] = useState(false)

  function set(key: string, value: string | number | null) {
    setForm(f => ({ ...f, [key]: value }))
  }

  // Normalize stage for display (closed_won → won, closed_lost → lost)
  const displayStage = form.stage.replace('closed_', '') as ProspectStage

  async function handleSave() {
    if (!form.business_name.trim()) {
      setError('Nombre del negocio requerido')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = isNew
        ? { ...form, proposed_amount_cents: form.proposed_amount_cents || undefined }
        : { id: prospect!.id, ...form, proposed_amount_cents: form.proposed_amount_cents || undefined }

      const res = await fetch('/api/admin/prospects', {
        method: isNew ? 'POST' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error guardando')
    } finally {
      setSaving(false)
    }
  }

  async function handleLogContact() {
    if (!prospect) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/prospects', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: prospect.id, last_contact_at: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Failed to log contact')
      onSaved()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setSaving(false)
    }
  }

  async function handleSendMessage(channel: 'sms' | 'whatsapp') {
    if (!form.contact_phone || !msgBody.trim()) return
    setMsgSending(true)
    try {
      const res = await fetch('/api/admin/send-outbound', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: form.contact_phone, body: msgBody.trim(), channel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Send failed')
      setMsgSent(true)
      // Also update last_contact_at
      if (prospect) {
        await fetch('/api/admin/prospects', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: prospect.id, last_contact_at: new Date().toISOString() }),
        })
      }
      setTimeout(() => { setShowMessage(false); setMsgSent(false); setMsgBody(''); onSaved() }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error enviando')
    } finally {
      setMsgSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={onClose}>
      <div
        className="bg-[#0f172a] border-l border-[#334155] w-full max-w-md h-full overflow-y-auto p-5 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{isNew ? 'Nuevo Prospecto' : form.business_name}</h2>
          <button onClick={onClose} className="text-[#64748b] hover:text-white cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Stage selector */}
        <div>
          <label className="text-xs text-[#64748b] uppercase tracking-wider mb-1 block">Stage</label>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map(s => (
              <button
                key={s.key}
                onClick={() => set('stage', s.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  displayStage === s.key
                    ? 'ring-2 ring-offset-1 ring-offset-[#0f172a]'
                    : 'opacity-50 hover:opacity-80'
                }`}
                style={{
                  backgroundColor: displayStage === s.key ? s.color + '30' : '#1e293b',
                  color: s.color,
                  ...(displayStage === s.key ? { '--tw-ring-color': s.color } as React.CSSProperties : {}),
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <Field label="Negocio" value={form.business_name} onChange={v => set('business_name', v)} />
          <Field label="Contacto" value={form.contact_name} onChange={v => set('contact_name', v)} placeholder="Nombre de la persona" />
          <Field label="Teléfono" value={form.contact_phone} onChange={v => set('contact_phone', v)} placeholder="+17871234567" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#64748b] mb-1 block">Plan</label>
              <select
                value={form.proposed_plan}
                onChange={e => set('proposed_plan', e.target.value)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38bdf8]"
              >
                <option value="">—</option>
                <option value="Vitrina Básica">Vitrina Básica — $799</option>
                <option value="Vitrina + Veci">Vitrina + Veci — $1,800</option>
                <option value="Boost 7 días">Boost 7 días — $29</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#64748b] mb-1 block">Monto ($)</label>
              <input
                type="number"
                value={form.proposed_amount_cents ? form.proposed_amount_cents / 100 : ''}
                onChange={e => set('proposed_amount_cents', e.target.value ? Math.round(parseFloat(e.target.value) * 100) : null)}
                className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38bdf8]"
                placeholder="799"
              />
            </div>
          </div>

          <Field label="Próxima acción" value={form.next_action} onChange={v => set('next_action', v)} />
          <div>
            <label className="text-xs text-[#64748b] mb-1 block">Fecha próxima acción</label>
            <input
              type="date"
              value={form.next_action_date}
              onChange={e => set('next_action_date', e.target.value)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38bdf8]"
            />
          </div>

          <div>
            <label className="text-xs text-[#64748b] mb-1 block">Notas</label>
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#38bdf8]"
            />
          </div>
        </div>

        {error && <p className="text-[#f87171] text-xs">{error}</p>}

        {/* Action buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Save size={14} />
            {saving ? 'Guardando...' : isNew ? 'Crear Prospecto' : 'Guardar Cambios'}
          </button>

          {!isNew && (
            <div className="flex gap-2">
              <button
                onClick={handleLogContact}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[#334155] hover:bg-[#475569] transition-colors cursor-pointer"
              >
                <Clock size={12} />
                Log Contact
              </button>
              <button
                onClick={() => setShowMessage(true)}
                disabled={!form.contact_phone}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30 disabled:opacity-50 transition-colors cursor-pointer"
              >
                <Send size={12} />
                Enviar Mensaje
              </button>
            </div>
          )}
        </div>

        {/* Inline message composer */}
        {showMessage && form.contact_phone && (
          <div className="border border-[#334155] rounded-xl p-4 space-y-3 bg-[#1e293b]">
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <Phone size={12} />
              <span>{form.contact_phone}</span>
            </div>
            <textarea
              value={msgBody}
              onChange={e => setMsgBody(e.target.value)}
              rows={3}
              placeholder="Escribe tu mensaje..."
              className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-sm resize-none focus:outline-none focus:border-[#38bdf8]"
            />
            {msgSent ? (
              <div className="text-center text-[#4ade80] font-medium text-sm py-1">Enviado ✓</div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => handleSendMessage('sms')}
                  disabled={msgSending || !msgBody.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[#334155] hover:bg-[#475569] disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <MessageSquare size={12} /> SMS
                </button>
                <button
                  onClick={() => handleSendMessage('whatsapp')}
                  disabled={msgSending || !msgBody.trim()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  <Send size={12} /> WhatsApp
                </button>
              </div>
            )}
          </div>
        )}

        {/* Metadata */}
        {!isNew && prospect && (
          <div className="text-[10px] text-[#475569] pt-2 border-t border-[#1e293b] space-y-0.5">
            <div>Created: {new Date(prospect.created_at).toLocaleDateString()}</div>
            {prospect.last_contact_at && (
              <div>Last contact: {new Date(prospect.last_contact_at).toLocaleDateString()}</div>
            )}
            <div>ID: {prospect.id}</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="text-xs text-[#64748b] mb-1 block">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#38bdf8]"
      />
    </div>
  )
}
