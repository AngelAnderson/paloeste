// La dirección propia del inbox (30 oct 2026). Sin dependencias para que el proxy la importe.
// Ese dominio sirve el inbox y nada más: ni el resto del admin ni las páginas públicas.
export const INBOX_HOST = 'inbox.vecinoai.com'

const RUTAS_DEL_INBOX = [
  '/admin/inbox',
  '/admin/login',
  '/api/inbox/',
  '/api/send-message',
  '/api/admin/send-outbound',
  '/inbox.webmanifest',
  '/inbox-icon-',
]

export function esHostDelInbox(host: string | null): boolean {
  return (host || '').toLowerCase().split(':')[0] === INBOX_HOST
}

export function esRutaDelInbox(pathname: string): boolean {
  return RUTAS_DEL_INBOX.some((ruta) => pathname.startsWith(ruta))
}

export function cabecerasDelInbox(supabaseUrlCruda: string): Record<string, string> {
  // La variable de Vercel trae un salto de línea al final y una cabecera no lo acepta (500).
  const supabaseUrl = supabaseUrlCruda.trim()
  const wss = supabaseUrl.replace(/^https:/, 'wss:')
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "font-src 'self'",
      `connect-src 'self' ${supabaseUrl} ${wss}`,
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'X-Robots-Tag': 'noindex, nofollow',
  }
}
