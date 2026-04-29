import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

// Force dynamic so sitemap always fetches live data from Supabase at request time
// (not frozen at build time when the query may return 0 results)
export const dynamic = 'force-dynamic'

const BASE_URL = 'https://paloeste.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Use service role key to bypass RLS and get all published places.
  // Falls back to anon key if service role key is not set (e.g. local dev).
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Fetch all published places regardless of status (open/closed).
  // Removing the status filter increases coverage from ~3,909 to ~3,920 places.
  const { data: places } = await supabase
    .from('places')
    .select('slug, updated_at, category')
    .eq('visibility', 'published')
    .not('slug', 'is', null)
    .neq('slug', '')
    .order('updated_at', { ascending: false })
    .limit(5000)

  const businessPages: MetadataRoute.Sitemap = (places ?? []).map((place) => ({
    url: `${BASE_URL}/negocio/${place.slug}`,
    lastModified: place.updated_at ? new Date(place.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Unique category pages for directory filtering
  const categories = [...new Set((places ?? []).map((p) => p.category).filter(Boolean))]
  const categoryPages: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${BASE_URL}/directorio?categoria=${encodeURIComponent(cat)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/directorio`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/donde-comer`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/eventos`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/revista`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/buscar`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.5,
    },
  ]

  return [...staticPages, ...categoryPages, ...businessPages]
}
