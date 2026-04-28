import Link from 'next/link'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

async function getCounts() {
  const sb = await createSupabaseAdminClient()
  const [embedRes, draftRes, stalePiCount] = await Promise.all([
    sb.from('places').select('id', { count: 'exact', head: true }).is('embedding', null).in('visibility', ['published', 'draft']),
    sb.from('places').select('id', { count: 'exact', head: true }).eq('status', 'open').eq('visibility', 'draft'),
    Promise.resolve(0),
  ])
  return {
    missing_embeddings: embedRes.count ?? 0,
    draft_visible: draftRes.count ?? 0,
    stale_pis: stalePiCount,
  }
}

export default async function FixIndexPage() {
  const counts = await getCounts()
  const totalIssues = counts.missing_embeddings + counts.draft_visible

  return (
    <div className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Arreglar Issues</h1>
        <p className="text-sm text-[#64748b]">
          Problemas de calidad del directorio. Click en cada uno para preview + arreglo de un click.
        </p>
      </header>

      {totalIssues === 0 && (
        <div className="bg-[#022c22] border border-[#16a34a] rounded-lg p-4 text-[#4ade80] text-sm">
          ✓ Todo limpio. No hay issues pendientes.
        </div>
      )}

      <div className="space-y-3">
        <FixCard
          href="/admin/fix/embeddings"
          icon="🧠"
          title="Embeddings faltantes"
          count={counts.missing_embeddings}
          impact="Bot no encuentra estos negocios via búsqueda semántica"
          buttonText="Generar embeddings →"
          severity={counts.missing_embeddings > 0 ? 'warn' : 'ok'}
        />
        <FixCard
          href="/admin/fix/publish-drafts"
          icon="📦"
          title="Negocios draft pero abiertos"
          count={counts.draft_visible}
          impact="status=open + visibility=draft → bot los oculta aunque digan abierto"
          buttonText="Publicar todos →"
          severity={counts.draft_visible > 0 ? 'error' : 'ok'}
        />
      </div>
    </div>
  )
}

function FixCard({
  href,
  icon,
  title,
  count,
  impact,
  buttonText,
  severity,
}: {
  href: string
  icon: string
  title: string
  count: number
  impact: string
  buttonText: string
  severity: 'ok' | 'warn' | 'error'
}) {
  const colors = {
    ok: { border: '#16a34a', text: '#4ade80', bg: '#022c22' },
    warn: { border: '#f59e0b', text: '#fbbf24', bg: '#78350f' },
    error: { border: '#dc2626', text: '#f87171', bg: '#7f1d1d' },
  }[severity]

  if (count === 0) {
    return (
      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-4 opacity-50">
        <div className="flex items-center gap-3">
          <span className="text-xl">{icon}</span>
          <div className="flex-1">
            <div className="font-semibold text-sm text-[#94a3b8]">{title}</div>
            <div className="text-xs text-[#64748b] mt-0.5">✓ 0 pendientes</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <Link href={href} className="block bg-[#1e293b] border border-[#334155] rounded-lg p-4 hover:border-[#475569] transition-colors">
      <div className="flex items-center gap-3">
        <span className="text-2xl">{icon}</span>
        <div className="flex-1">
          <div className="font-semibold">{title}</div>
          <div className="text-xs text-[#94a3b8] mt-1">{impact}</div>
        </div>
        <div className="text-right">
          <div
            className="text-2xl font-bold"
            style={{ color: colors.text }}
          >
            {count}
          </div>
          <div className="text-xs" style={{ color: colors.text }}>
            {buttonText}
          </div>
        </div>
      </div>
    </Link>
  )
}
