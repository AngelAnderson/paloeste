import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDashboard } from '@/lib/dashboards'

export const dynamic = 'force-dynamic'

export default async function DashboardView({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const dash = getDashboard(slug)
  if (!dash) notFound()

  return (
    <div className="space-y-4">
      <Link href="/admin/tablero" className="text-[#94a3b8] hover:text-white text-sm inline-flex items-center gap-1">
        ← Tableros
      </Link>
      <h1 className="text-xl font-bold text-white">{dash.emoji} {dash.title}</h1>
      {/* Self-contained dashboard HTML from our own repo (src/content/admin-dashboards),
          rendered in a sandboxed iframe so its scripts run isolated. Not user input. */}
      <iframe
        srcDoc={dash.html}
        sandbox="allow-scripts allow-same-origin allow-popups"
        className="w-full h-[85vh] rounded-xl border border-[#334155] bg-white"
      />
    </div>
  )
}
