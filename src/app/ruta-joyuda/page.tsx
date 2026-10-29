import type { Metadata } from "next";
import Link from "next/link";
import { getRutaJoyuda } from "@/lib/supabase";
import { SITE_URL, BOT_PHONE } from "@/lib/constants";
import type { Place } from "@/lib/types";
import {
  comoLlegar,
  estadoHorario,
  fechaLarga,
  hayRespuestas,
  leerFiltros,
  leerParams,
  mesAnio,
  ordenEstado,
  pasaFiltros,
  recomendar,
  telDigitos,
  telVisible,
  tramosMapa,
  verificadoEn,
  type EstadoHorario,
  type Filtros,
  type Opcion,
  type Params,
} from "@/lib/ruta-joyuda";
import { Rastreo } from "@/components/rastreo";
import { GuardarOpciones, VerGuardado } from "@/components/ruta-acciones";

export const revalidate = 300;

const RECORD = "/ruta-joyuda";
const VECI_URL = "https://wa.me/17874177711?text=JOYUDA";
const CORRIGE_URL = "https://wa.me/17874177711?text=CORRIGE%20";

const BTN = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-bold no-underline";
const BTN_PRIMARIO = `${BTN} bg-[#1B4B5A] text-white`;
const BTN_SECUNDARIO = `${BTN} border-2 border-[#1B4B5A] bg-white text-[#1B4B5A]`;

export async function generateMetadata(): Promise<Metadata> {
  let n = 0;
  try {
    n = (await getRutaJoyuda()).length;
  } catch {
    /* sin datos */
  }
  const cuantos = n || 35;
  return {
    title: `Ruta Joyuda: ${cuantos} restaurantes, horario y teléfono (hoy) | CaboRojo.com`,
    description: `Qué está abierto hoy en Joyuda, Cabo Rojo: ${cuantos} restaurantes con teléfono, horario, precio y cómo llegar. Dinos cuántos son y qué les gusta y te damos 3 opciones.`,
    alternates: { canonical: `${SITE_URL}${RECORD}` },
  };
}

type SP = Record<string, string | string[] | undefined>;

function qs(base: Record<string, string | number | undefined>, extra: Record<string, string | number | undefined | null>): string {
  const m: Record<string, string> = {};
  for (const [k, v] of Object.entries({ ...base, ...extra })) {
    if (v != null && v !== "") m[k] = String(v);
  }
  const s = new URLSearchParams(m).toString();
  return s ? `?${s}` : "";
}

function Chip({ href, activo, children }: { href: string; activo: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={activo ? "true" : undefined}
      className={`inline-flex min-h-12 min-w-12 items-center justify-center rounded-full border-2 px-4 text-base font-bold no-underline ${
        activo ? "border-[#1B4B5A] bg-[#1B4B5A] text-white" : "border-[#1B4B5A] bg-white text-[#1B4B5A]"
      }`}
    >
      {children}
    </Link>
  );
}

function Estado({ e }: { e: EstadoHorario }) {
  const color =
    e.estado === "abierto"
      ? "bg-[#DCF2E3] text-[#14532D]"
      : e.estado === "sin-horario"
        ? "bg-[#EFEAE2] text-[#3D3528]"
        : "bg-[#F6E2DA] text-[#7A2E12]";
  return <span className={`inline-block rounded-md px-2 py-1 text-base font-bold ${color}`}>{e.texto}</span>;
}

function Datos({ p }: { p: Place }) {
  const v = verificadoEn(p);
  return (
    <p className="text-base text-[#3D3528]">
      {p.price_level ? <span className="font-bold">{p.price_level}</span> : <span>Precio: llama antes</span>}
      {p.google_rating ? (
        <>
          {" · "}★ {p.google_rating.toFixed(1)}
          {p.google_review_count ? ` (${p.google_review_count})` : ""}
        </>
      ) : null}
      {p.amenities?.km_102 != null ? <> · km {String(p.amenities.km_102)} (carr. 102)</> : null}
      {" · "}
      {v ? `Corroborado ${mesAnio(v)}` : "Sin corroborar, llama antes"}
    </p>
  );
}

