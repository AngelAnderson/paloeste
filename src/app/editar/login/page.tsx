'use client'

import { useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

export default function EditarLogin() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createSupabaseBrowserClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/editar` },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm text-center">
          <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
            <div className="text-4xl mb-4">📬</div>
            <h1 className="text-xl font-bold text-stone-900 mb-2">Revisa tu email</h1>
            <p className="text-stone-500 text-sm">
              Enviamos un enlace mágico a <strong>{email}</strong>. Haz clic en el enlace para entrar.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 shadow-sm">
          <h1 className="text-xl font-bold text-stone-900 mb-1">Editor de Directorio</h1>
          <p className="text-stone-500 text-sm mb-6">Entra con tu email para editar negocios</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="noelia@angelanderson.com"
                className="w-full bg-stone-50 border border-stone-200 rounded-lg px-3 py-2.5 text-stone-900 text-sm focus:border-red-500 focus:outline-none"
                required
              />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Enviando...' : 'Enviar enlace mágico'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
