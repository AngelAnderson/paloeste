import { CategoryInfo } from "./types";

export const SITE_NAME = "Pal Oeste";
export const SITE_DESCRIPTION =
  "Tu guía real del oeste de Puerto Rico. Negocios, cultura, música y turismo.";
export const SITE_URL = "https://paloeste.com";

export const WEST_PR_CENTER = { lat: 18.0865, lng: -67.1457 };

export const CATEGORIES: CategoryInfo[] = [
  { id: "FOOD", label_es: "Gastronomía", label_en: "Food & Drink", icon: "🍽️", color: "#FF3B30", order_index: 1 },
  { id: "BEACH", label_es: "Playas", label_en: "Beaches", icon: "🏖️", color: "#FF9500", order_index: 2 },
  { id: "SIGHTS", label_es: "Turismo", label_en: "Landmarks", icon: "📍", color: "#007AFF", order_index: 3 },
  { id: "LODGING", label_es: "Hospedaje", label_en: "Lodging", icon: "🏨", color: "#5AC8FA", order_index: 4 },
  { id: "ACTIVITY", label_es: "Actividades", label_en: "Activities", icon: "🥾", color: "#34C759", order_index: 5 },
  { id: "NIGHTLIFE", label_es: "Jangueo", label_en: "Nightlife", icon: "🍸", color: "#AF52DE", order_index: 6 },
  { id: "SHOPPING", label_es: "Compras", label_en: "Shopping", icon: "🛍️", color: "#FF2D55", order_index: 7 },
  { id: "SERVICE", label_es: "Servicios", label_en: "Services", icon: "🔧", color: "#8E8E93", order_index: 8 },
  { id: "HEALTH", label_es: "Salud", label_en: "Health", icon: "🏥", color: "#FF3B30", order_index: 9 },
  { id: "LOGISTICS", label_es: "Transporte", label_en: "Transport", icon: "⛽", color: "#FFCC00", order_index: 10 },
  { id: "EMERGENCY", label_es: "Emergencia", label_en: "Emergency", icon: "🚑", color: "#D22B2B", order_index: 11 },
];

export const BOT_PHONE = "787-417-7711";
export const BOT_WHATSAPP_URL = "https://wa.me/17874177711";
export const CONTACT_EMAIL = "angel@angelanderson.com";
export const CONTACT_WHATSAPP = "https://wa.me/17872225803";
