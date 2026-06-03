'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

type Task = {
  id: string
  place_name: string
  place_phone: string | null
  place_address: string | null
  place_npi: string | null
  flag: string
  status: string
  result: Record<string, unknown>
  note: string | null
  updated_at: string
}

const LABELS: Record<string, { label: string; emoji: string }> = {
  health_verify: { label: 'Verificación de Salud', emoji: '🩺' },
  pharmacy_audit: { label: 'Auditoría de Farmacias', emoji: '💊' },
}

const FLAGS: Record<string, [string, string, string]> = {
  revisar: ['🚩 revisar', '#dc2626', '#fef2f2'],
  sin_telefono: ['📵 sin teléfono', '#b45309', '#fffbeb'],
  alta_busqueda: ['⭐ alta búsqueda', '#0369a1', '#eff6ff'],
  farmacia: ['💊 farmacia', '#0d9488', '#f0fdfa'],
}
const SORT: Record<string, number> = { revisar: 0, sin_telefono: 1, alta_busqueda: 2, farmacia: 0, normal: 3 }

function gmap(n?: string | null, a?: string | null) {
  return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${n || ''} ${a || ''} Cabo Rojo PR`)
}

export default function Worker() {
  const sp = useSearchParams()
  const task = sp.get('task') || 'health_verify'
  const token = sp.get('token') || ''
  const admin = sp.get('view') === 'admin'
  const meta = LABELS[task] || LABELS.health_verify

  const [tasks, setTasks] = useState<Task[]>([])
  const [loaded, setLoaded] = useState(false)
  const [saved, setSaved] = useState<Record<string, number>>({})
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const load = useCallback(async () => {
    const r = await fetch(`/api/tareas?task=${task}&token=${encodeURIComponent(token)}`)
    if (r.ok) {
      const d = await r.json()
      setTasks(d.tasks || [])
    }
    setLoaded(true)
  }, [task, token])

  useEffect(() => {
    load()
    if (admin) {
      const i = setInterval(load, 15000)
      return () => clearInterval(i)
    }
  }, [load, admin])

  function schedulePost(t: Task, debounce: boolean) {
    const send = () =>
      fetch('/api/tareas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, id: t.id, status: t.status, result: t.result, note: t.note }),
      }).then(() => setSaved((s) => ({ ...s, [t.id]: Date.now() })))
    if (debounce) {
      clearTimeout(timers.current[t.id])
      timers.current[t.id] = setTimeout(send, 600)
    } else send()
  }

  function apply(id: string, patch: Partial<Task>, debounce: boolean) {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
      const t = next.find((x) => x.id === id)!
      schedulePost(t, debounce)
      return next
    })
  }

  // ---- health handlers ----
  function healthCheck(t: Task, checked: boolean) {
    const fix = (t.result?.fix as string) || t.note || ''
    apply(t.id, { status: checked ? 'done' : 'pending', result: checked ? (fix ? { ok: false, fix } : { ok: true }) : {}, note: fix || null }, false)
  }
  function healthFix(t: Task, fix: string) {
    const checked = t.status === 'done'
    const result = checked ? (fix ? { ok: false, fix } : { ok: true }) : fix ? { fix } : {}
    apply(t.id, { result, note: fix || null }, true)
  }

  // ---- pharmacy handlers ----
  function pharmField(t: Task, key: string, value: string, isText: boolean) {
    apply(t.id, { result: { ...(t.result || {}), [key]: value } }, isText)
  }
  function pharmCheck(t: Task, checked: boolean) {
    apply(t.id, { status: checked ? 'done' : 'pending' }, false)
  }
  function pharmNote(t: Task, value: string) {
    apply(t.id, { note: value || null }, true)
  }

  const doneCount = tasks.filter((t) => t.status === 'done').length
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0

  // ---- render lists ----
  const sorted = [...tasks].sort((a, b) => {
    if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1
    return (SORT[a.flag] ?? 3) - (SORT[b.flag] ?? 3) || (a.place_name || '').localeCompare(b.place_name || '')
  })
  const adminDone = [...tasks]
    .filter((t) => t.status === 'done')
    .sort((a, b) => +new Date(b.updated_at) - +new Date(a.updated_at))

  return (
    <div className="wrap">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <header>
        <h1>
          {meta.emoji} {meta.label} — Cabo Rojo
        </h1>
        <div className="pg">
          <div className="pgf" style={{ width: pct + '%' }} />
        </div>
        <div className="pt">
          {doneCount} de {tasks.length} {admin ? 'completados' : 'revisados'}
          {admin ? '' : ' · tu progreso se guarda solo'}
        </div>
      </header>

      {!admin && !loaded && <div className="how">Cargando…</div>}

      {!admin && loaded && (
        <div className="how">
          <b>Cómo verificar (~1 min por negocio):</b>
          <ol>
            <li>Toca <b>🔎 Ver en Google Maps</b> para abrir el negocio.</li>
            {task === 'pharmacy_audit' ? (
              <li>Contesta lo que sepas: si está abierta, delivery, vacunas, horario, planes.</li>
            ) : (
              <li>Confirma que <b>sigue abierto</b>, el <b>teléfono</b> y la <b>dirección</b>.</li>
            )}
            <li>Marca el cuadrito ✅. Si algo está mal, anótalo antes de marcar.</li>
          </ol>
          <p style={{ marginTop: 8, color: '#0f766e' }}>
            <b>Se guarda solo.</b> Puedes cerrar y seguir después — no se pierde nada.
          </p>
        </div>
      )}

      {/* admin live view */}
      {admin && (
        <div>
          <div className="how">
            <b>Vista en vivo.</b> Se refresca sola cada 15 seg. {doneCount} completados, {tasks.length - doneCount} pendientes.
          </div>
          {adminDone.length === 0 && <div className="how">Todavía no hay nada completado.</div>}
          {adminDone.map((t) => {
            const r = t.result || {}
            const isFix = task === 'health_verify' && r.ok === false
            return (
              <div key={t.id} className={'adm ' + (isFix ? 'fix' : 'ok')}>
                <b>{t.place_name}</b>
                {task === 'health_verify' ? (
                  isFix ? (
                    <div className="w">✏️ {(r.fix as string) || t.note}</div>
                  ) : (
                    <div className="a">✅ datos OK</div>
                  )
                ) : (
                  <div className="a">
                    {`Abierta: ${r.abierta || '—'} · Delivery: ${r.delivery || '—'} · Vacunas: ${r.vacunas || '—'} · Horario: ${r.horario || '—'} · Planes: ${r.planes || '—'}`}
                    {t.note ? ` · 📝 ${t.note}` : ''}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* worker cards */}
      {!admin &&
        loaded &&
        sorted.map((t) => {
          const done = t.status === 'done'
          const flag = FLAGS[t.flag]
          const savedRecent = saved[t.id] && Date.now() - saved[t.id] < 1500
          return (
            <div key={t.id} className={'card' + (done ? ' done' : '')}>
              <input
                type="checkbox"
                className="chk"
                checked={done}
                onChange={(e) => (task === 'pharmacy_audit' ? pharmCheck(t, e.target.checked) : healthCheck(t, e.target.checked))}
              />
              <div className="body">
                <div className="nm">{t.place_name}</div>
                {flag && (
                  <span className="pill" style={{ color: flag[1], background: flag[2] }}>
                    {flag[0]}
                  </span>
                )}
                {t.place_phone ? (
                  <div className="ln">
                    📞 <a href={`tel:${t.place_phone}`}>{t.place_phone}</a>
                  </div>
                ) : (
                  <div className="ln" style={{ color: '#b45309' }}>
                    📵 sin teléfono
                  </div>
                )}
                {t.place_address && <div className="ln addr">📍 {t.place_address}</div>}
                <a className="gbtn" href={gmap(t.place_name, t.place_address)} target="_blank" rel="noopener noreferrer">
                  🔎 Ver en Google Maps →
                </a>

                {task === 'pharmacy_audit' ? (
                  <>
                    <div className="row">
                      <Sel label="¿Sigue abierta?" value={(t.result?.abierta as string) || ''} onChange={(v) => pharmField(t, 'abierta', v, false)} />
                      <Sel label="¿Delivery?" value={(t.result?.delivery as string) || ''} onChange={(v) => pharmField(t, 'delivery', v, false)} />
                    </div>
                    <div className="row">
                      <Sel label="¿Pone vacunas?" value={(t.result?.vacunas as string) || ''} onChange={(v) => pharmField(t, 'vacunas', v, false)} />
                      <Inp label="Horario fin de semana" value={(t.result?.horario as string) || ''} placeholder="ej: Sáb 8-4, Dom cerrado" onChange={(v) => pharmField(t, 'horario', v, true)} />
                    </div>
                    <Inp label="Planes médicos que acepta" value={(t.result?.planes as string) || ''} placeholder="ej: MCS, Triple-S, Humana, Medicare…" onChange={(v) => pharmField(t, 'planes', v, true)} />
                    <Inp label="Nota (opcional)" value={t.note || ''} placeholder="lo que quieras añadir" onChange={(v) => pharmNote(t, v)} />
                  </>
                ) : (
                  <Inp
                    label="¿Algo que corregir? (opcional)"
                    value={(t.result?.fix as string) || t.note || ''}
                    placeholder="ej: teléfono correcto 787-…, o cerrado"
                    onChange={(v) => healthFix(t, v)}
                  />
                )}
                <div className="saved">{savedRecent ? '✓ guardado' : ''}</div>
              </div>
            </div>
          )
        })}
    </div>
  )
}

function Sel({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="fld">
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">—</option>
        <option>Sí</option>
        <option>No</option>
        <option>No sé</option>
      </select>
    </div>
  )
}

function Inp({ label, value, placeholder, onChange }: { label: string; value: string; placeholder?: string; onChange: (v: string) => void }) {
  return (
    <div className="fld">
      <label>{label}</label>
      <input value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}

const CSS = `
.wrap{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f1f5f9;color:#1e293b;min-height:100vh;padding:0 12px 60px;max-width:680px;margin:0 auto}
.wrap *{box-sizing:border-box}
header{background:linear-gradient(135deg,#0d9488,#0f766e);color:#fff;margin:0 -12px 12px;padding:16px;position:sticky;top:0;z-index:5}
header h1{font-size:1.1rem;margin:0}
.pg{margin-top:8px;background:rgba(255,255,255,.25);border-radius:999px;height:9px;overflow:hidden}
.pgf{background:#fff;height:100%;transition:width .3s}
.pt{font-size:.78rem;opacity:.95;margin-top:5px}
.how{background:#fff;border-radius:11px;padding:12px 14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,.08);font-size:.83rem;line-height:1.5}
.how b{color:#0f766e}.how ol{margin:6px 0 0 18px}.how li{margin-bottom:4px}.how p{margin:0}
.card{background:#fff;border-radius:11px;padding:11px 12px;margin-bottom:9px;box-shadow:0 1px 3px rgba(0,0,0,.08);display:flex;gap:10px}
.card.done{opacity:.55;background:#ecfdf5}
.chk{width:26px;height:26px;flex:0 0 auto;accent-color:#0d9488;margin-top:2px}
.body{flex:1;min-width:0}.nm{font-weight:700;font-size:.95rem;line-height:1.25}
.pill{font-size:.66rem;font-weight:700;padding:1px 7px;border-radius:999px;margin-top:4px;display:inline-block}
.ln{font-size:.8rem;margin-top:2px}.ln a{color:#0d9488;text-decoration:none}.addr{color:#94a3b8;font-size:.74rem}
.gbtn{display:inline-block;margin-top:7px;background:#eff6ff;color:#1d4ed8;text-decoration:none;font-size:.8rem;font-weight:600;padding:6px 11px;border-radius:8px}
.fld{margin-top:7px}.fld label{font-size:.7rem;color:#475569;font-weight:600;display:block;margin-bottom:2px}
.fld input,.fld select{width:100%;padding:7px 9px;border:1px solid #cbd5e1;border-radius:7px;font-size:.82rem;font-family:inherit;background:#fff}
.fld input:focus,.fld select:focus{outline:none;border-color:#0d9488;box-shadow:0 0 0 2px #ccfbf1}
.row{display:flex;gap:7px}.row .fld{flex:1}
.saved{font-size:.66rem;color:#16a34a;font-weight:700;margin-top:4px;height:12px}
.adm{background:#fff;border-radius:10px;padding:10px 12px;margin-bottom:7px;box-shadow:0 1px 2px rgba(0,0,0,.07);font-size:.85rem}
.adm.ok{border-left:4px solid #16a34a}.adm.fix{border-left:4px solid #d97706;background:#fffbeb}
.adm .w{font-size:.78rem;color:#b45309;margin-top:3px}.adm .a{font-size:.76rem;color:#475569;margin-top:3px}
`
