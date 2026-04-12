import Link from 'next/link'
import { getAllDocs } from '@/lib/docs'

export const dynamic = 'force-dynamic'

export default function DocsPage() {
  const docs = getAllDocs()

  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Tutoriales</h1>
        <p className="text-[#94a3b8] text-sm mt-1">Guias para usar el Command Center</p>
      </div>

      <div className="space-y-2">
        {docs.map(doc => (
          <Link
            key={doc.slug}
            href={`/admin/docs/${doc.slug}`}
            className="block bg-[#1e293b] border border-[#334155] rounded-xl p-4 hover:border-[#38bdf8] transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">{doc.emoji}</span>
              <div>
                <p className="text-white font-medium text-sm">{doc.title}</p>
                <p className="text-[#64748b] text-xs mt-0.5">Tutorial {doc.order}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
