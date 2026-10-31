'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Paso = 'cargando' | 'entrar' | 'inscribir' | 'codigo' | 'nueva' | 'correo'

const CAMPO = 'w-full min-h-12 bg-[#0f172a] border border-[#475569] rounded-lg px-3 py-2.5 text-white text-base focus:border-[#38bdf8] focus:outline-none'
const BOTON = 'w-full min-h-12 bg-[#38bdf8] text-[#0f172a] font-semibold rounded-lg py-2.5 text-base hover:bg-[#7dd3fc] disabled:opacity-50 transition-colors'
const ENLACE = 'w-full min-h-12 text-[#cbd5e1] text-base underline'
const ETIQUETA = 'block text-base text-[#cbd5e1] mb-1.5'
const TEXTO = 'text-[#cbd5e1] text-base'

// La llave pendiente sobrevive la recarga: si no, la que Angel ya guardó queda muerta sin aviso (30 oct 2026).
const LLAVE_PENDIENTE = 'inbox-llave-pendiente'
type Llave = { factorId: string; qr: string; uri: string; clave: string }

function leerLlave(): Llave | null {
  try {
    return JSON.parse(sessionStorage.getItem(LLAVE_PENDIENTE) || 'null')
  } catch {
    return null
  }
}

function guardarLlave(llave: Llave | null) {
  try {
    if (llave) sessionStorage.setItem(LLAVE_PENDIENTE, JSON.stringify(llave))
    else sessionStorage.removeItem(LLAVE_PENDIENTE)
  } catch {
    /* sin almacenamiento, la llave solo vive en esta pantalla */
  }
}

