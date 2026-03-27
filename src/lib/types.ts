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
