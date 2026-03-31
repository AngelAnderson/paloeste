import { createSupabaseAdminClient } from './supabase-server'
import type { AdminOverview, ConversionOpportunity, RevenueMonth, AdminPlace, Prospect, BotIntelligence, SponsorROI } from './types'

export async function getAdminOverview(): Promise<AdminOverview> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_admin_overview')
  if (error) throw error
  return data as AdminOverview
}

export async function getConversionOpportunities(minLeads = 3): Promise<ConversionOpportunity[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_conversion_opportunities', { min_leads: minLeads })
  if (error) throw error
  return (data || []) as ConversionOpportunity[]
}

export async function getRevenueByMonth(): Promise<RevenueMonth[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_revenue_by_month')
  if (error) throw error
  return (data || []) as RevenueMonth[]
}

export async function getAdminPlaces(): Promise<AdminPlace[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('places')
    .select('id, name, slug, category, plan, sponsor_weight, is_featured, is_verified, quality_tier, visibility, description, phone, website, hero_image_url, lat, lon, embedding, created_at')
    .order('sponsor_weight', { ascending: false })
    .order('name')
  if (error) throw error
  return (data || []) as AdminPlace[]
}

export async function getUnbilledLeadsByBusiness(): Promise<{ business_id: string; business_name: string; lead_count: number; total_cents: number; oldest: string; newest: string }[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('bot_leads')
    .select('business_id, business_name, amount_cents, created_at')
    .eq('billed', false)
    .order('created_at', { ascending: false })
  if (error) throw error

  // Aggregate in JS since we can't use get_unbilled_leads for all businesses at once
  const map = new Map<string, { business_id: string; business_name: string; lead_count: number; total_cents: number; oldest: string; newest: string }>()
  for (const row of (data || [])) {
    const existing = map.get(row.business_id)
    if (existing) {
      existing.lead_count++
      existing.total_cents += row.amount_cents || 0
      if (row.created_at < existing.oldest) existing.oldest = row.created_at
      if (row.created_at > existing.newest) existing.newest = row.created_at
    } else {
      map.set(row.business_id, {
        business_id: row.business_id,
        business_name: row.business_name || 'Unknown',
        lead_count: 1,
        total_cents: row.amount_cents || 0,
        oldest: row.created_at,
        newest: row.created_at,
      })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.total_cents - a.total_cents)
}

export async function getTrendingCategories(): Promise<{ emoji: string; category: string; count: number }[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_trending_categories')
  if (error) throw error
  return (data || []) as { emoji: string; category: string; count: number }[]
}

export async function getSponsorPlaces(): Promise<AdminPlace[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('places')
    .select('id, name, slug, category, plan, sponsor_weight, is_featured, is_verified, quality_tier, visibility, description, phone, website, hero_image_url, lat, lon, embedding, created_at')
    .gt('sponsor_weight', 0)
    .order('sponsor_weight', { ascending: false })
  if (error) throw error
  return (data || []) as AdminPlace[]
}

export async function getProspects(): Promise<Prospect[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .order('updated_at', { ascending: false })
  if (error) throw error
  return (data || []) as Prospect[]
}

export async function getBotIntelligence(days = 7): Promise<BotIntelligence> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_bot_intelligence', { days_back: days })
  if (error) throw error
  return data as BotIntelligence
}

export async function getSponsorROI(): Promise<SponsorROI[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_sponsor_roi')
  if (error) throw error
  return (data || []) as SponsorROI[]
}

export async function getUpcomingEventsWithoutContent(): Promise<{ id: string; title: string; start_time: string; category: string; location_name: string }[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('events')
    .select('id, title, start_time, category, location_name')
    .in('status', ['active', 'approved', 'published'])
    .gt('start_time', new Date().toISOString())
    .order('start_time', { ascending: true })
  if (error) throw error
  return (data || []) as { id: string; title: string; start_time: string; category: string; location_name: string }[]
}
