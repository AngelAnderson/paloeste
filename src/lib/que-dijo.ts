import { createHmac, timingSafeEqual } from "node:crypto";

// ¿Qué dijo? (18 nov 2026, tiro de 14 días; cobro mié 2 dic: 3 pagos o se apaga).
// Buscador de lo que se dijo en video en Puerto Rico. Gratis 3 búsquedas al día; pase de $9 al mes por Stripe.
// Las cookies van firmadas con una llave derivada de la llave de servicio (nunca sale del servidor).

export const GRATIS_AL_DIA = 3;
export const PAGO_URL = "https://buy.stripe.com/eVqaEW83WfkHfzj20b0co1k";
export const PAGO_LINK_ID = "plink_1Ud5muAPIRgkbC9l3lSAgcZQ";
export const DIAS_PASE = 35;

function secreto(): string | null {
  const k = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return k ? createHmac("sha256", k).update("que-dijo-v1").digest("hex") : null;
}

export function firmar(valor: string): string | null {
  const s = secreto();
  if (!s) return null;
  return `${valor}.${createHmac("sha256", s).update(valor).digest("hex").slice(0, 32)}`;
}

// Devuelve el valor si la firma es buena; null si no (falla cerrado).
export function verificar(firmado: string | undefined): string | null {
  if (!firmado) return null;
  const i = firmado.lastIndexOf(".");
  if (i < 1) return null;
  const valor = firmado.slice(0, i);
  const esperado = firmar(valor);
  if (!esperado) return null;
  const a = Buffer.from(firmado);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b) ? valor : null;
}

export function galletas(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  for (const par of (req.headers.get("cookie") || "").split(";")) {
    const i = par.indexOf("=");
    if (i > 0) out[par.slice(0, i).trim()] = decodeURIComponent(par.slice(i + 1).trim());
  }
  return out;
}

export function ponerGalleta(nombre: string, valor: string, segundos: number): string {
  return `${nombre}=${encodeURIComponent(valor)}; Path=/; Max-Age=${segundos}; HttpOnly; Secure; SameSite=Lax`;
}

// Pase vigente: la cookie guarda el vencimiento en segundos.
export function paseHasta(req: Request): number | null {
  const v = verificar(galletas(req)["qd_pase"]);
  const exp = v ? Number(v) : 0;
  return exp > Date.now() / 1000 ? exp : null;
}

export function diaPR(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Puerto_Rico" }).format(new Date());
}

// Cuántas búsquedas gratis lleva hoy este navegador.
export function usadasHoy(req: Request): number {
  const v = verificar(galletas(req)["qd_n"]);
  if (!v) return 0;
  const [dia, n] = v.split("|");
  return dia === diaPR() ? Math.max(0, Number(n) || 0) : 0;
}

export async function anotar(event: string, target: string | null): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/registro_events`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ event, record: "/que-dijo", target, sitio: "paloeste" }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* la medición nunca rompe la página */
  }
}
