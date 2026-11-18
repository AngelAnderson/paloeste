import {
  GRATIS_AL_DIA,
  anotar,
  diaPR,
  firmar,
  galletaDePrueba,
  paseHasta,
  personaDe,
  personaNueva,
  ponerGalleta,
  pruebaDe,
  tipoDeAparato,
  usadasHoy,
} from "@/lib/que-dijo";

// GET /api/que-dijo?q=<texto>[&cr=1] → resultados de que_dijo_buscar (1 por video, cita con la palabra entre [[ ]]; cr=1 = solo CaboRojo.com).
// GET /api/que-dijo?estado=1[&prueba=<código>] → { pase, quedan, usadas, prueba } sin gastar búsqueda; deja la cookie
//                                  de persona anónima y, si el código de prueba es bueno, 30 días sin tope.
// GET /api/que-dijo?inicio=1   → 3 momentos recientes de Cabo Rojo para la primera pantalla (no gasta turno, no se anota).
// La llave de servicio se queda aquí; al navegador solo le llega la lista.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VENTANA_MS = 10 * 60_000;
const MAX_VENTANA = 40;
const MAX_GRATIS_IP_DIA = 12; // red de seguridad si borran la cookie (por instancia)
const golpes = new Map<string, { n: number; desde: number }>();
const gratisIp = new Map<string, number>();

function limitado(ip: string): boolean {
  const ahora = Date.now();
  if (golpes.size > 5000) golpes.clear();
  const g = golpes.get(ip);
  if (!g || ahora - g.desde > VENTANA_MS) {
    golpes.set(ip, { n: 1, desde: ahora });
    return false;
  }
  g.n += 1;
  return g.n > MAX_VENTANA;
}

type Fila = { titulo: string; canal: string; fecha: string; minuto: string; texto: string; enlace: string; mas: number };

const json = (cuerpo: unknown, status = 200, ...galletas: (string | undefined | null)[]) => {
  const h = new Headers({ "Content-Type": "application/json", "Cache-Control": "no-store" });
  for (const g of galletas) if (g) h.append("Set-Cookie", g);
  return new Response(JSON.stringify(cuerpo), { status, headers: h });
};

const ENLACE_BUENO = /^https:\/\/youtu\.be\/[\w-]{6,20}\?t=\d+$/;
function limpiar(datos: unknown): Fila[] {
  return (Array.isArray(datos) ? (datos as Record<string, unknown>[]) : [])
    .filter((d) => typeof d.enlace === "string" && ENLACE_BUENO.test(d.enlace as string))
    .map((d) => ({
      titulo: String(d.titulo || "").slice(0, 160),
      canal: String(d.canal || "").slice(0, 80),
      fecha: String(d.fecha || "").slice(0, 10),
      minuto: String(d.minuto || "").slice(0, 8),
      texto: String(d.texto || "").slice(0, 700),
      enlace: d.enlace as string,
      mas: Math.max(0, Math.min(99, Number(d.mas) || 0)),
    }));
}

// La primera pantalla se guarda 15 minutos por instancia: no le pega a la base en cada visita.
let inicioGuardado: { filas: Fila[]; hasta: number } | null = null;

