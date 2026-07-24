import { getAllDocs } from '@/lib/docs'
import { DocsList } from './docs-list'

export const dynamic = 'force-dynamic'

export default function DocsPage() {
  const docs = getAllDocs()

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Tutoriales</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Guías para usar el Command Center · {docs.length} disponibles</p>
      </div>

      <DocsList docs={docs} />
    </div>
  )
}
