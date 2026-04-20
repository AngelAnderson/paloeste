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

export default function AdminEditarPlacePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [place, setPlace] = useState<PlaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

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

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('places')
        .select('id, name, category, address, lat, lon, gmaps_url, image_url, hero_image_url, phone, website, opening_hours, tags, description')
        .eq('id', id)
        .single()

      if (!data) { router.push('/admin/editar'); return }

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
    load()
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
      setToast('Error: ' + error.message)
    } else {
      setToast('Guardado ✓')
      setTimeout(() => setToast(null), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return <div className="text-[#64748b] text-sm py-12 text-center">Cargando...</div>
  }

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/editar" className="text-[#64748b] hover:text-white text-lg">←</Link>
        <h1 className="text-xl font-bold truncate">{place?.name}</h1>
      </div>

      <div className="space-y-5">
        {/* Photo */}
        <div>
          <Label>Foto</Label>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="w-full max-w-md h-48 object-cover rounded-xl mb-2" />
          )}
          <label className="inline-flex items-center gap-2 bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-[#475569] transition-colors">
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

        <Field label="Nombre" value={name} onChange={setName} />
        <Field label="Dirección" value={address} onChange={setAddress} placeholder="Calle 65 de Infantería #123, Cabo Rojo" />
        <Field label="Google Maps Link" value={gmapsUrl} onChange={setGmapsUrl} type="url" placeholder="https://maps.google.com/..." />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Latitud</Label>
            <input
              type="number"
              step="any"
              value={lat ?? ''}
              onChange={(e) => setLat(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
            />
          </div>
          <div>
            <Label>Longitud</Label>
            <input
              type="number"
              step="any"
              value={lon ?? ''}
              onChange={(e) => setLon(e.target.value ? Number(e.target.value) : null)}
              className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
            />
          </div>
        </div>

        <Field label="Teléfono" value={phone} onChange={setPhone} type="tel" placeholder="787-555-1234" />
        <Field label="Website" value={website} onChange={setWebsite} type="url" placeholder="https://..." />
        <Field label="Horario" value={hours} onChange={setHours} placeholder="Lun-Vie 8am-5pm, Sáb 9am-1pm" />
        <Field label="Categoría" value={category} onChange={setCategory} />
        <Field label="Tags (separados por coma)" value={tags} onChange={setTags} placeholder="pizza, delivery, familiar" />

        <div>
          <Label>Descripción</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none resize-none"
          />
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-[#0f172a] text-sm px-4 py-2 rounded-full shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}

      {/* Save */}
      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-[#38bdf8] text-[#0f172a] font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-[#7dd3fc] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <Link href="/admin/editar" className="text-[#64748b] hover:text-white text-sm py-2.5">
          Cancelar
        </Link>
      </div>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs text-[#64748b] uppercase tracking-wider mb-1.5">{children}</label>
}

function Field({
  label, value, onChange, type = 'text', placeholder,
}: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string
}) {
  return (
    <div>
      <Label>{label}</Label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2.5 text-sm text-white focus:border-[#38bdf8] focus:outline-none"
      />
    </div>
  )
}
