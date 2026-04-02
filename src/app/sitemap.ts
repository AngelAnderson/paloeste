import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const BASE_URL = 'https://paloeste.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: places } = await supabase
    .from('places')
    .select('slug, updated_at')
    .eq('visibility', 'published')
    .eq('status', 'open')
    .order('updated_at', { ascending: false })

  const businessPages: MetadataRoute.Sitemap = (places ?? []).map((place) => ({
    url: `${BASE_URL}/negocio/${place.slug}`,
    lastModified: place.updated_at ? new Date(place.updated_at) : new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/directorio`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/donde-comer`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/eventos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/revista`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  return [...staticPages, ...businessPages]
}
