import Link from 'next/link'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { EmbeddingsFixClient } from '@/components/admin/fix/embeddings-fix-client'

export const dynamic = 'force-dynamic'

async function getMissingPlaces() {
  const sb = await createSupabaseAdminClient()
  const { data, count } = await sb
    .from('places')
    .select('id, name, category, status, visibility', { count: 'exact' })
    .is('embedding', null)
    .in('visibility', ['published', 'draft'])
    .order('name')
  return { count: count ?? 0, sample: (data || []).slice(0, 20) }
}

export default async function FixEmbeddingsPage() {
  const { count, sample } = await getMissingPlaces()

  return (
    <div className="max-w-3xl mx-auto p-6">
      <Link href="/admin/fix" className="text-xs text-[#64748b] hover:text-white">← Volver a Arreglar Issues</Link>

      <header className="mt-4 mb-6">
        <h1 className="text-2xl font-bold mb-1">🧠 Embeddings faltantes</h1>
        <p className="text-sm text-[#64748b]">
          Cada negocio en tu directorio tiene un vector "embedding" (representación matemática del nombre + descripción + tags).
          El bot lo usa para búsqueda semántica — sin embedding, el bot NO los encuentra cuando alguien hace una pregunta tipo
          "¿dónde como pinchos?" en vez de buscar por nombre exacto.
        </p>
      </header>

      <div className="bg-[#1e293b] border border-[#334155] rounded-lg p-5 mb-4">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="text-3xl font-bold text-[#fbbf24]">{count}</div>
            <div className="text-xs text-[#94a3b8]">negocios sin embedding</div>
          </div>
          <div className="text-right text-xs text-[#94a3b8]">
            <div>~$0.0001 / embedding</div>
            <div>~${(count * 0.0001).toFixed(4)} costo total</div>
          </div>
        </div>

        {count > 0 ? (
          <EmbeddingsFixClient totalCount={count} />
        ) : (
          <div className="text-[#4ade80] text-sm">✓ No hay embeddings faltantes. Todo el directorio es buscable.</div>
        )}
      </div>

      {sample.length > 0 && (
        <details className="bg-[#1e293b] border border-[#334155] rounded-lg p-4">
          <summary className="cursor-pointer text-sm text-[#94a3b8]">
            Ver muestra (primeros 20)
          </summary>
          <ul className="mt-3 space-y-1 text-xs">
            {sample.map(p => (
              <li key={p.id} className="text-[#94a3b8]">
                <strong className="text-white">{p.name}</strong>
                {' · '}
                <span className="text-[#64748b]">{p.category || 'sin categoría'}</span>
                {' · '}
                <span className="text-[#64748b]">{p.visibility}</span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  )
}
