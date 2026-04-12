export interface Coordinates {
  lat: number;
  lng: number;
}

export interface DaySchedule {
  day: number;
  open: string;
  close: string;
  isClosed: boolean;
}

export interface Place {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  subcategory?: string;
  tags: string[];
  address: string;
  coords?: Coordinates;
  gmaps_url?: string;
  hero_image_url?: string;
  phone: string;
  website?: string;
  status: "open" | "closed" | "pending";
  plan: "free" | "basic" | "pro" | "enterprise";
  sponsor_weight: number;
  is_featured: boolean;
  is_mobile?: boolean;
  price_level?: string;
  vibe?: string[];
  is_verified?: boolean;
  one_liner?: string;
  local_tip?: string;
  angel_rating?: number;
  quality_tier?: string;
  opening_hours?: {
    type?: "fixed" | "24_7" | "sunrise_sunset";
    note?: string;
    formatted?: string;
    structured?: DaySchedule[];
  };
  lat?: number;
  lon?: number;
  created_at?: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  category: string;
  start_time: string;
  end_time?: string;
  location_name: string;
  place_id?: string;
  image_url?: string;
  status: string;
  is_featured: boolean;
  family_friendly: boolean;
}

export interface CategoryInfo {
  id: string;
  label_es: string;
  label_en: string;
  icon: string;
  color: string;
  order_index: number;
}

// === Admin Types ===

export interface AdminOverview {
  total_places: number
  places_published: number
  places_with_gps: number
  places_with_embedding: number
  places_with_description: number
  places_with_phone: number
  places_with_image: number
  places_with_website: number
  active_sponsors: number
  total_leads_7d: number
  total_leads_30d: number
  unbilled_leads_total: number
  unbilled_leads_count: number
  unique_users_7d: number
  unique_users_30d: number
  messages_7d: number
  messages_30d: number
  places_by_category: { category: string; count: number }[]
  places_by_plan: { plan: string; count: number }[]
}

export interface ConversionOpportunity {
  place_id: string
  name: string
  category: string
  plan: string | null
  lead_count: number
  total_value_cents: number
  last_lead_date: string
  has_billing: boolean
}

export interface RevenueMonth {
  month: string
  billed_count: number
  billed_cents: number
  unbilled_count: number
  unbilled_cents: number
}

export interface AdminPlace {
  id: string
  name: string
  slug: string
  category: string
  plan: string | null
  sponsor_weight: number
  is_featured: boolean
  is_verified: boolean
  quality_tier: string | null
  visibility: string
  description: string | null
  phone: string | null
  website: string | null
  hero_image_url: string | null
  lat: number | null
  lon: number | null
  embedding: unknown
  created_at: string
}

export interface Prospect {
  id: string
  place_id: string | null
  business_name: string
  contact_name: string | null
  contact_phone: string | null
  contact_method: string | null
  stage: string
  proposed_plan: string | null
  proposed_amount_cents: number | null
  notes: string | null
  next_action: string | null
  next_action_date: string | null
  last_contact_at: string | null
  created_at: string
  updated_at: string
}

export interface BotIntelligence {
  intent_distribution: { intent: string; count: number }[]
  top_queries: { query: string; count: number }[]
  daily_volume: { day: string; inbound: number; outbound: number }[]
  user_growth: { month: string; new_users: number }[]
  fail_rate: { total: number; failures: number; rate: number }
}

export interface SponsorROI {
  place_id: string
  name: string
  category: string
  sponsor_weight: number
  plan: string | null
  leads_30d: number
  leads_total: number
  queries_matched_30d: number
  spotlight_count: number
  last_spotlight: string | null
  profile_completeness: number
}

// === Inbox / CRM Types ===

export interface InboxConversation {
  id: string
  contact: string
  channel: string
  line: string
  status: string | null
  needs_human: boolean
  message_count: number
  last_message_at: string
  last_inbound_body: string | null
  intent: string | null
  last_intent: string | null
  internal_note: string | null
  display_name: string | null
  contact_id: string | null
}

export interface InboxMessage {
  id: number
  conversation_id: string
  direction: string
  body: string | null
  intent: string | null
  source: string | null
  channel: string
  from: string | null
  to: string | null
  created_at: string
}

export interface InboxContact {
  id: string
  phone_e164: string
  display_name: string | null
  language: string | null
  tags: string[] | null
  notes_internal: string | null
  notes: string | null
  qualified: boolean | null
  business_type: string | null
  last_seen_at: string | null
  created_at: string
}
