import { notFound } from 'next/navigation'
import Link from 'next/link'
import { marked } from 'marked'
import { getDoc, getAllDocs } from '@/lib/docs'

export const dynamic = 'force-dynamic'

export default async function DocDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const doc = getDoc(slug)
  if (!doc) notFound()

  // Content is trusted — comes from static markdown files in our own repo (src/content/admin-docs),
  // not from user input or any external source. No XSS risk.
  const html = marked.parse(doc.content, { async: false }) as string
  const allDocs = getAllDocs()
  const currentIdx = allDocs.findIndex(d => d.slug === slug)
  const prev = currentIdx > 0 ? allDocs[currentIdx - 1] : null
  const next = currentIdx < allDocs.length - 1 ? allDocs[currentIdx + 1] : null

  return (
    <div className="max-w-3xl space-y-6">
      <Link href="/admin/docs" className="text-[#94a3b8] hover:text-white text-sm inline-flex items-center gap-1">
        ← Todos los tutoriales
      </Link>

      <div className="flex items-center gap-3">
        <span className="text-4xl">{doc.emoji}</span>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#64748b]">Tutorial {doc.order}</p>
          <h1 className="text-2xl font-bold text-white">{doc.title}</h1>
        </div>
      </div>

      <article
        className="doc-content bg-[#1e293b] border border-[#334155] rounded-xl p-6 text-[#f1f5f9]"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <div className="flex items-center justify-between gap-3 pt-4 border-t border-[#334155]">
        {prev ? (
          <Link
            href={`/admin/docs/${prev.slug}`}
            className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg p-3 hover:border-[#38bdf8]"
          >
            <p className="text-[10px] uppercase tracking-wider text-[#64748b]">← Anterior</p>
            <p className="text-sm text-white truncate">{prev.emoji} {prev.title}</p>
          </Link>
        ) : <div className="flex-1" />}
        {next ? (
          <Link
            href={`/admin/docs/${next.slug}`}
            className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg p-3 hover:border-[#38bdf8] text-right"
          >
            <p className="text-[10px] uppercase tracking-wider text-[#64748b]">Siguiente →</p>
            <p className="text-sm text-white truncate">{next.title} {next.emoji}</p>
          </Link>
        ) : <div className="flex-1" />}
      </div>
    </div>
  )
}
