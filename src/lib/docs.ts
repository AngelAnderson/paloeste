import fs from 'fs'
import path from 'path'

export interface DocMeta {
  slug: string
  title: string
  order: number
  emoji: string
}

export interface Doc extends DocMeta {
  content: string
}

const DOCS_DIR = path.join(process.cwd(), 'src/content/admin-docs')

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  if (!match) return { meta: {}, body: raw }
  const meta: Record<string, string> = {}
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':')
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    meta[key] = val
  }
  return { meta, body: match[2] }
}

export function getAllDocs(): DocMeta[] {
  if (!fs.existsSync(DOCS_DIR)) return []
  const files = fs.readdirSync(DOCS_DIR).filter(f => f.endsWith('.md'))
  const docs: DocMeta[] = files.map(file => {
    const raw = fs.readFileSync(path.join(DOCS_DIR, file), 'utf-8')
    const { meta } = parseFrontmatter(raw)
    return {
      slug: file.replace(/\.md$/, ''),
      title: meta.title || file,
      order: parseInt(meta.order || '99', 10),
      emoji: meta.emoji || '📄',
    }
  })
  return docs.sort((a, b) => a.order - b.order)
}

export function getDoc(slug: string): Doc | null {
  const file = path.join(DOCS_DIR, `${slug}.md`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, 'utf-8')
  const { meta, body } = parseFrontmatter(raw)
  return {
    slug,
    title: meta.title || slug,
    order: parseInt(meta.order || '99', 10),
    emoji: meta.emoji || '📄',
    content: body,
  }
}
