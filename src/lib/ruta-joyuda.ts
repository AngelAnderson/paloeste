import type { Place } from "./types";

// Lógica pura de /ruta-joyuda: abierto/cerrado, elegibilidad, coincidencias y cuenta.
// Zona horaria America/Puerto_Rico (UTC-4, sin cambio de hora). Misma regla que
// Vecinoai/supabase/functions/twilio-webhook/time.ts (isOpenNow / formatOpenStatus).

export type Estado = "abierto" | "abre-hoy" | "cerrado" | "sin-horario";

export interface EstadoHorario {
  estado: Estado;
  texto: string; // "ABIERTO · cierra 9 PM" / "CERRADO · abre a las 11 AM"
  corto: string; // "cierra 9 PM" / "abre a las 11 AM"
}

const DIAS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

export function ahoraPR(now: Date = new Date()): { day: number; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Puerto_Rico",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const h = Number(get("hour")) % 24;
  return { day: map[get("weekday")] ?? 0, minutes: h * 60 + Number(get("minute")) };
}

export function hora12(t: string): string {
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h)) return t;
  const suf = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return m ? `${h12}:${String(m).padStart(2, "0")} ${suf}` : `${h12} ${suf}`;
}

function aMin(t?: string): number {
  const [h, m] = (t || "").split(":").map(Number);
  return Number.isNaN(h) ? NaN : h * 60 + (m || 0);
}

export function estadoHorario(place: Place, now: Date = new Date()): EstadoHorario {
  const st = place.opening_hours?.structured;
  if (!st || !st.length) return { estado: "sin-horario", texto: "Sin horario, llama antes", corto: "sin horario" };
  const { day, minutes } = ahoraPR(now);
  const hoy = st.find((d) => d.day === day);
  if (hoy && !hoy.isClosed) {
    const o = aMin(hoy.open);
    const c = aMin(hoy.close);
    if (!Number.isNaN(o) && !Number.isNaN(c)) {
      const cruzaMedianoche = c <= o;
      const abierto = cruzaMedianoche ? minutes >= o : minutes >= o && minutes < c;
      if (abierto) {
        return { estado: "abierto", texto: `ABIERTO · cierra ${hora12(hoy.close)}`, corto: `cierra ${hora12(hoy.close)}` };
      }
      if (minutes < o) {
        return { estado: "abre-hoy", texto: `CERRADO · abre a las ${hora12(hoy.open)}`, corto: `abre a las ${hora12(hoy.open)}` };
      }
    }
  }
  // Pasado el cierre de hoy o cerrado hoy: próximo día que abre.
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    const e = st.find((x) => x.day === d);
    if (e && !e.isClosed && e.open) {
      const cuando = i === 1 ? "mañana" : `el ${DIAS[d]}`;
      return { estado: "cerrado", texto: `CERRADO · abre ${cuando} ${hora12(e.open)}`, corto: `abre ${cuando} ${hora12(e.open)}` };
    }
  }
  return { estado: "cerrado", texto: "CERRADO", corto: "cerrado" };
}

