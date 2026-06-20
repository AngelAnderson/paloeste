import fs from 'fs'
import path from 'path'

export interface DashMeta { slug: string; title: string; emoji: string }
export interface Dash extends DashMeta { html: string }

const DIR = path.join(process.cwd(), 'src/content/admin-dashboards')
const TITLES: Record<string, { title: string; emoji: string }> = {
  tablero: { title: 'Tablero de Mando', emoji: '🛰️' },
  calendario: { title: 'Calendario de Contenido', emoji: '🗓️' },
}

export function getAllDashboards(): DashMeta[] {
  if (!fs.existsSync(DIR)) return []
  return fs.readdirSync(DIR).filter(f => f.endsWith('.html')).map(f => {
    const slug = f.replace(/\.html$/, '')
    const t = TITLES[slug] || { title: slug, emoji: '📊' }
    return { slug, ...t }
  })
}

export function getDashboard(slug: string): Dash | null {
  const file = path.join(DIR, `${slug}.html`)
  if (!fs.existsSync(file)) return null
  const t = TITLES[slug] || { title: slug, emoji: '📊' }
  return { slug, ...t, html: fs.readFileSync(file, 'utf-8') }
}
