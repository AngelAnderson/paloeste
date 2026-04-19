import { createSupabaseBrowserClient } from './supabase-browser'

const BUCKET = 'places-images'

async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const maxWidth = 1200
    const maxHeight = 1200
    const quality = 0.8
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target?.result as string
      img.onload = () => {
        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) { height *= maxWidth / width; width = maxWidth }
        } else {
          if (height > maxHeight) { width *= maxHeight / height; height = maxHeight }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height)
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Canvas conversion failed')),
          'image/webp',
          quality
        )
      }
      img.onerror = reject
    }
    reader.onerror = reject
  })
}

export async function uploadPlaceImage(file: File): Promise<string> {
  let blob: Blob = file
  try { blob = await compressImage(file) } catch { /* use original */ }

  const ext = blob.type === 'image/webp' ? 'webp' : file.name.split('.').pop() || 'jpg'
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`

  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob)
  if (error) throw error

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)
  return data.publicUrl
}