function Botones({ p, record }: { p: Place; record: string }) {
  const tel = telDigitos(p.phone);
  const dir = comoLlegar(p);
  const slug = `/negocio/${p.slug}`;
  return (
    <div className="flex flex-wrap gap-2">
      {tel ? (
        <a href={`tel:+1${tel}`} className={BTN_PRIMARIO} data-ev="click_to_call" data-target={`tel:+1${tel}`} data-record={record || slug}>
          📞 Llamar {telVisible(p.phone)}
        </a>
      ) : (
        <span className="inline-flex min-h-12 items-center text-base text-[#3D3528]">Sin teléfono publicado</span>
      )}
      {dir && (
        <a href={dir} target="_blank" rel="noopener noreferrer" className={BTN_SECUNDARIO} data-ev="directions_click" data-target={dir.slice(0, 190)} data-record={record || slug}>
          📍 Cómo llegar
        </a>
      )}
      {p.website && (
        <a href={p.website} target="_blank" rel="noopener noreferrer" className={BTN_SECUNDARIO} data-ev="menu_click" data-target={p.website.slice(0, 190)} data-record={record || slug}>
          Menú
        </a>
      )}
    </div>
  );
}

function TuTresOpciones({ opciones, aviso, x, base }: { opciones: Opcion[]; aviso: string | null; x: Params; base: Record<string, string | number | undefined> }) {
  const url = `${SITE_URL}${RECORD}${qs(base, {})}`;
  const lineas = opciones.map((o, i) => {
    const t = telDigitos(o.place.phone);
    return `${i + 1}. ${o.place.name}${t ? " " + telVisible(o.place.phone) : ""} (${o.estado.corto})`;
  });
  const texto = `Joyuda, hoy. Mis 3 opciones:\n${lineas.join("\n")}\n${url}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(texto)}`;
  const claveGuardar = qs(base, {}).replace(/^\?/, "");
  const resumen = opciones.map((o) => o.place.name).join(" · ");

  return (
    <section aria-labelledby="tres" className="mt-6 rounded-2xl border-2 border-[#1B4B5A] bg-white p-4">
      <h2 id="tres" className="font-display text-2xl font-black text-[#2C2418]">
        Tus 3 opciones
      </h2>
      {aviso && <p className="mt-2 text-base font-semibold text-[#7A2E12]">{aviso}</p>}
      {!opciones.length && !aviso && <p className="mt-2 text-base text-[#2C2418]">Ahora no hay nada abierto que cuadre. Mira la lista completa abajo o textéale al Veci.</p>}
      <ol className="mt-3 space-y-4">
        {opciones.map((o, i) => (
          <li key={o.place.id} className="rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] p-3">
            <h3 className="font-display text-xl font-black text-[#2C2418]">
              {i + 1}.{" "}
              <Link href={`/negocio/${o.place.slug}`} className="text-[#1B4B5A] underline">
                {o.place.name}
              </Link>
            </h3>
            <p className="mt-1 text-base text-[#2C2418]">{o.motivo}</p>
            <div className="mt-2">
              <Estado e={o.estado} />
            </div>
            <div className="mt-2">
              <Datos p={o.place} />
            </div>
            {x.p && (
              <div className="mt-2 text-base text-[#2C2418]">
                {o.cuenta ? (
                  <>
                    <p className="font-bold">La cuenta completa para {x.p}:</p>
                    <ul className="mt-1">
                      {o.cuenta.renglones.map((r) => (
                        <li key={r.texto} className="flex justify-between gap-3">
                          <span>{r.texto}</span>
                          <span className="font-mono">${r.monto.toFixed(2)}</span>
                        </li>
                      ))}
                      <li className="flex justify-between gap-3 border-t border-[#8A7E6F] pt-1 font-bold">
                        <span>Total</span>
                        <span className="font-mono">${o.cuenta.total.toFixed(2)}</span>
                      </li>
                    </ul>
                    <p className="mt-1">Con: {o.cuenta.platos}.</p>
                  </>
                ) : (
                  <p>{o.place.price_level ? `Nivel ${o.place.price_level}, llama antes para saber el precio.` : "Llama antes para saber el precio."}</p>
                )}
              </div>
            )}
            <div className="mt-3">
              <Botones p={o.place} record={RECORD} />
            </div>
          </li>
        ))}
      </ol>
      {opciones.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <a href={wa} target="_blank" rel="noopener noreferrer" className={`${BTN} bg-[#166534] text-white`}>
            Compartir estas 3 por WhatsApp
          </a>
          <GuardarOpciones clave={claveGuardar} resumen={resumen} />
        </div>
      )}
      <div className="mt-2">
        <Link href={RECORD} className="inline-flex min-h-12 items-center text-base font-semibold text-[#1B4B5A] underline">
          Empezar de nuevo
        </Link>
      </div>
    </section>
  );
}