export async function GET(req: Request) {
  const u = new URL(req.url);
  const pase = paseHasta(req);
  const usadas = usadasHoy(req);

  let prueba = pruebaDe(req);
  let vid = personaDe(req);
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "desconocida";

  if (u.searchParams.get("estado")) {
    let gPrueba: string | undefined;
    let gPersona: string | undefined;
    const codigo = (u.searchParams.get("prueba") || "").slice(0, 40);
    if (codigo && !limitado(ip)) {
      const p = galletaDePrueba(codigo);
      if (p) {
        prueba = p.etiqueta;
        gPrueba = p.galleta;
      }
    }
    if (!vid) {
      const n = personaNueva();
      vid = n.vid;
      gPersona = n.galleta;
    }
    return json(
      {
        pase: pase ? new Date(pase * 1000).toISOString().slice(0, 10) : null,
        quedan: Math.max(0, GRATIS_AL_DIA - usadas),
        usadas,
        prueba: Boolean(prueba),
      },
      200,
      gPrueba,
      gPersona,
    );
  }

  if (limitado(ip)) return json({ error: "Demasiadas búsquedas seguidas. Espera unos minutos." }, 429);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json({ error: "El buscador no está disponible ahora mismo." }, 503);

  if (u.searchParams.get("inicio")) {
    if (inicioGuardado && inicioGuardado.hasta > Date.now()) return json({ resultados: inicioGuardado.filas });
    try {
      const r = await fetch(`${url}/rest/v1/rpc/que_dijo_citas`, {
        method: "POST",
        headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ p_tipo: "promesa", q: null, p_solo_cr: true, p_n: 3 }),
        signal: AbortSignal.timeout(9000),
      });
      const filas = r.ok ? limpiar(await r.json()) : [];
      if (filas.length) inicioGuardado = { filas, hasta: Date.now() + 15 * 60_000 };
      return json({ resultados: filas });
    } catch {
      return json({ resultados: [] });
    }
  }

  const quien = { vid, cid: prueba, ua: tipoDeAparato(req) };

  const q = (u.searchParams.get("q") || "").replace(/\s+/g, " ").trim();
  // tipo = lista de citas ya extraídas (promesas, fechas, cifras); ahí la palabra es opcional.
  const TIPOS: Record<string, string> = { promesa: "promesa", fecha: "fecha_compromiso", cifra: "cifra" };
  const tipo = TIPOS[u.searchParams.get("tipo") || ""] || null;
  if (q.length > 80 || (!tipo && q.length < 3)) return json({ error: "Escribe un nombre o un tema de 3 a 80 letras." }, 400);

  const soloCr = u.searchParams.get("cr") === "1";
  const clavIp = `${diaPR()}|${ip}`;
  const libre = Boolean(pase || prueba);
  if (!libre) {
    if (gratisIp.size > 20000) gratisIp.clear();
    if (usadas >= GRATIS_AL_DIA || (gratisIp.get(clavIp) || 0) >= MAX_GRATIS_IP_DIA) {
      await anotar("qd_tope", q.toLowerCase().slice(0, 60), quien);
      return json({ tope: true, quedan: 0 });
    }
  }

  let filas: Fila[] = [];
  try {
    const r = await fetch(`${url}/rest/v1/rpc/${tipo ? "que_dijo_citas" : "que_dijo_buscar"}`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(tipo ? { p_tipo: tipo, q: q.length >= 3 ? q : null, p_solo_cr: soloCr, p_n: 8 } : { q, p_solo_cr: soloCr, p_n: 8 }),
      signal: AbortSignal.timeout(9000),
    });
    if (!r.ok) return json({ error: "El buscador no contestó. Prueba otra vez." }, 502);
    filas = limpiar(await r.json());
  } catch {
    return json({ error: "El buscador tardó demasiado. Prueba con menos palabras." }, 504);
  }

  await anotar("qd_busqueda", `${filas.length}|${soloCr ? "cr:" : ""}${tipo ? `${tipo}:` : ""}${q.toLowerCase().slice(0, 60)}`, quien);

  if (libre) return json({ resultados: filas, pase: Boolean(pase), prueba: Boolean(prueba) });

  // Una búsqueda sin resultados no gasta turno.
  const nuevas = filas.length ? usadas + 1 : usadas;
  if (filas.length) gratisIp.set(clavIp, (gratisIp.get(clavIp) || 0) + 1);
  const firmada = firmar(`${diaPR()}|${nuevas}`);
  return json(
    { resultados: filas, quedan: Math.max(0, GRATIS_AL_DIA - nuevas) },
    200,
    firmada ? ponerGalleta("qd_n", firmada, 60 * 60 * 30) : undefined,
  );
}
