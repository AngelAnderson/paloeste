'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Send, ChevronDown, Sparkles, Plus, Copy, Check, Archive, ArrowRight } from 'lucide-react'
import { SendMessageModal } from '@/components/admin/send-message-modal'
import { ARCHETYPES, buildPlanMessage, TIER_META, CAMPAIGN_STATUS_META, type CampaignIdea } from '@/lib/campaigns'
import type { ConversionOpportunity } from '@/lib/types'

interface PlanModal {
  businessName: string
  phone: string | null
  message: string
}

const FILTERS = ['activas', 'idea', 'lista', 'pitched', 'won', 'archived'] as const
type Filter = typeof FILTERS[number]

export function CampanasView({
  opportunities,
  phones,
  ideas,
}: {
  opportunities: ConversionOpportunity[]
  phones: Record<string, string | null>
  ideas: CampaignIdea[]
}) {
  const router = useRouter()
  const [modal, setModal] = useState<PlanModal | null>(null)
  const [filter, setFilter] = useState<Filter>('activas')
  const [showNew, setShowNew] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  async function patchIdea(id: string, updates: Record<string, unknown>) {
    setBusy(id)
    try {
      await fetch('/api/admin/campaigns', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      })
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  function copyDraft(idea: CampaignIdea) {
    if (!idea.draft) return
    navigator.clipboard.writeText(idea.draft)
    setCopied(idea.id)
    setTimeout(() => setCopied(null), 1500)
  }

  function sendIdea(idea: CampaignIdea) {
    setModal({
      businessName: idea.business_name || idea.title,
      phone: idea.place_id ? phones[idea.place_id] || null : null,
      message: idea.draft || idea.hook || '',
    })
  }

  function planFromDemand(o: ConversionOpportunity) {
    setModal({
      businessName: o.name,
      phone: phones[o.place_id] || null,
      message: buildPlanMessage({
        businessName: o.name,
        campaignName: 'Campaña de Resultado',
        hook: 'Te mando clientes que ya te están buscando — no posts sueltos.',
        demand: { leadCount: o.lead_count, category: o.category || 'tu categoría' },
      }),
    })
  }

  const visible = ideas.filter(i =>
    filter === 'activas' ? i.status !== 'archived' && i.status !== 'won' : i.status === filter
  )

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-xl font-bold">🎬 Campañas</h1>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
        >
          <Plus size={13} />
          Nueva idea
        </button>
      </div>
      <p className="text-[#64748b] text-sm mb-6">
        Vendemos campañas con meta, no publicaciones. Las ideas no se pierden: viven aquí hasta que el timing vuelva.
      </p>

      {/* ── Banco de Campañas (persistente, reusable) ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <h2 className="text-sm font-semibold text-[#fbbf24] uppercase tracking-wider">🏦 Banco de Campañas</h2>
          <span className="text-[11px] text-[#475569]">cada una con su POR QUÉ AHORA</span>
          <div className="flex gap-1 ml-auto">
            {FILTERS.map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                  filter === f ? 'bg-[#fbbf24]/15 text-[#fbbf24]' : 'text-[#64748b] hover:text-white'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 text-sm text-[#64748b]">
            Nada en este filtro.
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(idea => {
              const tier = TIER_META[idea.tier] || TIER_META.custom
              const st = CAMPAIGN_STATUS_META[idea.status] || CAMPAIGN_STATUS_META.idea
              const arch = ARCHETYPES.find(a => a.id === idea.archetype)
              const phone = idea.place_id ? phones[idea.place_id] : null
              return (
                <div key={idea.id} className="rounded-xl border border-[#334155] bg-[#1e293b] p-4">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold text-sm text-white">{idea.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: tier.color + '22', color: tier.color }}>
                      {tier.label}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: st.color + '18', color: st.color }}>
                      {st.label}
                    </span>
                    {arch && <span className="text-[10px] text-[#64748b]">{arch.emoji} {arch.name}</span>}
                  </div>
                  {idea.business_name && (
                    <p className="text-xs text-[#94a3b8] mb-1">{idea.business_name}</p>
                  )}
                  {idea.trigger_reason && (
                    <p className="text-xs text-[#fb923c] mb-1">
                      ⏰ <span className="text-[#64748b]">Por qué ahora:</span> {idea.trigger_reason}
                      {idea.trigger_window && <span className="text-[#64748b]"> · {idea.trigger_window}</span>}
                    </p>
                  )}
                  {idea.hook && <p className="text-xs text-[#cbd5e1] italic mb-2">{idea.hook}</p>}
                  {idea.plan && (
                    <details className="mb-2">
                      <summary className="text-[11px] text-[#fbbf24] cursor-pointer select-none hover:text-[#fde68a] font-semibold">📋 Plan de ataque</summary>
                      <p className="text-xs text-[#cbd5e1] whitespace-pre-wrap bg-[#0f172a] border border-[#fbbf24]/30 rounded-lg p-3 mt-1">{idea.plan}</p>
                    </details>
                  )}
                  {Array.isArray(idea.copy_bank) && idea.copy_bank.length > 0 && (
                    <details className="mb-2">
                      <summary className="text-[11px] text-[#4ade80] cursor-pointer select-none hover:text-[#86efac] font-semibold">
                        📝 Mes 1 ya escrito ({idea.copy_bank.length} posts)
                      </summary>
                      <div className="bg-[#0f172a] border border-[#4ade80]/30 rounded-lg p-3 mt-1 space-y-3">
                        {idea.copy_bank.map(c => (
                          <div key={c.semana}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[10px] font-bold uppercase text-[#4ade80]">Semana {c.semana} · {c.angulo}</span>
                              <button
                                onClick={() => { navigator.clipboard.writeText(c.texto); setCopied(`${idea.id}-s${c.semana}`); setTimeout(() => setCopied(null), 1500) }}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#334155] hover:bg-[#475569] text-[#94a3b8] transition-colors cursor-pointer"
                              >
                                {copied === `${idea.id}-s${c.semana}` ? <Check size={9} className="text-[#4ade80]" /> : <Copy size={9} />}
                                {copied === `${idea.id}-s${c.semana}` ? 'Copiado' : 'Copiar'}
                              </button>
                            </div>
                            <p className="text-xs text-[#cbd5e1] whitespace-pre-wrap">{c.texto}</p>
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                  {Array.isArray(idea.history) && idea.history.length > 0 && (
                    <details className="mb-2">
                      <summary className="text-[11px] text-[#94a3b8] cursor-pointer select-none hover:text-white font-semibold">
                        🕓 Historia ({idea.history.length})
                      </summary>
                      <ul className="bg-[#0f172a] border border-[#334155] rounded-lg p-3 mt-1 space-y-1">
                        {idea.history.map((h, i) => (
                          <li key={i} className="text-xs text-[#94a3b8]">
                            <span className="text-[#64748b] font-mono">{h.fecha}</span> · {h.evento}
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <a
                      href={`/admin/campanas/${idea.id}/plan`}
                      target="_blank"
                      className="text-[11px] text-[#38bdf8] hover:text-[#7dd3fc] font-semibold"
                    >
                      📄 One-pager (imprimir/PDF)
                    </a>
                    {Array.isArray(idea.assets) && idea.assets.map((a, i) => (
                      <a key={i} href={a.href} target="_blank" className="text-[11px] text-[#38bdf8] hover:text-[#7dd3fc]">
                        📎 {a.label}
                      </a>
                    ))}
                  </div>
                  {idea.draft && (
                    <details className="mb-2">
                      <summary className="text-[11px] text-[#64748b] cursor-pointer select-none hover:text-[#94a3b8]">ver draft completo</summary>
                      <p className="text-xs text-[#94a3b8] whitespace-pre-wrap bg-[#0f172a] border border-[#334155] rounded-lg p-3 mt-1">{idea.draft}</p>
                    </details>
                  )}
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {idea.draft && (
                      <button
                        onClick={() => copyDraft(idea)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#334155] hover:bg-[#475569] text-[#94a3b8] transition-colors cursor-pointer"
                      >
                        {copied === idea.id ? <Check size={11} className="text-[#4ade80]" /> : <Copy size={11} />}
                        {copied === idea.id ? 'Copiado' : 'Copiar'}
                      </button>
                    )}
                    {idea.draft && (
                      <button
                        onClick={() => sendIdea(idea)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30 transition-colors cursor-pointer"
                      >
                        <Send size={11} />
                        Enviar{phone ? '' : ' (sin tel)'}
                      </button>
                    )}
                    {st.next && (
                      <button
                        disabled={busy === idea.id}
                        onClick={() => patchIdea(idea.id, { status: st.next })}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#38bdf8]/15 text-[#38bdf8] hover:bg-[#38bdf8]/25 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ArrowRight size={11} />
                        {CAMPAIGN_STATUS_META[st.next].label.replace(/^[^\s]+ /, '')}
                      </button>
                    )}
                    {idea.status !== 'archived' && (
                      <button
                        disabled={busy === idea.id}
                        onClick={() => patchIdea(idea.id, { status: 'archived' })}
                        className="ml-auto flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] text-[#64748b] hover:text-[#94a3b8] transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <Archive size={11} />
                      </button>
                    )}
                  </div>
                  <IdeaFeedback
                    idea={idea}
                    saving={busy === idea.id}
                    onSave={(text) => patchIdea(idea.id, { feedback: text, feedback_at: new Date().toISOString() })}
                  />
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Qualifies NOW (live bot demand) ── */}
      <section className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} className="text-[#f87171]" />
          <h2 className="text-sm font-semibold text-[#f87171] uppercase tracking-wider">Califican hoy para Campaña de Resultado</h2>
        </div>
        <p className="text-xs text-[#64748b] mb-3">
          Negocios con demanda real en *7711 (3+ leads) que aún no pagan. La data ya prueba que la gente los busca.
        </p>
        {opportunities.length === 0 ? (
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5 text-sm text-[#64748b]">
            Ahora mismo ningún negocio cruza el umbral de 3+ leads sin cobrar.
          </div>
        ) : (
          <div className="space-y-2">
            {opportunities.slice(0, 10).map((o) => (
              <div
                key={o.place_id}
                className="flex items-center gap-3 rounded-xl border border-[#334155] bg-[#1e293b] p-3"
              >
                <div className="flex-1 min-w-0">
                  <Link href={`/admin/editar/${o.place_id}`} className="font-semibold text-sm text-white hover:text-[#38bdf8] truncate">
                    {o.name}
                  </Link>
                  <p className="text-xs text-[#94a3b8] truncate">
                    {o.category} · <span className="text-[#4ade80]">{o.lead_count} leads gratis</span> · valor ${(o.total_value_cents / 100).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => planFromDemand(o)}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
                >
                  <Send size={13} />
                  Generar plan
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── The 6 archetypes (reference) ── */}
      <section>
        <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Los 6 arquetipos</h2>
        <div className="space-y-2">
          {ARCHETYPES.map((a) => (
            <details key={a.id} className="group rounded-xl border border-[#334155] bg-[#1e293b] overflow-hidden">
              <summary className="flex items-center gap-2 px-4 py-3 cursor-pointer list-none select-none hover:bg-[#243349] transition-colors">
                <ChevronDown size={14} className="text-[#64748b] transition-transform group-open:rotate-180" />
                <span style={{ color: a.accent }}>{a.emoji}</span>
                <span className="text-sm font-medium text-white">{a.name}</span>
                <span className="ml-auto text-xs text-[#64748b]">{a.tier}</span>
              </summary>
              <div className="px-4 pb-4 pt-1 text-xs text-[#94a3b8] space-y-1">
                <p><span className="text-[#64748b]">Siente:</span> “{a.feels}”</p>
                <p><span className="text-[#64748b]">Mecanismo:</span> {a.mechanism}</p>
                <p><span className="text-[#64748b]">Meta:</span> {a.metric}</p>
                <p><span className="text-[#64748b]">Fits:</span> {a.fits}</p>
              </div>
            </details>
          ))}
        </div>
      </section>

      {modal && (
        <SendMessageModal
          businessName={modal.businessName}
          phone={modal.phone}
          defaultMessage={modal.message}
          onClose={() => setModal(null)}
        />
      )}

      {showNew && <NewIdeaModal onClose={() => { setShowNew(false); router.refresh() }} />}
    </div>
  )
}

function IdeaFeedback({
  idea,
  saving,
  onSave,
}: {
  idea: CampaignIdea
  saving: boolean
  onSave: (text: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(idea.feedback || '')

  if (!editing) {
    return (
      <div className="mt-2 pt-2 border-t border-[#334155]/60">
        {idea.feedback ? (
          <div className="flex items-start gap-2">
            <p className="flex-1 text-xs text-[#a5b4fc] whitespace-pre-wrap">
              💬 <span className="text-[#64748b]">Feedback de Angel:</span> {idea.feedback}
              {idea.feedback_at && (
                <span className="text-[#475569]"> · {new Date(idea.feedback_at).toLocaleDateString('es-PR', { day: 'numeric', month: 'short' })}</span>
              )}
            </p>
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 text-[11px] text-[#64748b] hover:text-[#94a3b8] cursor-pointer"
            >
              editar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="text-[11px] text-[#64748b] hover:text-[#a5b4fc] cursor-pointer"
          >
            💬 Dejar feedback pa&apos; Claude…
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="mt-2 pt-2 border-t border-[#334155]/60 space-y-2">
      <textarea
        autoFocus
        rows={3}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Qué cambiar, qué no te cuadra, qué falta… Claude lo lee en la próxima sesión."
        className="w-full bg-[#0f172a] border border-[#6366f1]/40 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1] placeholder:text-[#475569]"
      />
      <div className="flex gap-2">
        <button
          disabled={saving}
          onClick={() => { onSave(text.trim()); setEditing(false) }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#6366f1]/25 text-[#a5b4fc] hover:bg-[#6366f1]/40 transition-colors cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Guardando…' : 'Guardar feedback'}
        </button>
        <button
          onClick={() => { setText(idea.feedback || ''); setEditing(false) }}
          className="px-3 py-1.5 rounded-lg text-xs text-[#64748b] hover:text-[#94a3b8] cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function NewIdeaModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', business_name: '', tier: '799', archetype: '', hook: '', draft: '', trigger_reason: '', trigger_window: '' })
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!form.title.trim()) return
    setSaving(true)
    try {
      await fetch('/api/admin/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const inputCls = 'w-full bg-[#0f172a] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#38bdf8] placeholder:text-[#475569]'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1e293b] border border-[#334155] rounded-xl w-full max-w-lg p-5 space-y-3 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="font-bold text-sm text-white">Nueva idea de campaña</h3>
        <input className={inputCls} placeholder="Título *" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
        <input className={inputCls} placeholder="Negocio (opcional)" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} />
        <div className="flex gap-2">
          <select className={inputCls} value={form.tier} onChange={e => setForm({ ...form, tier: e.target.value })}>
            <option value="799">$799</option>
            <option value="1800">$1,800</option>
            <option value="5000">$5,000</option>
            <option value="renewal">Retención</option>
            <option value="custom">Custom</option>
          </select>
          <select className={inputCls} value={form.archetype} onChange={e => setForm({ ...form, archetype: e.target.value })}>
            <option value="">Arquetipo…</option>
            {ARCHETYPES.map(a => <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
          </select>
        </div>
        <input className={inputCls} placeholder="⏰ Por qué AHORA (noticia, temporada, data)" value={form.trigger_reason} onChange={e => setForm({ ...form, trigger_reason: e.target.value })} />
        <input className={inputCls} placeholder="Ventana (ej. Jun-Nov 2026)" value={form.trigger_window} onChange={e => setForm({ ...form, trigger_window: e.target.value })} />
        <textarea className={inputCls} rows={2} placeholder="Hook / ángulo" value={form.hook} onChange={e => setForm({ ...form, hook: e.target.value })} />
        <textarea className={inputCls} rows={4} placeholder="Draft completo (WhatsApp-ready)" value={form.draft} onChange={e => setForm({ ...form, draft: e.target.value })} />
        <div className="flex gap-2 pt-1">
          <button onClick={onClose} className="flex-1 px-4 py-2 rounded-lg text-sm bg-[#334155] hover:bg-[#475569] text-[#94a3b8] transition-colors cursor-pointer">Cancelar</button>
          <button onClick={save} disabled={saving || !form.title.trim()} className="flex-1 px-4 py-2 rounded-lg text-sm font-semibold bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] disabled:opacity-50 transition-colors cursor-pointer">
            {saving ? 'Guardando…' : 'Guardar idea'}
          </button>
        </div>
      </div>
    </div>
  )
}