// iPad se presenta como Mac; se distingue porque tiene pantalla táctil.
function enTelefono() {
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export default function AdminLogin() {
  const [paso, setPaso] = useState<Paso>('cargando')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [codigo, setCodigo] = useState('')
  const [factorId, setFactorId] = useState('')
  const [qr, setQr] = useState('')
  const [uri, setUri] = useState('')
  const [clave, setClave] = useState('')
  const [copiada, setCopiada] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const pasoRef = useRef<Paso>('cargando')
  const esReset = useRef(searchParams.get('reset') === '1')

  const irA = useCallback((siguiente: Paso) => {
    pasoRef.current = siguiente
    setPaso(siguiente)
  }, [])

  const entrar = useCallback(() => {
    const next = searchParams.get('next')
    const seguro = next && next.startsWith('/admin') && !next.startsWith('/admin/login')
    window.location.assign(seguro ? next : '/admin/inbox')
  }, [searchParams])

  const mostrarLlave = useCallback((llave: Llave) => {
    setFactorId(llave.factorId)
    setQr(llave.qr)
    setUri(llave.uri)
    setClave(llave.clave)
    irA('inscribir')
  }, [irA])

  const inscribir = useCallback(async (nueva = false) => {
    const supabase = createSupabaseBrowserClient()
    const { data: lista } = await supabase.auth.mfa.listFactors()
    const pendientes = (lista?.all || []).filter((f) => f.status === 'unverified')
    const guardada = leerLlave()
    if (!nueva && guardada && pendientes.some((f) => f.id === guardada.factorId)) {
      mostrarLlave(guardada)
      return
    }
    for (const viejo of pendientes) {
      await supabase.auth.mfa.unenroll({ factorId: viejo.id })
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      issuer: 'Inbox 7711',
      friendlyName: `iPhone ${Date.now()}`,
    })
    if (error || !data) {
      setError('No se pudo preparar el código. Intenta otra vez.')
      irA('entrar')
      return
    }
    const llave = { factorId: data.id, qr: data.totp.qr_code, uri: data.totp.uri, clave: data.totp.secret }
    guardarLlave(llave)
    mostrarLlave(llave)
  }, [mostrarLlave, irA])

  const resolverPaso = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      irA('entrar')
      return
    }
    const { data: lista } = await supabase.auth.mfa.listFactors()
    const verificados = lista?.totp || []
    if (verificados.length === 0) {
      await inscribir()
      return
    }
    const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    if (nivel?.currentLevel !== 'aal2') {
      setFactorId(verificados[0].id)
      irA('codigo')
      return
    }
    if (esReset.current) {
      irA('nueva')
      return
    }
    entrar()
  }, [entrar, inscribir, irA])

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'PASSWORD_RECOVERY') esReset.current = true
      const espera = pasoRef.current === 'cargando' || pasoRef.current === 'entrar'
      if (espera && ['INITIAL_SESSION', 'SIGNED_IN', 'PASSWORD_RECOVERY'].includes(evento)) {
        setTimeout(resolverPaso, 0)
      }
    })
    return () => subscription.unsubscribe()
  }, [resolverPaso])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError('Ese correo o esa contraseña no funcionan.')
    setLoading(false)
  }

  async function handleCodigo(valor: string) {
    if (valor.length !== 6 || loading) return
    setLoading(true)
    setError('')
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: valor })
    if (error) {
      setError('Ese no es. Abre Contraseñas, busca Inbox 7711 y copia el número que sale ahora.')
      setCodigo('')
      setLoading(false)
      return
    }
    setLoading(false)
    guardarLlave(null)
    if (esReset.current) irA('nueva')
    else entrar()
  }

  async function handleOtraLlave() {
    setLoading(true)
    setError('')
    setCodigo('')
    await inscribir(true)
    setLoading(false)
  }

  async function handleCopiar() {
    try {
      await navigator.clipboard.writeText(clave)
      setCopiada(true)
    } catch {
      setError('No se pudo copiar. Escribe la clave a mano.')
    }
  }

  async function handleNueva(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) setError('Esa contraseña no se pudo guardar. Usa una más larga, de 12 o más.')
    else entrar()
  }

  async function handleOlvide() {
    if (!email) {
      setError('Escribe tu correo primero.')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createSupabaseBrowserClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/login?reset=1`,
    })
    setLoading(false)
    irA('correo')
  }

  // Al guardar la llave no se invita a Safari a rellenar: podría meter un código de otro lado.
  const inscribiendo = paso === 'inscribir'
  const campoCodigo = (
    <div>
      <label htmlFor="codigo" className={ETIQUETA}>Los 6 números</label>
      <input
        id="codigo"
        name={inscribiendo ? 'numeros' : 'one-time-code'}
        type="text"
        inputMode="numeric"
        autoComplete={inscribiendo ? 'off' : 'one-time-code'}
        pattern="[0-9]*"
        maxLength={6}
        autoFocus={!inscribiendo}
        value={codigo}
        onChange={(e) => {
          const valor = e.target.value.replace(/\D/g, '').slice(0, 6)
          setCodigo(valor)
          handleCodigo(valor)
        }}
        className={`${CAMPO} tracking-[0.3em] text-center`}
      />
    </div>
  )

  return (
    <div className="min-h-dvh bg-[#0f172a] flex items-center justify-center p-4">
      <main className="w-full max-w-sm">
        <div className="bg-[#1e293b] rounded-2xl border border-[#334155] p-6">
          <h1 className="text-2xl font-bold text-white mb-1">Inbox del 7711</h1>

          {paso === 'cargando' && <p className="text-[#cbd5e1] text-base" role="status">Un momento...</p>}

          {paso === 'entrar' && (
            <form onSubmit={handleLogin} className="space-y-4 mt-4">
              <div>
                <label htmlFor="email" className={ETIQUETA}>Correo</label>
                <input id="email" name="username" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} className={CAMPO} required />
              </div>
              <div>
                <label htmlFor="password" className={ETIQUETA}>Contraseña</label>
                <input id="password" name="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className={CAMPO} required />
              </div>
              <button type="submit" disabled={loading} className={BOTON}>{loading ? 'Entrando...' : 'Entrar'}</button>
              <button type="button" onClick={handleOlvide} disabled={loading} className={ENLACE}>Olvidé mi contraseña</button>
            </form>
          )}

          {paso === 'inscribir' && (
            <div className="space-y-4 mt-4">
              <p className={TEXTO}>Tu contraseña entró bien. Falta guardar tu llave en el iPhone. Esto se hace 1 sola vez.</p>
              {enTelefono() ? (
                <ol className={`${TEXTO} list-decimal pl-6 space-y-2`}>
                  <li>Toca el botón de abajo.</li>
                  <li>Guárdala en Contraseñas.</li>
                  <li>En Contraseñas, busca Inbox 7711. Copia los 6 números y vuelve aquí.</li>
                </ol>
              ) : (
                <ol className={`${TEXTO} list-decimal pl-6 space-y-2`}>
                  <li>Abre la cámara del iPhone y apúntala a este cuadro.</li>
                  <li>Toca el aviso que sale y guárdala en Contraseñas.</li>
                  <li>En Contraseñas, busca Inbox 7711 y escribe aquí los 6 números.</li>
                </ol>
              )}
              {enTelefono() ? (
                <a href={uri} className={`${BOTON} block text-center`}>Guardar en Contraseñas</a>
              ) : qr && (
                <div className="bg-white rounded-lg p-3 w-fit mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="Cuadro para guardar la llave con la cámara del iPhone" width={200} height={200} />
                </div>
              )}
              {campoCodigo}
              <p className={TEXTO}>Los números cambian cada 30 segundos. Usa los que salen ahora.</p>
              <button type="button" onClick={handleCopiar} className={ENLACE}>{copiada ? 'Clave copiada' : '¿No abre? Copiar la clave'}</button>
              <button type="button" onClick={handleOtraLlave} disabled={loading} className={ENLACE}>Empezar con otra llave (la anterior deja de servir)</button>
            </div>
          )}

          {paso === 'codigo' && (
            <div className="space-y-4 mt-4">
              <p className={TEXTO}>Abre Contraseñas en tu iPhone, busca Inbox 7711 y escribe los 6 números.</p>
              {campoCodigo}
            </div>
          )}

          {paso === 'nueva' && (
            <form onSubmit={handleNueva} className="space-y-4 mt-4">
              <div>
                <label htmlFor="nueva" className={ETIQUETA}>Contraseña nueva</label>
                <input id="nueva" name="new-password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(e) => setPassword(e.target.value)} className={CAMPO} required />
              </div>
              <button type="submit" disabled={loading} className={BOTON}>Guardar y entrar</button>
            </form>
          )}

          {paso === 'correo' && (
            <p className="text-[#cbd5e1] text-base mt-4" role="status">
              Si ese correo tiene cuenta, te llegó un enlace. Ábrelo en este mismo navegador.
            </p>
          )}

          {error && <p className="text-[#fca5a5] text-base mt-4" role="alert">{error}</p>}
        </div>
      </main>
    </div>
  )
}
