'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Send, ChevronRight } from 'lucide-react'
import { SendMessageModal } from '@/components/admin/send-message-modal'
import type { Bandejas, BandejaItem } from '@/lib/bandejas'

const MANIFIESTO = [
  'AJORÁO NO ES UN PLAN. ES UNA SEÑAL.',
  'Cuando vives reaccionando, tu día no es tuyo.',
  'Que el día trabaje para mí.',
  '"Pa\'lante siempre, pa\'lante" no es plan. Es gasolina sin guía.',
  'Primero va lo que cambia el día. Lo demás que espere.',
]

const TRAYS: { key: keyof Bandejas; emoji: string; label: string; hint: string }[] = [
  { key: 'dinero', emoji: '💰', label: 'DINERO', hint: 'vende, cobra, oportunidad' },
  { key: 'paz', emoji: '🕊️', label: 'PAZ', hint: 'evita revolú, atraso, desgaste' },
  { key: 'futuro', emoji: '🏗️', label: 'FUTURO', hint: 'activos que trabajan sin ti' },
  { key: 'delegar', emoji: '🤝', label: 'DELEGAR', hint: 'AI, sistema, Noelia — draft listo' },
  { key: 'despues', emoji: '💡', label: 'DESPUÉS', hint: 'bueno pero no urge' },
]

