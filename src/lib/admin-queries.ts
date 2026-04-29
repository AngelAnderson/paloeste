import { createSupabaseAdminClient } from './supabase-server'
import type { AdminOverview, ConversionOpportunity, RevenueMonth, AdminPlace, Prospect, BotIntelligence, SponsorROI, InboxConversation, InboxMessage, InboxContact, Relationship, RelationshipHistoryEntry, OverdueRelationship } from './types'

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

export interface UnbilledBusiness {
  business_id: string
  business_name: string
  lead_count: number
  total_cents: number
  oldest: string
  newest: string
  phone: string | null
  slug: string | null
  category: string | null
  sponsor_weight: number
  leads: { date: string; channel: string; amount_cents: number }[]
}

export async function getUnbilledLeadsByBusiness(): Promise<UnbilledBusiness[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('bot_leads')
    .select('business_id, business_name, amount_cents, created_at, channel')
    .eq('billed', false)
    .order('created_at', { ascending: false })
  if (error) throw error

  const map = new Map<string, UnbilledBusiness>()
  for (const row of (data || [])) {
    const existing = map.get(row.business_id)
    const lead = { date: row.created_at, channel: row.channel || 'sms', amount_cents: row.amount_cents || 0 }
    if (existing) {
      existing.lead_count++
      existing.total_cents += row.amount_cents || 0
      if (row.created_at < existing.oldest) existing.oldest = row.created_at
      if (row.created_at > existing.newest) existing.newest = row.created_at
      existing.leads.push(lead)
    } else {
      map.set(row.business_id, {
        business_id: row.business_id,
        business_name: row.business_name || 'Unknown',
        lead_count: 1,
        total_cents: row.amount_cents || 0,
        oldest: row.created_at,
        newest: row.created_at,
        phone: null,
        slug: null,
        category: null,
        sponsor_weight: 0,
        leads: [lead],
      })
    }
  }

  // Enrich with place data (phone, slug, category, sponsor_weight)
  const ids = Array.from(map.keys())
  if (ids.length > 0) {
    const { data: places } = await supabase
      .from('places')
      .select('id, phone, slug, category, sponsor_weight')
      .in('id', ids)
    for (const p of places || []) {
      const entry = map.get(p.id)
      if (entry) {
        entry.phone = p.phone
        entry.slug = p.slug
        entry.category = p.category
        entry.sponsor_weight = p.sponsor_weight || 0
      }
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
  // Apr 29 2026: quick-action filters
  starred?: boolean
  awaiting?: boolean
  resolved?: boolean
  hideSnoozed?: boolean // default true for normal inbox
}): Promise<InboxConversation[]> {
  const supabase = await createSupabaseAdminClient()
  let query = supabase
    .from('conversations')
    .select('id, contact, channel, line, status, needs_human, message_count, last_message_at, last_inbound_body, intent, last_intent, internal_note, contact_id, is_starred, snoozed_until, awaiting_info, resolved_at')
    .eq('line', '7711')
    .order('last_message_at', { ascending: false })
    .limit(100)

  if (filters?.needsHuman) query = query.eq('needs_human', true)
  if (filters?.channel) query = query.eq('channel', filters.channel)
  if (filters?.starred) query = query.eq('is_starred', true)
  if (filters?.awaiting) query = query.eq('awaiting_info', true)
  if (filters?.resolved === true) query = query.not('resolved_at', 'is', null)
  if (filters?.resolved === false) query = query.is('resolved_at', null)
  // Hide snoozed by default (snoozed_until in the future) — unless explicitly looking at all
  if (filters?.hideSnoozed !== false) {
    query = query.or(`snoozed_until.is.null,snoozed_until.lt.${new Date().toISOString()}`)
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

  // Fetch last message (inbound OR outbound) for each conversation
  const convoIds = (convos || []).map(c => c.id)
  let lastMsgMap = new Map<string, { body: string; direction: string }>()
  if (convoIds.length > 0) {
    // Get last message per conversation using distinct on
    const { data: lastMsgs } = await supabase
      .from('messages')
      .select('conversation_id, body, direction')
      .in('conversation_id', convoIds)
      .order('created_at', { ascending: false })
      .limit(convoIds.length * 2)
    // Take first (most recent) per conversation
    for (const m of lastMsgs || []) {
      if (!lastMsgMap.has(m.conversation_id) && m.body) {
        lastMsgMap.set(m.conversation_id, { body: m.body, direction: m.direction })
      }
    }
  }

  // Match phone numbers to business names in places table
  const phones = (convos || []).map(c => c.contact.replace('whatsapp:', ''))
  let placeMap = new Map<string, string>()
  if (phones.length > 0) {
    const { data: places } = await supabase
      .from('places')
      .select('name, phone')
      .in('phone', phones)
    for (const p of places || []) {
      if (p.phone && p.name) placeMap.set(p.phone, p.name)
    }
  }

  return (convos || []).map(c => {
    const phone = c.contact.replace('whatsapp:', '')
    const lastMsg = lastMsgMap.get(c.id)
    return {
      ...c,
      display_name: c.contact_id ? contactMap.get(c.contact_id) || null : null,
      place_name: placeMap.get(phone) || null,
      last_body: lastMsg?.body || c.last_inbound_body || null,
      last_direction: lastMsg?.direction || null,
    }
  }) as InboxConversation[]
}

export async function getConversationMessages(conversationId: string): Promise<InboxMessage[]> {
  const supabase = await createSupabaseAdminClient()
  // Fetch the LAST 200 messages (most recent) — order DESC then reverse so UI shows oldest-first
  const { data, error } = await supabase
    .from('messages')
    .select('id, conversation_id, direction, body, intent, source, channel, from, to, created_at, status, error_code')
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

// === Vitrina / Revenue Co-Pilot Queries ===

export async function getVitrinaToken(placeId: string): Promise<string | null> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('places')
    .select('vitrina_token')
    .eq('id', placeId)
    .single()
  if (error) return null
  return data?.vitrina_token || null
}

export async function getPlaceBySlugWithToken(slug: string): Promise<{ id: string; name: string; slug: string; category: string; hero_image_url: string | null; phone: string | null; website: string | null; description: string | null; plan: string | null; sponsor_weight: number; google_rating: number | null; google_review_count: number | null; opening_hours: unknown; one_liner: string | null; vitrina_token: string | null } | null> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('places')
    .select('id, name, slug, category, hero_image_url, phone, website, description, plan, sponsor_weight, google_rating, google_review_count, opening_hours, one_liner, vitrina_token')
    .eq('slug', slug)
    .single()
  if (error) return null
  return data
}

export async function getSponsorLeadsWeekly(placeId: string, weeks = 12): Promise<{ week_start: string; lead_count: number }[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_sponsor_leads_weekly', { p_place_id: placeId, p_weeks: weeks })
  if (error) throw error
  return (data || []) as { week_start: string; lead_count: number }[]
}

export async function getCategoryPosition(placeId: string): Promise<{ rank: number; total: number; category: string; searches_30d: number } | null> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_category_position', { p_place_id: placeId })
  if (error) return null
  const rows = data as { rank: number; total: number; category: string; searches_30d: number }[]
  return rows?.[0] || null
}

