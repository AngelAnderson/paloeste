import { NextResponse, type NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export default async function proxy(request: NextRequest) {
  const isAdmin = request.nextUrl.pathname.startsWith('/admin')

  // For non-admin routes, pass through
  if (!isAdmin) {
    return NextResponse.next()
  }

  // Set admin header so root layout can hide header/footer
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-is-admin', '1')

  // Allow login page (no auth needed)
  if (request.nextUrl.pathname === '/admin/login') {
    return NextResponse.next({
      request: { headers: requestHeaders },
    })
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

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/admin/:path*'],
}