function AgeBadge({ days }: { days?: number }) {
  if (days == null || days < 7) return null
  const cls = days >= 30
    ? 'bg-[#f87171]/20 text-[#f87171]'
    : days >= 14
      ? 'bg-[#fbbf24]/20 text-[#fbbf24]'
      : 'bg-[#334155] text-[#94a3b8]'
  const emoji = days >= 30 ? '🔴' : days >= 14 ? '🟡' : '⏳'
  return (
    <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full tabular-nums ${cls}`}>
      {emoji} {days}d
    </span>
  )
}

export function BandejasView({ bandejas }: { bandejas: Bandejas }) {
  const [modal, setModal] = useState<{ name: string; phone: string | null; message: string } | null>(null)

  const laUna = bandejas.hoy[0]
  const fecha = new Date().toLocaleDateString('es-PR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'America/Puerto_Rico' })

  function act(item: BandejaItem) {
    if (item.phone) {
      setModal({ name: item.title, phone: item.phone, message: item.draftMessage || '' })
    }
  }

  return (
    <div className="max-w-3xl">
      <div className="mb-1 flex items-baseline justify-between gap-3">
        <h1 className="text-xl font-bold">HOY · Las 6 Bandejas</h1>
        <span className="text-xs text-[#64748b] capitalize">{fecha}</span>
      </div>

      <details className="mb-4 group">
        <summary className="text-[11px] text-[#475569] cursor-pointer list-none select-none hover:text-[#64748b]">
          {MANIFIESTO[0]} <span className="group-open:hidden">···</span>
        </summary>
        <div className="text-[11px] text-[#475569] italic mt-1 space-y-0.5">
          {MANIFIESTO.slice(1).map(l => <p key={l}>{l}</p>)}
        </div>
      </details>

      {laUna && (
        <div className="mb-5 rounded-xl border border-[#38bdf8]/40 bg-[#38bdf8]/5 p-4">
          <div className="text-[11px] text-[#38bdf8] uppercase tracking-wider mb-1">Si solo haces 1 cosa hoy</div>
          <div className="flex items-center gap-3 flex-wrap">
            {laUna.href ? (
              <Link href={laUna.href} className="font-bold text-white hover:text-[#38bdf8] transition-colors">{laUna.title}</Link>
            ) : (
              <span className="font-bold text-white">{laUna.title}</span>
            )}
            <AgeBadge days={laUna.ageDays} />
            {laUna.phone ? (
              <button
                onClick={() => act(laUna)}
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
              >
                <Send size={12} />
                {laUna.cta || 'Mensaje'}
              </button>
            ) : laUna.href ? (
              <Link
                href={laUna.href}
                className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors"
              >
                {laUna.cta || 'Ver'}
                <ChevronRight size={12} />
              </Link>
            ) : null}
          </div>
          {laUna.costo && <p className="text-xs text-[#f87171] mt-1">{laUna.costo}</p>}
        </div>
      )}

      {/* 🔥 HOY — máx 3 */}
      <section className="mb-6">
        <div className="flex items-baseline gap-2 mb-2">
          <h2 className="text-sm font-semibold text-[#f87171] uppercase tracking-wider">🔥 HOY</h2>
          <span className="text-[11px] text-[#475569]">máx 3 — lo que cambia el día</span>
        </div>
        {bandejas.hoy.length === 0 ? (
          <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-6 text-center text-sm text-[#94a3b8]">
            🎉 Nada urgente. El día es tuyo.
          </div>
        ) : (
          <div className="space-y-2">
            {bandejas.hoy.map((item, idx) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-[#334155] bg-[#1e293b] p-3">
                <span className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold bg-[#f87171]/20 text-[#f87171]">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {item.href ? (
                      <Link href={item.href} className="font-semibold text-sm text-white hover:text-[#38bdf8] transition-colors">
                        {item.title}
                      </Link>
                    ) : (
                      <span className="font-semibold text-sm text-white">{item.title}</span>
                    )}
                    <AgeBadge days={item.ageDays} />
                  </div>
                  <p className="text-xs text-[#94a3b8] truncate">{item.detail}</p>
                  {item.costo && <p className="text-[11px] text-[#f87171]">{item.costo}</p>}
                </div>
                {item.phone ? (
                  <button
                    onClick={() => act(item)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-[#38bdf8] text-[#0f172a] hover:bg-[#7dd3fc] transition-colors cursor-pointer"
                  >
                    <Send size={13} />
                    {item.cta || 'Mensaje'}
                  </button>
                ) : item.href ? (
                  <Link
                    href={item.href}
                    className="shrink-0 flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold bg-[#334155] text-[#94a3b8] hover:text-white transition-colors"
                  >
                    {item.cta || 'Ver'}
                    <ChevronRight size={13} />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Las otras 5 bandejas */}
      <div className="space-y-4">
        {TRAYS.map(tray => {
          const items = bandejas[tray.key]
          if (items.length === 0) return null
          return (
            <section key={tray.key}>
              <div className="flex items-baseline gap-2 mb-2">
                <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider">{tray.emoji} {tray.label}</h2>
                <span className="text-[11px] text-[#475569]">{tray.hint}</span>
              </div>
              <div className="rounded-xl border border-[#334155] bg-[#1e293b] divide-y divide-[#283548]">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 p-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.href ? (
                          <Link href={item.href} className="font-medium text-sm text-white hover:text-[#38bdf8] transition-colors">
                            {item.title}
                          </Link>
                        ) : (
                          <span className="font-medium text-sm text-white">{item.title}</span>
                        )}
                        <AgeBadge days={item.ageDays} />
                        {item.amountCents != null && item.amountCents > 0 && (
                          <span className="text-xs font-bold text-[#4ade80] tabular-nums">${Math.round(item.amountCents / 100).toLocaleString()}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#94a3b8] truncate">{item.detail}</p>
                      {item.costo && <p className="text-[11px] text-[#fbbf24]">{item.costo}</p>}
                    </div>
                    {item.phone ? (
                      <button
                        onClick={() => act(item)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#22c55e]/20 text-[#4ade80] hover:bg-[#22c55e]/30 transition-colors cursor-pointer"
                      >
                        <Send size={12} />
                        {item.cta || 'Mensaje'}
                      </button>
                    ) : item.href ? (
                      <Link
                        href={item.href}
                        className="shrink-0 text-xs text-[#64748b] hover:text-white transition-colors flex items-center gap-0.5"
                      >
                        {item.cta || 'Ver'}
                        <ChevronRight size={12} />
                      </Link>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>

      {modal && (
        <SendMessageModal
          businessName={modal.name}
          phone={modal.phone}
          defaultMessage={modal.message}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
