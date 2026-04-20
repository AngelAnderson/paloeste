'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

interface PlaceRow {
  id: string
  name: string
  category: string
  address: string | null
  image_url: string | null
  hero_image_url: string | null
  gmaps_url: string | null
  phone: string | null
}

type Completeness = 'complete' | 'partial' | 'missing'

function getCompleteness(p: PlaceRow): Completeness {
  const hasPhoto = !!(p.image_url || p.hero_image_url)
  const hasAddress = !!p.address
  const hasGmaps = !!p.gmaps_url
  const hasPhone = !!p.phone
  if (hasPhoto && hasAddress && hasGmaps && hasPhone) return 'complete'
  if (!hasPhoto) return 'missing'
  return 'partial'
}

function getMissing(p: PlaceRow): string[] {
  const m: string[] = []
  if (!p.image_url && !p.hero_image_url) m.push('foto')
  if (!p.address) m.push('dirección')
  if (!p.gmaps_url) m.push('Google Maps')
  if (!p.phone) m.push('teléfono')
  return m
}

const BADGE: Record<Completeness, { icon: string; cls: string }> = {
  missing: { icon: '🔴', cls: 'bg-red-500/10 text-red-400' },
  partial: { icon: '🟡', cls: 'bg-amber-500/10 text-amber-400' },
  complete: { icon: '🟢', cls: 'bg-green-500/10 text-green-400' },
}

export default function AdminEditarPage() {
  const [places, setPlaces] = useState<PlaceRow[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('places')
        .select('id, name, category, address, image_url, hero_image_url, gmaps_url, phone')
        .eq('status', 'open')
        .order('name')
      if (data) setPlaces(data)
      setLoading(false)
    }
    load()
  }, [supabase])

  const categories = useMemo(() => {
    const cats = new Set(places.map((p) => p.category))
    return Array.from(cats).sort()
  }, [places])

  const filtered = useMemo(() => {
    let list = places
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q))
    }
    if (filterCategory) {
      list = list.filter((p) => p.category === filterCategory)
    }
    return list.sort((a, b) => {
      const order: Record<Completeness, number> = { missing: 0, partial: 1, complete: 2 }
      return order[getCompleteness(a)] - order[getCompleteness(b)]
    })
  }, [places, search, filterCategory])

  const stats = {
    total: places.length,
    complete: places.filter((p) => getCompleteness(p) === 'complete').length,
    missing: places.filter((p) => getCompleteness(p) === 'missing').length,
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Editar Directorio</h1>
          <p className="text-[#64748b] text-sm">
            {stats.complete}/{stats.total} completos · {stats.missing} sin foto
          </p>
        </div>
        <Link
          href="/admin/editar/nuevo"
          className="bg-[#38bdf8] text-[#0f172a] text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#7dd3fc] transition-colors"
        >
          ➕ Nuevo
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <input
          type="search"
          placeholder="Buscar negocio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-[#1e293b] border border-[#334155] rounded-lg px-2 py-2 text-sm text-white focus:border-[#38bdf8] focus:outline-none max-w-[160px]"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-[#64748b] text-sm py-12 text-center">Cargando...</div>
      ) : (
        <div className="space-y-1">
          {filtered.map((place) => {
            const comp = getCompleteness(place)
            const badge = BADGE[comp]
            const missing = getMissing(place)

            return (
              <Link
                key={place.id}
                href={`/admin/editar/${place.id}`}
                className="flex items-center gap-3 bg-[#1e293b] border border-[#334155] rounded-xl p-3 hover:border-[#475569] transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-[#0f172a] flex-shrink-0 overflow-hidden">
                  {(place.image_url || place.hero_image_url) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={place.image_url || place.hero_image_url || ''}
                      alt={place.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#334155] text-sm">📷</div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white text-sm truncate">{place.name}</div>
                  <div className="text-xs text-[#64748b] truncate">{place.category}</div>
                  {missing.length > 0 && (
                    <div className="text-xs text-[#475569] mt-0.5">Falta: {missing.join(', ')}</div>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.icon}</span>
              </Link>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center text-[#64748b] py-12 text-sm">No se encontraron negocios</div>
          )}
        </div>
      )}
    </div>
  )
}
