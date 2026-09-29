// Allowlist de emails admin, compartida por proxy.ts (páginas /admin) y admin-auth.ts (rutas API).
// Sin dependencias de Node ni de next/headers para que el proxy la pueda importar.
// Añade más vía env: ADMIN_EMAILS="angel@angelanderson.com,otra@...".
const DEFAULT_ADMIN_EMAILS = ['angel@angelanderson.com']

export const ADMIN_EMAILS = new Set(
  [...DEFAULT_ADMIN_EMAILS, ...(process.env.ADMIN_EMAILS || '').split(',')]
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
)

export function isAdminEmail(email: string | null | undefined): boolean {
  return !!email && ADMIN_EMAILS.has(email.toLowerCase())
}
