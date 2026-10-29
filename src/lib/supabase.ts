import { createClient } from "@supabase/supabase-js";
import { Place, Event } from "./types";

type RpcClient = ReturnType<typeof createClient> & {
  rpc: (
    fn: string,
    args?: Record<string, unknown>
  ) => Promise<{ data: unknown; error: { message: string } | null }>
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: ReturnType<typeof createClient> | null = null

function hasSupabaseConfig() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase public env vars are not configured")
  }
  supabaseClient ??= createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

export const supabase = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    return Reflect.get(getSupabaseClient(), prop)
  },
});

// 12 oct 2026: nunca select("*") en places: arrastra el embedding de 768 dims y costaba
// ~3.4 h de base de datos al día (382-917 ms por llamada). Si una página necesita otra
// columna, añádela aquí.
const PLACE_COLUMNS =
  "id,name,slug,description,category,subcategory,tags,address,gmaps_url,hero_image_url,image_url,phone,website,municipality,municipality_id,status,plan,sponsor_weight,is_featured,price_level,vibe,is_verified,verified_at,one_liner,local_tip,angel_rating,google_rating,google_review_count,quality_tier,opening_hours,lat,lon,visibility,created_at,updated_at,amenities,barrio,last_verified_at,verification_source";

export async function getPlaces(category?: string): Promise<Place[]> {
  if (!hasSupabaseConfig()) return []

  let query = getSupabaseClient()
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("visibility", "published")
    .neq("quality_tier", "hidden")
    .order("sponsor_weight", { ascending: false })
    .order("name");

  if (category) {
    query = query.ilike("category", category);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Place[]) || [];
}

export async function getPlaceBySlug(slug: string): Promise<Place | null> {
  if (!hasSupabaseConfig()) return null

  const { data, error } = await getSupabaseClient()
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("slug", slug)
    .eq("visibility", "published")
    .single();

  if (error) return null;
  return data as Place;
}

export async function getFeaturedPlaces(): Promise<Place[]> {
  if (!hasSupabaseConfig()) return []

  const { data, error } = await getSupabaseClient()
    .from("places")
    .select(PLACE_COLUMNS)
    .eq("is_featured", true)
    .eq("visibility", "published")
    .neq("quality_tier", "hidden")
    .order("sponsor_weight", { ascending: false })
    .limit(6);

  if (error) throw error;
  return (data as Place[]) || [];
}

export async function searchPlaces(
  queryEmbedding: number[],
  matchCount: number = 5
): Promise<Place[]> {
  if (!hasSupabaseConfig()) return []

  const { data, error } = await (getSupabaseClient() as unknown as RpcClient).rpc("match_places_v3", {
    query_embedding: queryEmbedding,
    match_threshold: 0.3,
    match_count: matchCount,
  });

  if (error) throw error;
  return (data as Place[]) || [];
}

export async function searchNearby(
  lat: number,
  lon: number,
  radiusKm: number = 5,
  category?: string
): Promise<Place[]> {
  if (!hasSupabaseConfig()) return []

  const { data, error } = await (getSupabaseClient() as unknown as RpcClient).rpc("match_places_nearby", {
    p_lat: lat,
    p_lon: lon,
    p_radius_km: radiusKm,
    ...(category ? { p_category: category } : {}),
  });

  if (error) throw error;
  return (data as Place[]) || [];
}

export async function getUpcomingEvents(): Promise<Event[]> {
  if (!hasSupabaseConfig()) return []

  const { data, error } = await getSupabaseClient()
    .from("events")
    .select("*")
    .in("status", ["active", "approved", "published"])
    .order("start_time", { ascending: true });

  if (error) throw error;
  return (data as Event[]) || [];
}

export async function getAllEvents(): Promise<Event[]> {
  if (!hasSupabaseConfig()) return []

  const { data, error } = await getSupabaseClient()
    .from("events")
    .select("*")
    .in("status", ["active", "approved", "published", "archived"])
    .order("start_time", { ascending: false });

  if (error) throw error;
  return (data as Event[]) || [];
}

export async function getAllSlugs(): Promise<string[]> {
  if (!hasSupabaseConfig()) return []

  const { data, error } = await getSupabaseClient()
    .from("places")
    .select("slug")
    .eq("visibility", "published")
    .neq("quality_tier", "hidden");

  if (error) throw error;
  return ((data || []) as { slug?: string }[]).map((p) => p.slug).filter(Boolean) as string[];
}

