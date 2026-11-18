import { anotar, personaDe, pruebaDe, tipoDeAparato } from "@/lib/que-dijo";

// POST /api/que-dijo/evento  { e: "vista" | "clic" | "opinion" | "compartir", t?: string, ref?: string }
// Lo que la persona hace en la página, sin nombre: llegó, tocó un resultado, opinó, compartió.
// Solo acepta esos 4 nombres, solo desde la misma página y con tope por dirección.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EVENTOS: Record<string, string> = { vista: "qd_vista", clic: "qd_clic", opinion: "qd_opinion", compartir: "qd_compartir" };
const VENTANA_MS = 10 * 60_000;
const MAX_VENTANA = 60;
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
  return g.n > MAX_VENTANA;
}

const nada = (status = 204) => new Response(null, { status, headers: { "Cache-Control": "no-store" } });

function dominio(ref: unknown): string | null {
  if (typeof ref !== "string" || !ref) return null;
  try {
    return new URL(ref).hostname.slice(0, 80) || null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  // Solo desde la misma página: el navegador manda Origin en todo POST.
  const origen = req.headers.get("origin");
  if (!origen || dominio(origen) !== new URL(req.url).hostname) return nada(403);

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "desconocida";
  if (limitado(ip)) return nada(429);

  let cuerpo: Record<string, unknown>;
  try {
    const crudo = await req.text();
    if (crudo.length > 2000) return nada(413);
    cuerpo = JSON.parse(crudo) as Record<string, unknown>;
  } catch {
    return nada(400);
  }

  const evento = EVENTOS[String(cuerpo?.e || "")];
  if (!evento) return nada(400);

  // Texto plano y corto: fuera los caracteres de control.
  const t = String(cuerpo.t ?? "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 400);

  const propio = new URL(req.url).hostname;
  const ref = dominio(cuerpo.ref);
  await anotar(evento, t || null, {
    vid: personaDe(req),
    cid: pruebaDe(req),
    ua: tipoDeAparato(req),
    referrer: evento === "qd_vista" && ref && ref !== propio ? ref : null,
  });
  return nada();
}
