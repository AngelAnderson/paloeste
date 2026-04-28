import Link from 'next/link'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { PublishDraftsClient } from '@/components/admin/fix/publish-drafts-client'

export const dynamic = 'force-dynamic'

async function getDraftPlaces() {
  const sb = await createSupabaseAdminClient()
  const { data, count } = await sb
    .from('places')
    .select('id, name, category, slug', { count: 'exact' })
    .eq('status', 'open')
    .eq('visibility', 'draft')
    .order('name')
  return { count: count ?? 0, places: data || [] }
}

export default async function FixPublishDraftsPage() {
  const { count, places } = await getDraftPlaces()

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/admin/fix" className="text-xs text-[#64748b] hover:text-white">← Volver a Arreglar Issues</Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-bold mb-1">📦 Negocios draft pero abiertos</h1>
        <p className="text-sm text-[#64748b]">
          Estos negocios tienen <code className="text-[#fbbf24]">status=open</code> (están operando) pero
          {' '}<code className="text-[#fbbf24]">visibility=draft</code> (ocultos del bot y del directorio público).
          Es un bug de data hygiene — el bot no los recomienda aunque estén abiertos.
          Arreglarlos = ponerlos <code className="text-[#4ade80]">visibility=published</code>.
        </p>
      </header>

      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-5 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-3xl font-bold text-[#f87171]">{count}</div>
            <div className="text-xs text-[#94a3b8]">negocios ocultos por bug</div>
          </div>
        </div>

        {count > 0 ? (
          <PublishDraftsClient totalCount={count} />
        ) : (
          <div className="text-[#4ade80] text-sm">✓ No hay drafts ocultos. Todo el directorio activo es visible.</div>
        )}
      </div>

      {places.length > 0 && (
        <details className="bg-[#1e293b] border border-[#334155] rounded-lg p-4" open>
          <summary className="cursor-pointer text-sm text-[#94a3b8]">
            Ver lista completa ({places.length})
          </summary>
          <ul className="mt-3 space-y-1 text-xs max-h-96 overflow-y-auto">
            {places.map(p => (
              <li key={p.id} className="text-[#94a3b8] flex items-center justify-between py-1 border-b border-[#334155]">
                <div>
                  <strong className="text-white">{p.name}</strong>
                  <span className="text-[#64748b] ml-2">{p.category || 'sin categoría'}</span>
                </div>
                {p.slug && (
                  <a
                    href={`/negocio/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#38bdf8] hover:underline ml-2"
                  >
                    Ver →
                  </a>
                )}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
