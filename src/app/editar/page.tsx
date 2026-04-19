'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
  status: string
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

const BADGE: Record<Completeness, { icon: string; color: string }> = {
  missing: { icon: '🔴', color: 'bg-red-50 text-red-700' },
  partial: { icon: '🟡', color: 'bg-amber-50 text-amber-700' },
  complete: { icon: '🟢', color: 'bg-green-50 text-green-700' },
}

export default function EditarPage() {
  const [places, setPlaces] = useState<PlaceRow[]>([])
  const [search, setSearch] = useState('')
  const [filterCategory, setFilterCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<'admin' | 'owner' | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  // Auth check
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/editar/login'); return }

      setUserEmail(user.email ?? null)

      // Check editor role
      const { data: editor } = await supabase
        .from('editors')
        .select('role')
        .eq('email', user.email)
        .single()

      if (editor) {
        setUserRole(editor.role as 'admin' | 'owner')
      } else {
        // Check if they have a business claim
        const { data: claims } = await supabase
          .from('business_claims')
          .select('id')
          .eq('email', user.email)
          .eq('status', 'approved')
        if (claims && claims.length > 0) {
          setUserRole('owner')
        } else {
          // No access
          router.push('/editar/login')
          return
        }
      }
    }
    checkAuth()
  }, [supabase, router])

  // Load places
  useEffect(() => {
    if (!userRole) return

    async function loadPlaces() {
      let query = supabase
        .from('places')
        .select('id, name, category, address, image_url, hero_image_url, gmaps_url, phone, status')
        .eq('status', 'open')
        .order('name')

      // If owner, filter to their claimed businesses
      if (userRole === 'owner' && userEmail) {
        const { data: claims } = await supabase
          .from('business_claims')
          .select('business_name')
          .eq('email', userEmail)
          .eq('status', 'approved')

        if (claims && claims.length > 0) {
          const names = claims.map((c: { business_name: string }) => c.business_name)
          query = query.in('name', names)
        }
      }

      const { data } = await query
      if (data) setPlaces(data)
      setLoading(false)
    }
    loadPlaces()
  }, [userRole, userEmail, supabase])

  const categories = useMemo(() => {
    const cats = new Set(places.map((p) => p.category))
    return Array.from(cats).sort()
  }, [places])

  const filtered = useMemo(() => {
    let list = places
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((p) => p.name.toLowerCase().includes(q))
    }
    if (filterCategory) {
      list = list.filter((p) => p.category === filterCategory)
    }
    // Sort: incomplete first
    return list.sort((a, b) => {
      const order: Record<Completeness, number> = { missing: 0, partial: 1, complete: 2 }
      return order[getCompleteness(a)] - order[getCompleteness(b)]
    })
  }, [places, search, filterCategory])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/editar/login')
  }

  if (loading || !userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-400 text-sm">Cargando...</div>
      </div>
    )
  }

  const stats = {
    total: places.length,
    complete: places.filter((p) => getCompleteness(p) === 'complete').length,
    missing: places.filter((p) => getCompleteness(p) === 'missing').length,
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-stone-900">Editor de Directorio</h1>
          <p className="text-sm text-stone-500">
            {stats.complete}/{stats.total} completos · {stats.missing} sin foto
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole === 'admin' && (
            <Link
              href="/editar/nuevo"
              className="bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              ➕ Nuevo
            </Link>
          )}
          <button onClick={handleLogout} className="text-sm text-stone-400 hover:text-stone-600">
            Salir
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2 mb-4">
        <input
          type="search"
          placeholder="Buscar negocio..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white border border-stone-200 rounded-lg px-2 py-2 text-sm focus:border-red-500 focus:outline-none max-w-[140px]"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((place) => {
          const comp = getCompleteness(place)
          const badge = BADGE[comp]
          const missing = getMissing(place)

          return (
            <Link
              key={place.id}
              href={`/editar/${place.id}`}
              className="flex items-center gap-3 bg-white border border-stone-200 rounded-xl p-3 hover:border-stone-300 transition-colors"
            >
              {/* Photo thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-stone-100 flex-shrink-0 overflow-hidden">
                {(place.image_url || place.hero_image_url) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={place.image_url || place.hero_image_url || ''}
                    alt={place.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-stone-300 text-lg">📷</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-stone-900 text-sm truncate">{place.name}</div>
                <div className="text-xs text-stone-400 truncate">{place.category}</div>
                {missing.length > 0 && (
                  <div className="text-xs text-stone-400 mt-0.5">
                    Falta: {missing.join(', ')}
                  </div>
                )}
              </div>

              {/* Badge */}
              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.color}`}>
                {badge.icon}
              </span>
            </Link>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-stone-400 py-12 text-sm">
          No se encontraron negocios
        </div>
      )}
    </div>
  )
}
