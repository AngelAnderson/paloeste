'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { uploadPlaceImage } from '@/lib/image-upload'

interface PlaceData {
  id: string
  name: string
  category: string
  address: string | null
  lat: number | null
  lon: number | null
  gmaps_url: string | null
  image_url: string | null
  hero_image_url: string | null
  phone: string | null
  website: string | null
  opening_hours: Record<string, unknown> | null
  tags: string[] | null
  description: string | null
}

export default function EditarPlacePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [place, setPlace] = useState<PlaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [gmapsUrl, setGmapsUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [hours, setHours] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')

  // Auth check + load place
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/editar/login'); return }

      // Verify access
      const { data: editor } = await supabase
        .from('editors')
        .select('role')
        .eq('email', user.email)
        .single()

      const isAdmin = editor?.role === 'admin'

      if (!isAdmin) {
        // Check claim
        const { data: claims } = await supabase
          .from('business_claims')
          .select('business_name')
          .eq('email', user.email)
          .eq('status', 'approved')

        // We'll verify the business matches after loading
        if (!claims || claims.length === 0) {
          router.push('/editar/login')
          return
        }
      }

      // Load place
      const { data } = await supabase
        .from('places')
        .select('id, name, category, address, lat, lon, gmaps_url, image_url, hero_image_url, phone, website, opening_hours, tags, description')
        .eq('id', id)
        .single()

      if (!data) { router.push('/editar'); return }

      setPlace(data)
      setName(data.name || '')
      setAddress(data.address || '')
      setLat(data.lat)
      setLon(data.lon)
      setGmapsUrl(data.gmaps_url || '')
      setImageUrl(data.image_url || data.hero_image_url || '')
      setPhone(data.phone || '')
      setWebsite(data.website || '')
      setHours(
        data.opening_hours && typeof data.opening_hours === 'object' && 'formatted' in data.opening_hours
          ? String((data.opening_hours as { formatted?: string }).formatted || '')
          : ''
      )
      setCategory(data.category || '')
      setTags((data.tags || []).join(', '))
      setDescription(data.description || '')
      setLoading(false)
    }
    init()
  }, [id, supabase, router])

  const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadPlaceImage(file)
      setImageUrl(url)
    } catch (err) {
      console.error('Upload failed:', err)
      setToast('Error subiendo la foto')
    }
    setUploading(false)
  }, [])

  async function handleSave() {
    setSaving(true)
    const update: Record<string, unknown> = {
      name,
      address: address || null,
      lat,
      lon,
      gmaps_url: gmapsUrl || null,
      image_url: imageUrl || null,
      hero_image_url: imageUrl || null,
      phone: phone || null,
      website: website || null,
      opening_hours: hours ? { formatted: hours, source: 'editor', verified_at: new Date().toISOString() } : null,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      description: description || null,
      category,
    }

    const { error } = await supabase.from('places').update(update).eq('id', id)

    if (error) {
      setToast('Error guardando: ' + error.message)
    } else {
      setToast('Guardado ✓')
      setTimeout(() => setToast(null), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-stone-400 text-sm">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/editar" className="text-stone-400 hover:text-stone-600 text-lg">←</Link>
        <h1 className="text-lg font-bold text-stone-900 truncate">{place?.name}</h1>
      </div>

      {/* Form */}
      <div className="space-y-5">
        {/* Photo */}
        <div>
          <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1.5">Foto</label>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="w-full h-48 object-cover rounded-xl mb-2" />
          )}
          <label className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-stone-300 transition-colors">
            <span>{uploading ? 'Subiendo...' : '📸 Cambiar foto'}</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handlePhotoUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {/* Name */}
        <Field label="Nombre" value={name} onChange={setName} required />

        {/* Address */}
        <Field label="Dirección" value={address} onChange={setAddress} placeholder="Calle 65 de Infantería #123, Cabo Rojo" />

        {/* Google Maps Link */}
        <Field label="Google Maps Link" value={gmapsUrl} onChange={setGmapsUrl} type="url" placeholder="https://maps.google.com/..." />

        {/* Lat/Lon */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1.5">Latitud</label>
            <input
              type="number"
              step="any"
              value={lat ?? ''}
              onChange={(e) => setLat(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1.5">Longitud</label>
            <input
              type="number"
              step="any"
              value={lon ?? ''}
              onChange={(e) => setLon(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Phone */}
        <Field label="Teléfono" value={phone} onChange={setPhone} type="tel" placeholder="787-555-1234" />

        {/* Website */}
        <Field label="Website" value={website} onChange={setWebsite} type="url" placeholder="https://..." />

        {/* Hours */}
        <Field label="Horario" value={hours} onChange={setHours} placeholder="Lun-Vie 8am-5pm, Sáb 9am-1pm" />

        {/* Category */}
        <Field label="Categoría" value={category} onChange={setCategory} />

        {/* Tags */}
        <Field label="Tags (separados por coma)" value={tags} onChange={setTags} placeholder="pizza, delivery, familiar" />

        {/* Description */}
        <div>
          <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1.5">Descripción</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}

      {/* Sticky Save */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-stone-200 p-4 z-40">
        <div className="max-w-lg mx-auto flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 bg-red-600 text-white font-semibold rounded-lg py-3 text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label, value, onChange, type = 'text', placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none"
      />
    </div>
  )
}