export function telDigitos(phone?: string | null): string | null {
  if (!phone) return null;
  let d = phone.replace(/[^0-9]/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 ? d : null;
}

export function telVisible(phone?: string | null): string {
  const d = telDigitos(phone);
  return d ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : phone || "";
}

export function comoLlegar(p: Place): string | null {
  if (p.lat != null && p.lon != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}`;
  }
  return p.gmaps_url || null;
}

export function verificadoEn(p: Place): Date | null {
  if (!p.last_verified_at) return null;
  if (p.last_verified_at.startsWith("2026-01-01")) return null; // fecha de carga masiva, no verificación
  const d = new Date(p.last_verified_at);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function mesAnio(d: Date): string {
  return new Intl.DateTimeFormat("es-PR", { month: "long", year: "numeric", timeZone: "America/Puerto_Rico" }).format(d);
}

export function fechaLarga(d: Date): string {
  return new Intl.DateTimeFormat("es-PR", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Puerto_Rico" }).format(d);
}

// ---------- Coincidencias ----------

function norm(s: string): string {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function pajar(p: Place): string {
  return norm([p.name, p.subcategory, p.description, p.one_liner, (p.tags || []).join(" "), (p.vibe || []).join(" ")].filter(Boolean).join(" | "));
}

const GANAS: Record<string, { re: RegExp; label: string }> = {
  mariscos: { re: /marisc|seafood|ostion|pescad|langost|cangrejo|camaron|chillo|dorado|treasure of the sea|varadero|cayo azul|nautica/, label: "Mariscos" },
  criolla: { re: /criol|mofongo|lechon|cubano|puertorrique|comida tipica|alcapurria|empanadilla|carne frita/, label: "Comida criolla" },
  "italiana-pizza": { re: /pizza|italian|pasta|mangia/, label: "Italiana y pizza" },
};

export function coincideGanas(p: Place, t: string): boolean {
  const g = GANAS[t];
  return g ? g.re.test(pajar(p)) : false;
}

const tagsDe = (p: Place) => (p.tags || []).map(norm);

export function coincideImporta(p: Place, q: string): boolean {
  const tags = tagsDe(p);
  const txt = pajar(p);
  switch (q) {
    case "vista":
      return tags.some((t) => ["sunset", "vista al mar", "atardecer"].includes(t)) || /vista al mar|frente al mar|atardecer|puesta del sol|bahia|island view|sunset/.test(txt);
    case "rapido":
      return tags.some((t) => ["food truck", "rapido", "comida rapida", "para llevar"].includes(t)) || /food truck|comida rapida|empanadilla|frituras|para llevar|cuchifrito/.test(txt);
    case "estacionamiento": {
      const park = p.amenities?.parking;
      return Boolean(park) && String(park).toLowerCase() !== "false" && String(park).toLowerCase() !== "none" || /estacionamiento|parking/.test(txt);
    }
    case "familiar":
      return tags.some((t) => ["con-ninos", "familiar", "family", "family friendly"].includes(t)) || (p.vibe || []).some((v) => /familiar|family/i.test(v)) || /familiar|ninos/.test(txt);
    default:
      return false;
  }
}

export const IMPORTA_LABEL: Record<string, string> = {
  vista: "con vista al mar",
  rapido: "para salir rápido",
  estacionamiento: "con estacionamiento",
  familiar: "ambiente familiar",
};

// [supuesto] precio por persona según price_level; se dice en nota al pie.
export const RANGO_NIVEL: Record<string, [number, number]> = { $: [15, 25], $$: [25, 45] };

export interface Opcion {
  place: Place;
  estado: EstadoHorario;
  coincideGanas: boolean;
  coincideImporta: boolean;
  motivo: string;
  cuenta: CuentaCompleta | null;
}

export interface Params {
  p?: number;
  g?: number;
  t?: string;
  q?: string;
}

export function leerParams(sp: Record<string, string | string[] | undefined>): Params {
  const one = (k: string) => (Array.isArray(sp[k]) ? (sp[k] as string[])[0] : (sp[k] as string | undefined));
  const num = (v: string | undefined, ok: number[]) => (v && ok.includes(Number(v)) ? Number(v) : undefined);
  const t = one("t");
  const q = one("q");
  return {
    p: num(one("p"), [2, 4, 6, 8]),
    g: num(one("g"), [40, 60, 100, 150]),
    t: t && ["mariscos", "criolla", "italiana-pizza", "sorprendeme"].includes(t) ? t : undefined,
    q: q && ["vista", "rapido", "estacionamiento", "familiar"].includes(q) ? q : undefined,
  };
}

export const hayRespuestas = (x: Params) => x.p != null || x.g != null || x.t != null || x.q != null;

export interface Recomendacion {
  opciones: Opcion[];
  aviso: string | null;
}

export function recomendar(places: Place[], x: Params, now: Date = new Date()): Recomendacion {
  const porPersona = x.g && x.p ? x.g / x.p : null;
  const base = places
    .filter((p) => telDigitos(p.phone) || p.gmaps_url || p.lat != null)
    .map((p) => ({ p, estado: estadoHorario(p, now) }));

  // 1) abierto ahora (si hay horario; sin horario entra pero baja en el orden)
  let elegibles = base.filter((b) => b.estado.estado === "abierto" || b.estado.estado === "sin-horario");
  let aviso: string | null = null;
  if (!elegibles.length) {
    elegibles = base.filter((b) => b.estado.estado === "abre-hoy");
    aviso = elegibles.length ? "Ahora mismo no hay nada abierto. Estos abren más tarde hoy." : null;
  }
  // 2) presupuesto
  if (porPersona != null) {
    const dentro = elegibles.filter((b) => {
      const r = b.p.price_level ? RANGO_NIVEL[b.p.price_level] : null;
      return !r || r[0] <= porPersona;
    });
    if (!dentro.length && elegibles.length) {
      aviso = `Con $${x.g} para ${x.p} (unos $${Math.floor(porPersona)} por persona) no alcanza para nada de lo que está abierto. Sube el presupuesto o baja las personas.`;
      return { opciones: [], aviso };
    }
    elegibles = dentro;
  }
  const opciones = elegibles
    .map((b) => {
      const g = x.t && x.t !== "sorprendeme" ? coincideGanas(b.p, x.t) : false;
      const im = x.q ? coincideImporta(b.p, x.q) : false;
      return { b, g, im, score: (g ? 2 : 0) + (im ? 2 : 0) + (b.estado.estado === "abierto" ? 1 : 0) };
    })
    .sort((a, c) => c.score - a.score || (c.b.p.google_rating || 0) - (a.b.p.google_rating || 0) || (c.b.p.google_review_count || 0) - (a.b.p.google_review_count || 0))
    .slice(0, 3)
    .map(({ b, g, im }) => ({
      place: b.p,
      estado: b.estado,
      coincideGanas: g,
      coincideImporta: im,
      motivo: motivo(b.p, b.estado, g, im, x),
      cuenta: x.p ? cuentaCompleta(b.p, x.p) : null,
    }));
  if (x.t && x.t !== "sorprendeme" && opciones.length && !opciones.some((o) => o.coincideGanas)) {
    aviso = aviso || "Nada de lo que está abierto dice que sirva eso. Estas son las mejor calificadas, llama y confirma.";
  }
  return { opciones, aviso };
}

function motivo(p: Place, e: EstadoHorario, g: boolean, im: boolean, x: Params): string {
  const partes: string[] = [];
  if (g && x.t) partes.push(GANAS[x.t]?.label || "Restaurante");
  else partes.push(p.subcategory && /^[A-Za-zÁÉÍÓÚáéíóúñÑ ]+$/.test(p.subcategory) ? p.subcategory.charAt(0).toUpperCase() + p.subcategory.slice(1) : "Restaurante");
  if (im && x.q) partes.push(IMPORTA_LABEL[x.q]);
  const base = partes.join(" ");
  return `${base}, ${e.corto}`;
}

// ---------- La cuenta completa ----------
export interface CuentaCompleta {
  renglones: { texto: string; monto: number }[];
  total: number;
  platos: string;
}

const IVU = 0.115;
const PROPINA = 0.15;

export function cuentaCompleta(p: Place, personas: number): CuentaCompleta | null {
  const platos = (p.amenities?.platos || []).filter(
    (x) => typeof x?.precio === "number" && x.precio > 0 && x.fuente && x.verificado !== false
  );
  if (!platos.length) return null;
  const precios = platos.map((x) => x.precio as number).sort((a, b) => a - b);
  const mid = Math.floor(precios.length / 2);
  const tipico = precios.length % 2 ? precios[mid] : (precios[mid - 1] + precios[mid]) / 2;
  const sub = round2(tipico * personas);
  const ivu = round2(sub * IVU);
  const prop = round2(sub * PROPINA);
  return {
    renglones: [
      { texto: `${personas} personas × $${tipico.toFixed(2)} (plato típico)`, monto: sub },
      { texto: "IVU 11.5%", monto: ivu },
      { texto: "Propina 15%", monto: prop },
    ],
    total: round2(sub + ivu + prop),
    platos: platos.map((x) => `${x.nombre} $${(x.precio as number).toFixed(2)}`).slice(0, 4).join(" · "),
  };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

// ---------- Filtros de 1 toque ----------
export interface Filtros {
  abierto?: boolean;
  ostiones?: boolean;
  ninos?: boolean;
  atardecer?: boolean;
  estacionamiento?: boolean;
}

export function leerFiltros(sp: Record<string, string | string[] | undefined>): Filtros {
  const on = (k: string) => sp[k] === "1" || (Array.isArray(sp[k]) && (sp[k] as string[])[0] === "1");
  return { abierto: on("abierto"), ostiones: on("ostiones"), ninos: on("ninos"), atardecer: on("atardecer"), estacionamiento: on("estacionamiento") };
}

export function pasaFiltros(p: Place, f: Filtros, e: EstadoHorario): boolean {
  const tags = tagsDe(p);
  if (f.abierto && e.estado !== "abierto") return false;
  if (f.ostiones && !tags.includes("ostiones")) return false;
  if (f.ninos && !tags.includes("con-ninos")) return false;
  if (f.atardecer && !tags.includes("atardecer")) return false;
  if (f.estacionamiento && !coincideImporta(p, "estacionamiento")) return false;
  return true;
}

const ORDEN_ESTADO: Record<Estado, number> = { abierto: 0, "abre-hoy": 1, cerrado: 2, "sin-horario": 3 };
export const ordenEstado = (e: EstadoHorario) => ORDEN_ESTADO[e.estado];

// ---------- Ruta en el mapa ----------
export function tramosMapa(places: Place[], max = 5): { desde: number; hasta: number; url: string }[] {
  const conCoord = places.filter((p) => p.lat != null && p.lon != null && p.amenities?.km_102 != null);
  const out: { desde: number; hasta: number; url: string }[] = [];
  for (let i = 0; i < conCoord.length; i += max) {
    const tramo = conCoord.slice(i, i + max);
    if (tramo.length < 2 && out.length) {
      // pega la parada suelta al tramo anterior para que nunca quede un tramo de 1
      continue;
    }
    out.push({
      desde: i + 1,
      hasta: i + tramo.length,
      url: "https://www.google.com/maps/dir/" + tramo.map((p) => `${p.lat},${p.lon}`).join("/"),
    });
  }
  return out;
}
