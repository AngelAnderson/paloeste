'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

type Paso = 'cargando' | 'entrar' | 'inscribir' | 'codigo' | 'nueva' | 'correo'

const CAMPO = 'w-full min-h-12 bg-[#0f172a] border border-[#475569] rounded-lg px-3 py-2.5 text-white text-base focus:border-[#38bdf8] focus:outline-none'
const BOTON = 'w-full min-h-12 bg-[#38bdf8] text-[#0f172a] font-semibold rounded-lg py-2.5 text-base hover:bg-[#7dd3fc] disabled:opacity-50 transition-colors'
const ENLACE = 'w-full min-h-12 text-[#cbd5e1] text-base underline'
const ETIQUETA = 'block text-base text-[#cbd5e1] mb-1.5'

export default function AdminLogin() {
  const [paso, setPaso] = useState<Paso>('cargando')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [codigo, setCodigo] = useState('')
  const [factorId, setFactorId] = useState('')
  const [qr, setQr] = useState('')
  const [uri, setUri] = useState('')
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

  const inscribir = useCallback(async () => {
    const supabase = createSupabaseBrowserClient()
    const { data: lista } = await supabase.auth.mfa.listFactors()
    for (const viejo of (lista?.all || []).filter((f) => f.status === 'unverified')) {
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
    setFactorId(data.id)
    setQr(data.totp.qr_code)
    setUri(data.totp.uri)
    irA('inscribir')
  }, [irA])

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
      setError('Ese código no funcionó. Espera el próximo e intenta otra vez.')
      setCodigo('')
      setLoading(false)
      return
    }
    setLoading(false)
    if (esReset.current) irA('nueva')
    else entrar()
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

  const campoCodigo = (
    <div>
      <label htmlFor="codigo" className={ETIQUETA}>Código de 6 dígitos</label>
      <input
        id="codigo"
        name="one-time-code"
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        maxLength={6}
        autoFocus
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
              <p className="text-[#cbd5e1] text-base">Vamos a guardar tu llave en Contraseñas de Apple. Esto se hace 1 sola vez.</p>
              <a href={uri} className={`${BOTON} block text-center lg:hidden`}>Guardar en Contraseñas</a>
              {qr && (
                <div className="hidden lg:block bg-white rounded-lg p-3 w-fit mx-auto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qr} alt="Código QR para guardar la llave en tu teléfono" width={200} height={200} />
                </div>
              )}
              {campoCodigo}
            </div>
          )}

          {paso === 'codigo' && <div className="space-y-4 mt-4">{campoCodigo}</div>}

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
