import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { isAdminEmail } from '@/lib/admin-emails'

// Allowlist de emails admin (AUTORIZACIÓN, no solo autenticación): vive en admin-emails.ts
// para que el proxy de /admin use la misma lista. Estar logueado en Supabase NO basta.

/**
 * Guard para rutas API que usan service role (createSupabaseAdminClient).
 * Devuelve null cuando el llamante está autorizado; si no, una NextResponse 401.
 * Exige sesión de Supabase Auth vía cookie, email en la allowlist y segundo factor (aal2).
 * 30 oct 2026: se quitó el Bearer TAREAS_ADMIN_TOKEN de aquí; abría todas las rutas de
 * admin sin login ni segundo factor. Ese token sigue solo en /api/tareas.
 */
export async function requireAdmin(_req: NextRequest): Promise<NextResponse | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const { data, error } = await supabase.auth.getUser()
    const email = data?.user?.email?.toLowerCase()
    if (!error && isAdminEmail(email)) {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (aal?.currentLevel === 'aal2') return null
    }
  } catch {
    /* cae al 401 */
  }

  return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
}
