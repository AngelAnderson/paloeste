import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const ADMIN_TOKEN = process.env.TAREAS_ADMIN_TOKEN || ''

// Allowlist de emails admin (AUTORIZACIÓN, no solo autenticación). Estar logueado en
// Supabase NO basta: si los signups del proyecto están abiertos, cualquiera podría
// auto-registrarse. El email del usuario tiene que estar en esta lista.
// El default incluye a Angel para que el deploy no lo lockee aunque el env no esté puesto.
// Añade más (ej. Noelia) vía env: ADMIN_EMAILS="angel@angelanderson.com,noelia@...".
const DEFAULT_ADMIN_EMAILS = ['angel@angelanderson.com']
const ADMIN_EMAILS = new Set(
  [...DEFAULT_ADMIN_EMAILS, ...(process.env.ADMIN_EMAILS || '').split(',')]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

function safeEq(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false
  try {
    return timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

/**
 * Guard para rutas API que usan service role (createSupabaseAdminClient).
 * Devuelve null cuando el llamante está autorizado; si no, una NextResponse 401.
 * Acepta: (1) sesión de Supabase Auth vía cookie CUYO EMAIL esté en la allowlist admin
 * (lo que usa el dashboard), o (2) header `Authorization: Bearer <TAREAS_ADMIN_TOKEN>`
 * (tooling / server-to-server).
 * Nota: además, desactiva los signups públicos en el proyecto Supabase para defensa en profundidad.
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  const auth = req.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (token && ADMIN_TOKEN && safeEq(token, ADMIN_TOKEN)) return null

  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    const email = data?.user?.email?.toLowerCase()
    if (!error && email && ADMIN_EMAILS.has(email)) return null
  } catch {
    /* cae al 401 */
  }

  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}
