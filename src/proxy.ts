import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminEmail } from '@/lib/admin-emails'
import { cabecerasDelInbox, esHostDelInbox, esRutaDelInbox } from '@/lib/inbox-host'

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const enInbox = esHostDelInbox(request.headers.get('host'))
  const seguro = <T extends NextResponse>(res: T): T => {
    if (!enInbox) return res
    const cabeceras = cabecerasDelInbox(process.env.NEXT_PUBLIC_SUPABASE_URL!)
    Object.entries(cabeceras).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  // inbox.vecinoai.com sirve el inbox y nada más (30 oct 2026).
  if (enInbox && pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/inbox'
    return seguro(NextResponse.redirect(url))
  }
  if (enInbox && !esRutaDelInbox(pathname)) {
    return seguro(new NextResponse('No encontrado', { status: 404 }))
  }

  const isAdmin = pathname.startsWith('/admin')

  // For non-admin routes, pass through
  if (!isAdmin) {
    return seguro(NextResponse.next())
  }

  // Set admin header so root layout can hide header/footer
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-is-admin', '1')
  requestHeaders.delete('x-inbox-host')
  if (enInbox) requestHeaders.set('x-inbox-host', '1')

  // Allow login page (no auth needed)
  if (pathname === '/admin/login') {
    return seguro(NextResponse.next({
      request: { headers: requestHeaders },
    }))
  }

  // Auth check for all other admin pages
  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  })
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request: { headers: requestHeaders },
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  // Estar logueado no basta: el email tiene que estar en la allowlist (sec 29 sep 2026)
  // y la sesión tiene que venir con segundo factor (30 oct 2026).
  const { data: { user } } = await supabase.auth.getUser()
  const { data: nivel } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
  if (!user || !isAdminEmail(user.email) || nivel?.currentLevel !== 'aal2') {
    const url = request.nextUrl.clone()
    const target = pathname + request.nextUrl.search
    url.pathname = '/admin/login'
    url.search = ''
    if (target && target !== '/admin' && target !== '/admin/login') {
      url.searchParams.set('next', target)
    }
    return seguro(NextResponse.redirect(url))
  }

  return seguro(supabaseResponse)
}

export const config = {
  matcher: [
    '/admin/:path*',
    {
      source: '/((?!_next/static|_next/image|favicon.ico).*)',
      has: [{ type: 'host', value: 'inbox\\.vecinoai\\.com' }],
    },
  ],
}
