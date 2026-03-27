import { createClient } from "@supabase/supabase-js";
import { Place, Event } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getPlaces(category?: string): Promise<Place[]> {
  let query = supabase
    .from("places")
    .select("*")
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
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .eq("slug", slug)
    .eq("visibility", "published")
    .single();

  if (error) return null;
  return data as Place;
}

export async function getFeaturedPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from("places")
    .select("*")
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
  const { data, error } = await supabase.rpc("match_places_v3", {
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
  const { data, error } = await supabase.rpc("match_places_nearby", {
    p_lat: lat,
    p_lon: lon,
    p_radius_km: radiusKm,
    ...(category ? { p_category: category } : {}),
  });

  if (error) throw error;
  return (data as Place[]) || [];
}

export async function getUpcomingEvents(
  daysAhead: number = 7
): Promise<Event[]> {
  const now = new Date().toISOString();
  const future = new Date(
    Date.now() + daysAhead * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("status", "approved")
    .gte("start_time", now)
    .lte("start_time", future)
    .order("start_time");

  if (error) throw error;
  return (data as Event[]) || [];
}

export async function getAllSlugs(): Promise<string[]> {
  const { data, error } = await supabase
    .from("places")
    .select("slug")
    .eq("visibility", "published")
    .neq("quality_tier", "hidden");

  if (error) throw error;
  return (data || []).map((p) => p.slug).filter(Boolean);
}
