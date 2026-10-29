import { createClient } from "@supabase/supabase-js";

// Medición de /ruta-joyuda y fichas (29 oct 2026). Inserta en registro_events (sitio='caborojo').
// Solo estos eventos, sin datos personales. Mismo patrón fail-silent que /api/mapa-pages?page=registro-log
// del Mapa: siempre 204, nunca rompe la página. Rate limit básico en memoria por IP (por instancia).
export const runtime = "nodejs";

const EVENTOS = new Set(["click_to_call", "directions_click", "menu_click", "veci_click", "recommendation_view"]);
const VENTANA_MS = 10 * 60_000;
const MAX = 60;
const golpes = new Map<string, { n: number; desde: number }>();

function limitado(ip: string): boolean {
  const ahora = Date.now();
  if (golpes.size > 5000) golpes.clear();
  const g = golpes.get(ip);
  if (!g || ahora - g.desde > VENTANA_MS) {
    golpes.set(ip, { n: 1, desde: ahora });
    return false;
  }
  g.n += 1;
  return g.n > MAX;
}

const corto = (v: unknown, n: number) => (v == null || v === "" ? null : String(v).slice(0, n));

export async function POST(req: Request) {
  const fin = () => new Response(null, { status: 204 });
  try {
    const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "desconocida";
    if (limitado(ip)) return fin();
    // Origen: solo nuestras páginas (el navegador pone Origin/Referer; un curl sin ellos no entra).
    const desde = req.headers.get("origin") || req.headers.get("referer") || "";
    if (!/^https?:\/\/(localhost(:\d+)?|[a-z0-9-]+\.vercel\.app|(www\.)?paloeste\.com|([a-z0-9-]+\.)?caborojo\.com)(\/|$)/i.test(desde)) return fin();

    let b: Record<string, unknown> = {};
    try {
      b = JSON.parse(await req.text());
    } catch {
      return fin();
    }
    const event = String(b.event || "");
    if (!EVENTOS.has(event)) return fin();
    const record = String(b.record || "");
    if (!/^\/(ruta-joyuda|negocio\/[a-z0-9-]+)/.test(record)) return fin();
    const vid = /^[a-z0-9]{6,40}$/.test(String(b.vid || "")) ? String(b.vid) : null;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return fin();
    await createClient(url, key).from("registro_events").insert({
      sitio: "caborojo",
      event,
      record: corto(record, 120),
      target: corto(b.target, 200),
      referrer: corto(b.referrer, 200),
      ua: corto(req.headers.get("user-agent"), 300),
      vid,
    });
  } catch {
    /* la medición nunca rompe la página */
  }
  return fin();
}
