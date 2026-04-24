import { createSupabaseAdminClient } from './supabase-server'
import { getPlaceBySlug } from './supabase'
import type { Place } from './types'

export interface CategoryReport {
  category: string
  total_queries: number
  unique_users: number
  top_queries: { query: string; count: number; top_result?: string }[] | null
  businesses_recommended: { name: string; id: string; times_recommended: number }[] | null
  peak_hours: { hour: number; count: number }[] | null
}

export interface VitrinaData {
  place: Place
  categoryReport: CategoryReport | null
  competitors: number
  sponsorsInCategory: number
  position: number
  totalSearches: number
  uniqueUsers: number
}

export interface VitrinaStats {
  searches: number
  users: number
  position: number
  updatedAt: string
}

export async function getVitrinaData(slug: string): Promise<VitrinaData | null> {
  const place = await getPlaceBySlug(slug)
  if (!place) return null

  const supabase = await createSupabaseAdminClient()
  const category = place.category

  // Parallel queries
  const [categoryReportResult, competitorsResult, sponsorsResult] = await Promise.all([
    supabase.rpc('get_category_report', { p_category: category }).then(r => r.data as CategoryReport | null),
    supabase
      .from('places')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)
      .eq('visibility', 'published'),
    supabase
      .from('places')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)
      .eq('is_featured', true)
      .eq('visibility', 'published'),
  ])

  const competitors = competitorsResult.count ?? 0
  const sponsorsInCategory = sponsorsResult.count ?? 0

  // Calculate position: sponsors rank first, then by google_rating
  let position = 1
  if (place.is_featured) {
    position = 1
  } else {
    // Position = featured count + how many non-featured businesses have higher rating
    const { count: higherRated } = await supabase
      .from('places')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)
      .eq('visibility', 'published')
      .neq('id', place.id)
      .or(`is_featured.eq.true,google_rating.gt.${place.google_rating ?? 0}`)
    position = (higherRated ?? 0) + 1
  }

  const totalSearches = categoryReportResult?.total_queries ?? 0
  const uniqueUsers = categoryReportResult?.unique_users ?? 0

  return {
    place,
    categoryReport: categoryReportResult,
    competitors,
    sponsorsInCategory,
    position,
    totalSearches,
    uniqueUsers,
  }
}

export async function getVitrinaStats(slug: string): Promise<VitrinaStats | null> {
  const place = await getPlaceBySlug(slug)
  if (!place) return null

  const supabase = await createSupabaseAdminClient()
  const category = place.category

  const [catReport, sponsorsResult, higherRated] = await Promise.all([
    supabase.rpc('get_category_report', { p_category: category }).then(r => r.data as CategoryReport | null),
    supabase
      .from('places')
      .select('id', { count: 'exact', head: true })
      .eq('category', category)
      .eq('is_featured', true)
      .eq('visibility', 'published'),
    place.is_featured
      ? Promise.resolve({ count: 0 })
      : supabase
          .from('places')
          .select('id', { count: 'exact', head: true })
          .eq('category', category)
          .eq('visibility', 'published')
          .neq('id', place.id)
          .or(`is_featured.eq.true,google_rating.gt.${place.google_rating ?? 0}`),
  ])

  const position = place.is_featured ? 1 : ((higherRated.count ?? 0) + 1)

  return {
    searches: catReport?.total_queries ?? 0,
    users: catReport?.unique_users ?? 0,
    position,
    updatedAt: new Date().toISOString(),
  }
}

export async function getVitrinaSlugs(): Promise<string[]> {
  const supabase = await createSupabaseAdminClient()

  // Get slugs of businesses that appear in demand_signals (recommended businesses)
  const { data, error } = await supabase
    .from('demand_signals')
    .select('matched_business_id')
    .not('matched_business_id', 'is', null)
    .limit(1000)

  if (error || !data) return []

  // Get unique business IDs
  const uniqueIds = [...new Set(data.map(d => d.matched_business_id).filter(Boolean))]

  if (uniqueIds.length === 0) return []

  // Fetch slugs for those businesses
  const { data: places } = await supabase
    .from('places')
    .select('slug')
    .in('id', uniqueIds)
    .eq('visibility', 'published')

  return (places || []).map(p => p.slug).filter(Boolean)
}
