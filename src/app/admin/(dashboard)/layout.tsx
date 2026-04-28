import { AdminShell } from '@/components/admin/admin-shell'
import { getAdminBadges } from '@/lib/admin-badges'

export const dynamic = 'force-dynamic'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const badges = await getAdminBadges().catch(() => ({}))
  return <AdminShell badges={badges}>{children}</AdminShell>
}