function jsonLd(places: Place[], faq: { q: string; a: string }[]) {
  const dias = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const lista = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Ruta Joyuda: restaurantes de Joyuda, Cabo Rojo",
    numberOfItems: places.length,
    itemListElement: places.map((p, i) => {
      const r: Record<string, unknown> = {
        "@type": "Restaurant",
        name: p.name,
        url: `${SITE_URL}/negocio/${p.slug}`,
        ...(p.phone ? { telephone: p.phone } : {}),
        address: { "@type": "PostalAddress", ...(p.address ? { streetAddress: p.address } : {}), addressLocality: "Cabo Rojo", addressRegion: "PR", addressCountry: "US" },
        ...(p.lat != null && p.lon != null ? { geo: { "@type": "GeoCoordinates", latitude: p.lat, longitude: p.lon } } : {}),
        ...(p.price_level ? { priceRange: p.price_level } : {}),
        ...(p.google_rating && p.google_review_count
          ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.google_rating, reviewCount: p.google_review_count, bestRating: 5, worstRating: 1 } }
          : {}),
      };
      const st = p.opening_hours?.structured?.filter((d) => !d.isClosed && d.open && d.close);
      if (st?.length) {
        r.openingHoursSpecification = st.map((d) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: dias[d.day], opens: d.open, closes: d.close }));
      }
      return { "@type": "ListItem", position: i + 1, item: r };
    }),
  };
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
  };
  return [lista, faqLd];
}

function nombres(ps: Place[], max = 8) {
  const n = ps.slice(0, max).map((p) => p.name);
  return n.join(", ") + (ps.length > max ? ` y ${ps.length - max} más` : "");
}