export async function getSponsorLeadsTotal(placeId: string): Promise<{ total: number; by_channel: { channel: string; count: number }[] }> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('bot_leads')
    .select('channel, created_at')
    .eq('business_id', placeId)
  if (error) throw error
  const rows = data || []
  const channelMap = new Map<string, number>()
  for (const r of rows) {
    const ch = r.channel || 'sms'
    channelMap.set(ch, (channelMap.get(ch) || 0) + 1)
  }
  return {
    total: rows.length,
    by_channel: Array.from(channelMap.entries()).map(([channel, count]) => ({ channel, count })).sort((a, b) => b.count - a.count),
  }
}

export async function getPlacesMissingPhotos(): Promise<{ id: string; name: string; category: string; address: string; sponsor_weight: number }[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('places')
    .select('id, name, category, address, sponsor_weight')
    .eq('status', 'open')
    .eq('visibility', 'published')
    .is('hero_image_url', null)
    .order('sponsor_weight', { ascending: false })
    .order('name')
    .limit(20)
  if (error) throw error
  return (data || []) as { id: string; name: string; category: string; address: string; sponsor_weight: number }[]
}

export async function getProfileCompleteness(place: { hero_image_url: string | null; phone: string | null; website: string | null; description: string | null; opening_hours: unknown; google_rating: number | null }): Promise<{ score: number; missing: string[] }> {
  const fields = [
    { key: 'hero_image_url', label: 'Foto principal', val: place.hero_image_url },
    { key: 'phone', label: 'Teléfono', val: place.phone },
    { key: 'website', label: 'Website', val: place.website },
    { key: 'description', label: 'Descripción', val: place.description },
    { key: 'opening_hours', label: 'Horario', val: place.opening_hours },
    { key: 'google_rating', label: 'Google Rating', val: place.google_rating },
  ]
  const missing = fields.filter(f => !f.val).map(f => f.label)
  const score = Math.round(((fields.length - missing.length) / fields.length) * 100)
  return { score, missing }
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


// ==========================================================================
// Relationships (Relationship Engine)
// ==========================================================================

export async function getRelationships(filter?: {
  type?: string
  activeOnly?: boolean
}): Promise<Relationship[]> {
  const supabase = await createSupabaseAdminClient()
  let q = supabase.from('relationships').select('*')
  if (filter?.activeOnly ?? true) q = q.eq('active', true)
  if (filter?.type && filter.type !== 'all') q = q.eq('type', filter.type)
  const { data, error } = await q.order('updated_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as Relationship[]
}

export async function getOverdueRelationships(): Promise<OverdueRelationship[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('get_overdue_relationships')
  if (error) throw new Error(error.message)
  return data as OverdueRelationship[]
}

export async function getRelationshipHistory(
  relationship_id: string
): Promise<RelationshipHistoryEntry[]> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('relationship_history')
    .select('*')
    .eq('relationship_id', relationship_id)
    .order('logged_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data as RelationshipHistoryEntry[]
}

export async function logRelationshipContact(
  rel_id: string,
  action: string,
  notes?: string
): Promise<string> {
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('log_relationship_contact', {
    rel_id,
    action_text: action,
    notes_text: notes ?? null,
    logged_by_val: 'paloeste_admin',
  })
  if (error) throw new Error(error.message)
  return data as string
}
