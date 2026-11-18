import { DIAS_PASE, PAGO_LINK_ID, PAGO_URL, anotar, firmar, ponerGalleta } from "@/lib/que-dijo";

// GET /api/que-dijo/pase?ir=1          → anota el clic y manda al cobro de Stripe.
// GET /api/que-dijo/pase?sesion=cs_... → Stripe devuelve aquí al que pagó; se confirma el pago con Stripe
//                                        y se deja el pase en una cookie firmada. Sin confirmación no hay pase.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ir = (a: string, galleta?: string) => {
  const h = new Headers({ Location: a, "Cache-Control": "no-store" });
  if (galleta) h.append("Set-Cookie", galleta);
  return new Response(null, { status: 302, headers: h });
};

export async function GET(req: Request) {
  const u = new URL(req.url);
  const pagina = new URL("/que-dijo", u.origin);

  if (u.searchParams.get("ir")) {
    await anotar("qd_pago_click", null);
    return ir(PAGO_URL);
  }

  const sesion = u.searchParams.get("sesion") || "";
  const llave = process.env.STRIPE_SECRET_KEY;
  if (!/^cs_(live|test)_[A-Za-z0-9]{10,200}$/.test(sesion) || !llave) {
    pagina.searchParams.set("pase", "pendiente");
    return ir(pagina.toString());
  }

  try {
    const r = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sesion}`, {
      headers: { Authorization: `Bearer ${llave}` },
      signal: AbortSignal.timeout(9000),
    });
    const s = r.ok ? ((await r.json()) as Record<string, unknown>) : null;
    const creada = Number(s?.created) || 0;
    const vence = creada + DIAS_PASE * 86400;
    const buena =
      s &&
      s.status === "complete" &&
      s.payment_status === "paid" &&
      s.payment_link === PAGO_LINK_ID &&
      vence > Date.now() / 1000;
    if (!buena) {
      pagina.searchParams.set("pase", "pendiente");
      return ir(pagina.toString());
    }
    const firmada = firmar(String(vence));
    if (!firmada) {
      pagina.searchParams.set("pase", "pendiente");
      return ir(pagina.toString());
    }
    await anotar("qd_pago_ok", null);
    pagina.searchParams.set("pase", "ok");
    return ir(pagina.toString(), ponerGalleta("qd_pase", firmada, Math.floor(vence - Date.now() / 1000)));
  } catch {
    pagina.searchParams.set("pase", "pendiente");
    return ir(pagina.toString());
  }
}
