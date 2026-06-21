'use client'
import { useState } from 'react'

// El loop de DMs, nativo en el cockpit (antes vivía en un iframe en /admin/tablero).
// Consciente de la ventana de envío: DMs solo Lun-Vie 9am-5pm AT (regla Angel 2026-06-21).
// El registro de resultado (Respondió/Cerró/Silencio) → /api/deals/outcome alimenta la alarma "0 cerrados".

type DM = { biz: string; phone: string; digits: string; why: string; note: string; kw: string; msg: string }

const DMS: DM[] = [
  {
    biz: 'Cafetería Wiliche', phone: '787-216-2562', digits: '17872162562', why: '33 menciones · #1',
    note: 'No paga. Goodwill puro.', kw: 'sandwich',
    msg: 'Saludos, le escribe Angel de CaboRojo.com. Esta semana pregunté en CaboRojo.com (127,000 seguidores) cuál es el mejor sándwich de Cabo Rojo. A ustedes los nombraron 33 veces, fueron el #1, por encima de todos.\n\nNo le vendo nada. Solo quería que lo supieran: el pueblo los puso primero. Si en algún momento quieren que esa gente los encuentre más fácil, me dicen. Felicidades. - Angel',
  },
  {
    biz: "Carlito's Best Sandwiches", phone: '939-308-0886', digits: '19393080886', why: '16 menciones',
    note: 'No paga.', kw: 'sandwich',
    msg: "Saludos, le escribe Angel de CaboRojo.com. Pregunté en CaboRojo.com cuál es el mejor sándwich de Cabo Rojo, y a Carlito's los nombraron 16 veces, de los más mencionados del pueblo.\n\nNo le vendo nada. Solo que lo supieran. Si quieren que esa gente los encuentre más fácil, aquí estoy. - Angel",
  },
]

function OutcomeRow({ dm }: { dm: DM }) {
  const [done, setDone] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function record(outcome: 'respondio' | 'cerro' | 'silencio') {
    let amount = 0
    if (outcome === 'cerro') {
      const v = prompt('¿Cuánto cerró? (solo el número)')
      if (v === null) return
      amount = parseFloat(v.replace(/[^0-9.]/g, '')) || 0
    }
    setBusy(true)
    try {
      const r = await fetch('/api/deals/outcome', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ business_name: dm.biz, contact_phone: dm.phone, related_keyword: dm.kw, outcome, amount, source: 'hoy' }),
      })
      if (!r.ok) throw new Error()
      setDone(outcome === 'respondio' ? '✓ Respondió — anotado' : outcome === 'cerro' ? `✓ Cerró $${amount} — anotado` : '✓ Silencio — anotado')
    } catch {
      setBusy(false)
      alert('No se pudo guardar. Reintenta.')
    }
  }

  if (done) return <div className="text-emerald-400 text-sm font-bold pt-3 mt-2 border-t border-dashed border-[#334155]">{done}</div>

  const btn = 'flex-1 min-w-[90px] rounded-lg border px-2 py-2 text-sm font-semibold disabled:opacity-40'
  return (
    <div className="flex gap-2 pt-3 mt-2 border-t border-dashed border-[#334155] flex-wrap">
      <span className="w-full text-xs font-bold text-[#94a3b8]">¿Qué pasó después de mandar?</span>
      <button disabled={busy} onClick={() => record('respondio')} className={`${btn} border-emerald-700 text-emerald-300`}>Respondió</button>
      <button disabled={busy} onClick={() => record('cerro')} className={`${btn} border-amber-600 text-amber-300`}>Cerró $</button>
      <button disabled={busy} onClick={() => record('silencio')} className={`${btn} border-[#334155] text-[#94a3b8]`}>Silencio</button>
    </div>
  )
}

export function DecisionesHoy({ windowOpen, reason }: { windowOpen: boolean; reason: string }) {
  return (
    <div className="space-y-3 mb-6">
      <h2 className="text-white font-bold text-sm">📲 Decisiones de Hoy</h2>

      <div className={'rounded-xl px-4 py-2.5 text-sm font-semibold border ' + (windowOpen
        ? 'bg-emerald-900/40 border-emerald-700 text-emerald-200'
        : 'bg-amber-900/30 border-amber-700 text-amber-200')}>
        {windowOpen ? '✅ Ventana abierta — manda (Lun-Vie 9am a 5pm)' : `🚫 ${reason}`}
      </div>

      {DMS.map(dm => (
        <div key={dm.biz} className="rounded-xl bg-[#1e293b] border border-[#334155] border-l-4 border-l-[#0f766e] p-4">
          <div className="flex justify-between items-baseline gap-2">
            <b className="text-white text-[15px]">{dm.biz}</b>
            <span className="text-[11px] font-bold text-white bg-[#b7791f] rounded-full px-2.5 py-0.5 whitespace-nowrap">{dm.why}</span>
          </div>
          <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-[#cbd5e1] bg-[#0f172a]/50 rounded-lg p-3 my-2">{dm.msg}</pre>
          {windowOpen ? (
            <a href={`https://wa.me/${dm.digits}?text=${encodeURIComponent(dm.msg)}`} target="_blank" rel="noopener"
              className="flex items-center justify-center gap-2 bg-[#25d366] text-white font-bold text-[15px] py-3 rounded-lg w-full">
              📲 Mandar a {dm.biz}
            </a>
          ) : (
            <div className="flex items-center justify-center gap-2 bg-[#334155] text-[#94a3b8] font-bold text-sm py-3 rounded-lg w-full">
              📲 Vuelve Lun-Vie 9am a 5pm
            </div>
          )}
          <div className="text-center text-xs text-[#64748b] mt-2">{dm.note} {dm.phone}</div>
          <OutcomeRow dm={dm} />
        </div>
      ))}
    </div>
  )
}
