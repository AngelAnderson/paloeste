'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { uploadPlaceImage } from '@/lib/image-upload'

export default function AdminNuevoNegocioPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [gmapsUrl, setGmapsUrl] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [hours, setHours] = useState('')
  const [category, setCategory] = useState('')
  const [tags, setTags] = useState('')
  const [description, setDescription] = useState('')

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

  async function handleCreate() {
    if (!name.trim() || !category.trim()) {
      setToast('Nombre y categoría son requeridos')
      return
    }

    setSaving(true)
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

    const row = {
      name: name.trim(),
      slug,
      category: category.trim(),
      address: address || null,
      gmaps_url: gmapsUrl || null,
      image_url: imageUrl || null,
      hero_image_url: imageUrl || null,
      phone: phone || null,
      website: website || null,
      opening_hours: hours ? { formatted: hours, source: 'editor', verified_at: new Date().toISOString() } : null,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      description: description || null,
      status: 'open',
      visibility: 'published',
      plan: 'free',
      sponsor_weight: 0,
      is_featured: false,
    }

    const { data, error } = await supabase.from('places').insert(row).select('id').single()

    if (error) {
      setToast('Error: ' + error.message)
      setSaving(false)
    } else if (data) {
      setToast('Negocio creado ✓')
      setTimeout(() => router.push(`/admin/editar/${data.id}`), 1000)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/editar" className="text-[#64748b] hover:text-white text-lg">←</Link>
        <h1 className="text-xl font-bold">Agregar negocio</h1>
      </div>

      <div className="space-y-5">
        <div>
          <Label>Foto</Label>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="w-full max-w-md h-48 object-cover rounded-xl mb-2" />
          )}
          <label className="inline-flex items-center gap-2 bg-[#1e293b] border border-[#334155] rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-[#475569] transition-colors">
            <span>{uploading ? 'Subiendo...' : '📸 Agregar foto'}</span>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhotoUpload} disabled={uploading} className="hidden" />
          </label>
        </div>

        <Field label="Nombre *" value={name} onChange={setName} />
        <Field label="Categoría *" value={category} onChange={setCategory} />
        <Field label="Dirección" value={address} onChange={setAddress} />
        <Field label="Google Maps Link" value={gmapsUrl} onChange={setGmapsUrl} type="url" placeholder="https://maps.google.com/..." />
        <Field label="Teléfono" value={phone} onChange={setPhone} type="tel" />
        <Field label="Website" value={website} onChange={setWebsite} type="url" />
        <Field label="Horario" value={hours} onChange={setHours} placeholder="Lun-Vie 8am-5pm" />
        <Field label="Tags (separados por coma)" value={tags} onChange={setTags} />
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

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-white text-[#0f172a] text-sm px-4 py-2 rounded-full shadow-lg z-50 font-medium">
          {toast}
        </div>
      )}

      <div className="mt-6">
        <button
          onClick={handleCreate}
          disabled={saving}
          className="bg-[#38bdf8] text-[#0f172a] font-semibold rounded-lg px-6 py-2.5 text-sm hover:bg-[#7dd3fc] disabled:opacity-50 transition-colors"
        >
          {saving ? 'Creando...' : 'Crear negocio'}
        </button>
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
