import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

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

// Quién hizo qué, sin nombre: vid = número al azar del navegador, cid = etiqueta del enlace de prueba,
// ua = "movil" o "escritorio", referrer = solo el dominio de donde llegó. Nunca la dirección de internet.
export type Quien = { vid?: string | null; cid?: string | null; referrer?: string | null; ua?: string | null };

export function tipoDeAparato(req: Request): string {
  return /Mobi|Android|iPhone|iPad/i.test(req.headers.get("user-agent") || "") ? "movil" : "escritorio";
}

export async function anotar(event: string, target: string | null, quien: Quien = {}): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/rest/v1/registro_events`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        event,
        record: "/que-dijo",
        target,
        sitio: "paloeste",
        vid: quien.vid || null,
        cid: quien.cid || null,
        referrer: quien.referrer || null,
        ua: quien.ua || null,
      }),
      signal: AbortSignal.timeout(4000),
    });
  } catch {
    /* la medición nunca rompe la página */
  }
}

// Persona anónima: un número al azar que vive 1 año en el navegador. No identifica a nadie.
export function personaDe(req: Request): string | null {
  const v = galletas(req)["qd_v"] || "";
  return /^[a-f0-9]{16}$/.test(v) ? v : null;
}

export function personaNueva(): { vid: string; galleta: string } {
  const vid = randomBytes(8).toString("hex");
  return { vid, galleta: ponerGalleta("qd_v", vid, 60 * 60 * 24 * 365) };
}

// Enlaces de prueba (18 nov 2026): /que-dijo?prueba=<etiqueta>.<firma>. La firma sale de la misma llave derivada,
// así que un código inventado no pasa. Da 30 días sin tope en ese navegador y marca sus eventos con la etiqueta.
const DIAS_PRUEBA = 30;
const ETIQUETA = /^[a-z0-9-]{2,20}$/;

export function codigoPrueba(etiqueta: string): string | null {
  const s = secreto();
  if (!s || !ETIQUETA.test(etiqueta)) return null;
  return `${etiqueta}.${createHmac("sha256", s).update(`prueba|${etiqueta}`).digest("hex").slice(0, 12)}`;
}

// Devuelve la cookie de prueba si el código es bueno; null si no (falla cerrado).
export function galletaDePrueba(codigo: string): { etiqueta: string; galleta: string } | null {
  const etiqueta = codigo.split(".")[0] || "";
  const esperado = codigoPrueba(etiqueta);
  if (!esperado) return null;
  const a = Buffer.from(codigo);
  const b = Buffer.from(esperado);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const vence = Math.floor(Date.now() / 1000) + DIAS_PRUEBA * 86400;
  const firmada = firmar(`${etiqueta}|${vence}`);
  return firmada ? { etiqueta, galleta: ponerGalleta("qd_prueba", firmada, DIAS_PRUEBA * 86400) } : null;
}

export function pruebaDe(req: Request): string | null {
  const v = verificar(galletas(req)["qd_prueba"]);
  if (!v) return null;
  const [etiqueta, vence] = v.split("|");
  return ETIQUETA.test(etiqueta || "") && Number(vence) > Date.now() / 1000 ? etiqueta : null;
}