export default async function RutaJoyudaPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  let places: Place[] = [];
  try {
    places = await getRutaJoyuda();
  } catch {
    /* estado vacío abajo */
  }
  const ahora = new Date();
  const x = leerParams(sp);
  const f = leerFiltros(sp);
  const filas = places.map((p) => ({ p, e: estadoHorario(p, ahora) }));
  const abiertos = filas.filter((r) => r.e.estado === "abierto").length;
  const verificados = places.map(verificadoEn).filter((d): d is Date => d !== null);
  const actualizado = verificados.length ? new Date(Math.max(...verificados.map((d) => d.getTime()))) : ahora;
  const n = places.length;

  const base = { p: x.p, g: x.g, t: x.t, q: x.q };
  const rec = hayRespuestas(x) ? recomendar(places, x, ahora) : null;

  const lista = filas
    .filter((r) => pasaFiltros(r.p, f, r.e))
    .map((r, i) => ({ ...r, i }))
    .sort((a, b) => ordenEstado(a.e) - ordenEstado(b.e) || a.i - b.i);

  // FAQ con datos reales de la consulta
  const domingo = places.filter((p) => p.opening_hours?.structured?.some((d) => d.day === 0 && !d.isClosed));
  const ostiones = places.filter((p) => (p.tags || []).map((t) => t.toLowerCase()).includes("ostiones"));
  const nivel = (l: string) => places.filter((p) => p.price_level === l).length;
  const faq = [
    {
      q: "¿Qué está abierto en Joyuda un domingo?",
      a: domingo.length
        ? `Según el horario guardado, ${domingo.length} de los ${n} restaurantes de la Ruta Joyuda abren los domingos: ${nombres(domingo)}. Llama antes porque el horario puede cambiar.`
        : `Todavía no tenemos horario de domingo confirmado para estos ${n} restaurantes. Llama antes o textea JOYUDA al ${BOT_PHONE}.`,
    },
    {
      q: "¿Dónde comer ostiones en Joyuda?",
      a: ostiones.length
        ? `Estos restaurantes de Joyuda están marcados con ostiones: ${nombres(ostiones)}.`
        : `Todavía no tenemos restaurantes marcados con ostiones en esta lista. Textea JOYUDA al ${BOT_PHONE} y el Veci te ayuda, o llama a los de mariscos antes de ir.`,
    },
    {
      q: "¿Cuánto cuesta comer en Joyuda?",
      a: `De los ${n} restaurantes, ${nivel("$")} son de nivel $ (unos $15 a $25 por persona) y ${nivel("$$")} de nivel $$ (unos $25 a $45 por persona). Son estimados por nivel de precio, no un menú: llama antes para confirmar.`,
    },
  ];
  const ld = jsonLd(places, faq);
  const tramos = tramosMapa(places);

  return (
    <>
      {ld.map((d, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(d) }} />
      ))}
      <Rastreo record={RECORD} vista={rec && rec.opciones.length ? rec.opciones.map((o) => o.place.slug).join(",").slice(0, 190) : undefined} />
      <main className="mx-auto max-w-3xl px-4 py-6 text-[#2C2418]">
        <h1 className="font-display text-3xl font-black leading-tight text-[#2C2418]">Ruta Joyuda: {n || 35} restaurantes con teléfono y horario</h1>
        <p className="mt-2 text-base text-[#3D3528]">
          Hoy están abiertos {abiertos} · verificado por vecinos, actualizado {fechaLarga(actualizado)}
        </p>

        {/* 2. ¿Dónde comemos hoy? */}
        <section aria-labelledby="donde" className="mt-6 rounded-2xl border border-[#E8E2D9] bg-white p-4">
          <h2 id="donde" className="font-display text-2xl font-black text-[#2C2418]">
            ¿Dónde comemos hoy?
          </h2>
          <p className="mt-1 text-base text-[#3D3528]">4 toques y te damos 3 opciones que están abiertas ahora.</p>

          <fieldset className="mt-4">
            <legend className="text-base font-bold">¿Cuántos son?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[2, 4, 6, 8].map((v) => (
                <Chip key={v} href={qs(base, { p: v })} activo={x.p === v}>
                  {v}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="text-base font-bold">¿Cuánto quieren gastar en total?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[40, 60, 100, 150].map((v) => (
                <Chip key={v} href={qs(base, { g: v })} activo={x.g === v}>
                  ${v}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="text-base font-bold">¿Qué tienen ganas de comer?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["mariscos", "Mariscos"],
                ["criolla", "Criolla"],
                ["italiana-pizza", "Italiana o pizza"],
                ["sorprendeme", "Sorpréndeme"],
              ].map(([v, l]) => (
                <Chip key={v} href={qs(base, { t: v })} activo={x.t === v}>
                  {l}
                </Chip>
              ))}
            </div>
          </fieldset>
          <fieldset className="mt-4">
            <legend className="text-base font-bold">¿Qué es lo que más importa?</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                ["vista", "Vista al mar"],
                ["rapido", "Rápido"],
                ["estacionamiento", "Estacionamiento"],
                ["familiar", "Familiar"],
              ].map(([v, l]) => (
                <Chip key={v} href={qs(base, { q: v })} activo={x.q === v}>
                  {l}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div className="mt-3">
            <VerGuardado />
          </div>
        </section>

        {rec && <TuTresOpciones opciones={rec.opciones} aviso={rec.aviso} x={x} base={base} />}
        {rec && (
          <p className="mt-2 text-base text-[#3D3528]">
            Nota: el presupuesto se calcula por nivel de precio, y es un supuesto: $ son unos $15 a $25 por persona y $$ unos $25 a $45. La cuenta completa (con IVU 11.5% y propina 15%) solo sale cuando el restaurante tiene platos con precio y fuente. Si no, llama antes.
          </p>
        )}

        {/* 3. Filtros de 1 toque */}
        <section aria-labelledby="filtros" className="mt-8">
          <h2 id="filtros" className="font-display text-2xl font-black text-[#2C2418]">
            Filtros de 1 toque
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                ["abierto", "Abiertos ahora"],
                ["ostiones", "Ostiones"],
                ["ninos", "Con niños"],
                ["atardecer", "Atardecer"],
                ["estacionamiento", "Estacionamiento"],
              ] as [keyof Filtros, string][]
            ).map(([k, l]) => (
              <Chip key={k} href={qs(base, { [k]: f[k] ? null : 1, ...Object.fromEntries((Object.keys(f) as (keyof Filtros)[]).filter((o) => o !== k && f[o]).map((o) => [o, 1])) })} activo={Boolean(f[k])}>
                {l}
              </Chip>
            ))}
            {Object.values(f).some(Boolean) && (
              <Link href={qs(base, {})} className="inline-flex min-h-12 items-center px-2 text-base font-semibold text-[#1B4B5A] underline">
                Quitar filtros
              </Link>
            )}
          </div>
        </section>

        {/* 4. Lista completa */}
        <section aria-labelledby="lista" className="mt-6">
          <h2 id="lista" className="font-display text-2xl font-black text-[#2C2418]">
            La lista completa ({lista.length})
          </h2>
          {!lista.length && (
            <p className="mt-2 text-base">{n ? "Ninguno cumple esos filtros ahora. Quita uno." : "No pudimos cargar la lista. Intenta de nuevo en un rato o textea JOYUDA al 787-417-7711."}</p>
          )}
          <ul className="mt-3 space-y-3">
            {lista.map(({ p, e }) => (
              <li key={p.id} className="rounded-xl border border-[#E8E2D9] bg-white p-3">
                <h3 className="font-display text-xl font-black">
                  <Link href={`/negocio/${p.slug}`} className="text-[#1B4B5A] underline">
                    {p.name}
                  </Link>
                </h3>
                <div className="mt-1">
                  <Estado e={e} />
                </div>
                <div className="mt-1">
                  <Datos p={p} />
                </div>
                <div className="mt-2">
                  <Botones p={p} record={RECORD} />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {tramos.length > 0 && (
          <section aria-labelledby="mapa" className="mt-8">
            <h2 id="mapa" className="font-display text-2xl font-black">
              Ruta completa en el mapa
            </h2>
            <p className="mt-1 text-base text-[#3D3528]">Ordenados por el kilómetro de la carretera 102, de 5 en 5 paradas.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {tramos.map((t) => (
                <a key={t.desde} href={t.url} target="_blank" rel="noopener noreferrer" className={BTN_SECUNDARIO} data-ev="directions_click" data-target={t.url.slice(0, 190)}>
                  🗺️ Paradas {t.desde} a {t.hasta}
                </a>
              ))}
            </div>
          </section>
        )}

        {/* 5. Veci */}
        <section aria-labelledby="veci" className="mt-8 rounded-2xl bg-[#1B4B5A] p-4 text-white">
          <h2 id="veci" className="font-display text-2xl font-black">
            Pregúntale al Veci
          </h2>
          <p className="mt-1 text-base">Textea JOYUDA al {BOT_PHONE} y te contesta.</p>
          <a href={VECI_URL} target="_blank" rel="noopener noreferrer" className={`${BTN} mt-2 bg-white text-[#1B4B5A]`} data-ev="veci_click" data-target="wa.me/17874177711?text=JOYUDA">
            Textear JOYUDA al {BOT_PHONE}
          </a>
          <p className="mt-4 text-base">
            ¿Falta un dato o está mal? Textea CORRIGE y el nombre del lugar al {BOT_PHONE}.
          </p>
          <a href={CORRIGE_URL} target="_blank" rel="noopener noreferrer" className={`${BTN} mt-2 border-2 border-white text-white`} data-ev="veci_click" data-target="wa.me/17874177711?text=CORRIGE">
            Textear CORRIGE
          </a>
        </section>

        <section aria-labelledby="faq" className="mt-8">
          <h2 id="faq" className="font-display text-2xl font-black">
            Preguntas que nos hacen
          </h2>
          <dl className="mt-2 space-y-4">
            {faq.map((q) => (
              <div key={q.q}>
                <dt className="text-base font-bold">{q.q}</dt>
                <dd className="mt-1 text-base text-[#3D3528]">{q.a}</dd>
              </div>
            ))}
          </dl>
        </section>
      </main>
    </>
  );
}
