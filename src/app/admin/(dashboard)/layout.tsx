import { headers } from 'next/headers'
import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminBadges } from '@/lib/admin-badges'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // En inbox.vecinoai.com no hay menú de admin: solo el inbox.
  const requestHeaders = await headers()
  if (requestHeaders.get('x-inbox-host') === '1') return <>{children}</>

  const badges = await getAdminBadges().catch(() => ({}))
  return <AdminShell badges={badges}>{children}</AdminShell>
}
