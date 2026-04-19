'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { uploadPlaceImage } from '@/lib/image-upload'

export default function NuevoNegocioPage() {
  const router = useRouter()
  const supabase = useMemo(() => createSupabaseBrowserClient(), [])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Form
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

  // Auth — admin only for creating new
  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/editar/login'); return }

      const { data: editor } = await supabase
        .from('editors')
        .select('role')
        .eq('email', user.email)
        .single()

      if (editor?.role !== 'admin') {
        router.push('/editar')
        return
      }
      setLoading(false)
    }
    check()
  }, [supabase, router])

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
      setTimeout(() => router.push(`/editar/${data.id}`), 1000)
    }
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
      <div className="flex items-center gap-3 mb-6">
        <Link href="/editar" className="text-stone-400 hover:text-stone-600 text-lg">←</Link>
        <h1 className="text-lg font-bold text-stone-900">Agregar negocio</h1>
      </div>

      <div className="space-y-5">
        {/* Photo */}
        <div>
          <label className="block text-xs text-stone-500 uppercase tracking-wider mb-1.5">Foto</label>
          {imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrl} alt={name} className="w-full h-48 object-cover rounded-xl mb-2" />
          )}
          <label className="inline-flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-4 py-2.5 text-sm cursor-pointer hover:border-stone-300 transition-colors">
            <span>{uploading ? 'Subiendo...' : '📸 Agregar foto'}</span>
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

        <Field label="Nombre *" value={name} onChange={setName} required />
        <Field label="Categoría *" value={category} onChange={setCategory} required />
        <Field label="Dirección" value={address} onChange={setAddress} />
        <Field label="Google Maps Link" value={gmapsUrl} onChange={setGmapsUrl} type="url" placeholder="https://maps.google.com/..." />
        <Field label="Teléfono" value={phone} onChange={setPhone} type="tel" />
        <Field label="Website" value={website} onChange={setWebsite} type="url" />
        <Field label="Horario" value={hours} onChange={setHours} placeholder="Lun-Vie 8am-5pm" />
        <Field label="Tags (separados por coma)" value={tags} onChange={setTags} />
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

      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-stone-900 text-white text-sm px-4 py-2 rounded-full shadow-lg z-50">
          {toast}
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-stone-200 p-4 z-40">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleCreate}
            disabled={saving}
            className="w-full bg-red-600 text-white font-semibold rounded-lg py-3 text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Creando...' : 'Crear negocio'}
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
