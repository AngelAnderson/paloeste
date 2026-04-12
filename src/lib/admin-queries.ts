import { createSupabaseAdminClient } from './supabase-server'
import type { AdminOverview, ConversionOpportunity, RevenueMonth, AdminPlace, Prospect, BotIntelligence, SponsorROI, InboxConversation, InboxMessage, InboxContact } from './types'

// Demand Intelligence
export async function getDemandInsights() {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_demand_insights')
  if (error) throw error
  return data
}

export async function getPublicDemandStats() {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_public_demand_stats')
  if (error) throw error
  return data
}

export async function exportDemandCSV() {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('demand_signals')
    .select('query_text,query_normalized,category,matched,matched_business_name,total_alternatives,town,channel,created_at')
    .order('created_at', { ascending: false })
    .limit(10000)
  if (error) throw error
  return data || []
}

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

// === Inbox / CRM Queries ===

export async function getInboxConversations(filters?: {
  needsHuman?: boolean
  channel?: string
  search?: string
}): Promise<InboxConversation[]> {
  const supabase = await createSupabaseAdminClient()
  let query = supabase
    .from('conversations')
    .select('id, contact, channel, line, status, needs_human, message_count, last_message_at, last_inbound_body, intent, last_intent, internal_note, contact_id')
    .eq('line', '7711')
    .order('last_message_at', { ascending: false })
    .limit(100)

  if (filters?.needsHuman) {
    query = query.eq('needs_human', true)
  }
  if (filters?.channel) {
    query = query.eq('channel', filters.channel)
  }

  // For text search, we need to query across multiple places:
  // 1. conversation.contact (phone)
  // 2. conversation.last_inbound_body
  // 3. contact.display_name (via join)
  // 4. messages.body (via separate query)
  let matchingConvIdsFromMessages: string[] | null = null
  let matchingConvIdsFromContacts: string[] | null = null
  if (filters?.search) {
    const term = `%${filters.search}%`
    // Find conversations where ANY message body matches the search
    const { data: msgMatches } = await supabase
      .from('messages')
      .select('conversation_id')
      .ilike('body', term)
      .limit(500)
    matchingConvIdsFromMessages = [...new Set((msgMatches || []).map(m => m.conversation_id))]

    // Find contact_ids whose display_name matches
    const { data: contactMatches } = await supabase
      .from('contacts')
      .select('id')
      .ilike('display_name', term)
      .limit(200)
    const matchingContactIds = (contactMatches || []).map(c => c.id)

    if (matchingContactIds.length > 0) {
      const { data: convByContact } = await supabase
        .from('conversations')
        .select('id')
        .in('contact_id', matchingContactIds)
        .eq('line', '7711')
      matchingConvIdsFromContacts = (convByContact || []).map(c => c.id)
    } else {
      matchingConvIdsFromContacts = []
    }

    // Combine: phone match OR last_inbound_body match OR msg body match OR contact name match
    const orFilters = [
      `contact.ilike.${term}`,
      `last_inbound_body.ilike.${term}`,
    ]
    const allIds = [
      ...(matchingConvIdsFromMessages || []),
      ...(matchingConvIdsFromContacts || []),
    ]
    if (allIds.length > 0) {
      orFilters.push(`id.in.(${allIds.join(',')})`)
    }
    query = query.or(orFilters.join(','))
  }

  const { data: convos, error } = await query
  if (error) throw error

  // Fetch display names for contacts that have contact_id
  const contactIds = (convos || []).map(c => c.contact_id).filter(Boolean) as string[]
  let contactMap = new Map<string, string>()
  if (contactIds.length > 0) {
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id, display_name')
      .in('id', contactIds)
    for (const ct of contacts || []) {
      if (ct.display_name) contactMap.set(ct.id, ct.display_name)
    }
  }

  return (convos || []).map(c => ({
    ...c,
    display_name: c.contact_id ? contactMap.get(c.contact_id) || null : null,
  })) as InboxConversation[]
}

export async function getConversationMessages(conversationId: string): Promise<InboxMessage[]> {
  const supabase = await createSupabaseAdminClient()
  // Fetch the LAST 200 messages (most recent) — order DESC then reverse so UI shows oldest-first
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, direction, body, intent, source, channel, from, to, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  // Reverse to show chronological order (oldest first) in the thread UI
  return ((data || []) as InboxMessage[]).reverse()
}

export async function getInboxContact(contactId: string): Promise<InboxContact | null> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('contacts')
    .select('id, phone_e164, display_name, language, tags, notes_internal, notes, qualified, business_type, last_seen_at, created_at')
    .eq('id', contactId)
    .single()
  if (error) return null
  return data as InboxContact
}

export async function updateContactNotes(contactId: string, notes: string): Promise<void> {
  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase
    .from('contacts')
    .update({ notes_internal: notes, updated_at: new Date().toISOString() })
    .eq('id', contactId)
  if (error) throw error
}

export interface MessageFeedback {
  id: string
  message_id: number
  conversation_id: string
  flagged_by: string | null
  reason: string
  suggested_response: string
  original_body: string | null
  status: string
  created_at: string
}

export async function getMessageFeedback(status: string = 'pending'): Promise<MessageFeedback[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('message_feedback')
    .select('id, message_id, conversation_id, flagged_by, reason, suggested_response, original_body, status, created_at')
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(200)
  if (error) throw error
  return (data || []) as MessageFeedback[]
}

export async function updateConversationStatus(conversationId: string, status: string): Promise<void> {
  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase
    .from('conversations')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', conversationId)
  if (error) throw error
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
