"use client";

import { useCallback, useEffect, useState } from "react";

type Fila = { titulo: string; canal: string; fecha: string; minuto: string; texto: string; enlace: string; mas?: number };
type Estado = { pase: string | null; quedan: number; usadas: number };

const EJEMPLOS = ["Roig renuncia", "LUMA aumento", "contrato del gas"];
const TIPOS = [
  { id: "promesa", boton: "Promesas", uno: "promesa", varios: "promesas" },
  { id: "fecha", boton: "Fechas", uno: "compromiso con fecha", varios: "compromisos con fecha" },
  { id: "cifra", boton: "Cifras", uno: "cifra", varios: "cifras" },
];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const SITIO = "https://www.paloeste.com";

function fechaCorta(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${Number(m[3])} ${MESES[Number(m[2]) - 1]} ${m[1]}` : iso;
}

const sinMarcas = (t: string) => t.replace(/\[\[|\]\]/g, "");
const videoDe = (enlace: string) => /youtu\.be\/([\w-]+)/.exec(enlace)?.[1] || "";

// Lo que la persona hace (llegó, tocó, opinó, compartió). Sin nombre; si falla, la página sigue igual.
function anotar(e: "vista" | "clic" | "opinion" | "compartir", t = "", ref = "") {
  try {
    fetch("/api/que-dijo/evento", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ e, t, ref }),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* la medición nunca rompe la página */
  }
}

// La cita llega con la palabra buscada entre [[ ]]; aquí se pinta en negrita sin meter HTML crudo.
function Cita({ texto }: { texto: string }) {
  const partes = texto.split(/\[\[|\]\]/);
  return (
    <>
      {partes.map((p, i) =>
        i % 2 === 1 ? (
          <strong key={i} className="font-bold text-stone-950">
            {p}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </>
  );
}

function Momento({ f, pos, exacto, donde, enlacePagina }: { f: Fila; pos: number; exacto: boolean; donde: string; enlacePagina: string }) {
  const huella = `${pos}|${videoDe(f.enlace)}|${donde}`;
  const cita = sinMarcas(f.texto);
  const corta = cita.length > 220 ? `${cita.slice(0, 217)}...` : cita;
  const mensaje = `“${corta}”\n${fechaCorta(f.fecha)} · ${f.canal}\n\nMira el momento exacto del video: ${enlacePagina}`;
  return (
    <li className="rounded-xl border border-po-border bg-white p-5">
      <p className="font-mono text-[16px] font-medium tabular-nums text-red-800">
        {fechaCorta(f.fecha)} · {exacto ? "minuto" : "cerca del minuto"} {f.minuto}
      </p>
      <p className="mt-1 text-[16px] text-stone-700">
        {f.canal} · {f.titulo}
      </p>
      <p className="mt-3 text-[19px] leading-[1.55] text-stone-800">
        “<Cita texto={f.texto} />”
      </p>
      {f.mas ? (
        <p className="mt-2 text-[16px] text-stone-700">
          {f.mas === 1 ? "Hay 1 momento más" : `Hay ${f.mas} momentos más`} en este video.
        </p>
      ) : null}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <a
          href={f.enlace}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => anotar("clic", huella)}
          className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-po-ocean px-5 text-[17px] font-bold text-po-ocean hover:bg-po-ocean hover:text-white focus:outline-none focus:ring-4 focus:ring-po-ocean/25"
        >
          Ver ese momento en el video
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(mensaje)}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => anotar("compartir", huella)}
          className="inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-stone-400 px-5 text-[17px] font-bold text-stone-900 hover:border-po-ocean hover:text-po-ocean focus:outline-none focus:ring-4 focus:ring-po-ocean/25"
        >
          Enviar por WhatsApp
        </a>
      </div>
    </li>
  );
}

// "¿Encontraste lo que buscabas?" Se reinicia con cada búsqueda (key en el padre).
function Opinion({ donde }: { donde: string }) {
  const [paso, setPaso] = useState<"" | "no" | "listo">("");
  const [texto, setTexto] = useState("");
  const boton =
    "min-h-12 min-w-24 rounded-lg border-2 border-po-ocean bg-white px-6 text-[17px] font-bold text-po-ocean hover:bg-po-ocean hover:text-white focus:outline-none focus:ring-4 focus:ring-po-ocean/25";
  if (paso === "listo") {
    return (
      <p role="status" className="mt-8 rounded-xl border border-po-border bg-white p-5 text-[17px] font-medium text-stone-900">
        Gracias. Lo leemos todo.
      </p>
    );
  }
  return (
    <div className="mt-8 rounded-xl border border-po-border bg-white p-5">
      <p className="text-[18px] font-bold text-stone-900">¿Encontraste lo que buscabas?</p>
      {paso === "" ? (
        <div className="mt-3 flex gap-3">
          <button
            type="button"
            className={boton}
            onClick={() => {
              anotar("opinion", `si|${donde}`);
              setPaso("listo");
            }}
          >
            Sí
          </button>
          <button
            type="button"
            className={boton}
            onClick={() => {
              anotar("opinion", `no|${donde}`);
              setPaso("no");
            }}
          >
            No
          </button>
        </div>
      ) : (
        <form
          className="mt-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (texto.trim()) anotar("opinion", `texto|${donde}|${texto.trim().slice(0, 300)}`);
            setPaso("listo");
          }}
        >
          <label htmlFor="qd-opinion" className="block text-[17px] text-stone-800">
            ¿Qué buscabas? (opcional)
          </label>
          <textarea
            id="qd-opinion"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            maxLength={300}
            rows={3}
            className="mt-2 w-full rounded-lg border-2 border-stone-400 bg-white px-4 py-3 text-[18px] text-stone-900 focus:border-po-ocean focus:outline-none focus:ring-4 focus:ring-po-ocean/25"
          />
          <button type="submit" className={`${boton} mt-3`}>
            Enviar
          </button>
        </form>
      )}
    </div>
  );
}

export function Buscador() {
  const [soloCr, setSoloCr] = useState(false);
  const [tipo, setTipo] = useState("");
  const [q, setQ] = useState("");
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [inicio, setInicio] = useState<Fila[]>([]);
  const [buscado, setBuscado] = useState("");
  const [vuelta, setVuelta] = useState(0);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [tope, setTope] = useState(false);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [prueba, setPrueba] = useState(false);
  const [aviso, setAviso] = useState("");

  const buscar = useCallback(async (texto: string, cr: boolean, t = "") => {
    const limpio = texto.trim();
    if (!t && limpio.length < 3) {
      setError("Escribe un nombre o un tema de 3 letras o más.");
      return;
    }
    setCargando(true);
    setError("");
    setTope(false);
    try {
      const cola = `q=${encodeURIComponent(limpio)}${cr ? "&cr=1" : ""}${t ? `&tipo=${t}` : ""}`;
      const r = await fetch(`/api/que-dijo?${cola}`, { cache: "no-store" });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
      } else if (d.tope) {
        setTope(true);
        setFilas(null);
        setEstado((e) => ({ pase: e?.pase ?? null, quedan: 0, usadas: 3 }));
      } else {
        setFilas(d.resultados || []);
        setBuscado(limpio);
        setTipo(t);
        setVuelta((v) => v + 1);
        if (typeof d.quedan === "number") setEstado((e) => ({ pase: e?.pase ?? null, quedan: d.quedan, usadas: 3 - d.quedan }));
        window.history.replaceState(null, "", `/que-dijo?${cola}`);
      }
    } catch {
      setError("No se pudo buscar. Revisa tu conexión y prueba otra vez.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    const pase = p.get("pase");
    if (pase === "ok") setAviso("Pago recibido. Ya puedes buscar sin tope en este navegador.");
    if (pase === "pendiente")
      setAviso("No pudimos confirmar el pago todavía. Si ya pagaste, textea al 787-417-7711 y lo arreglamos hoy.");

    const codigo = p.get("prueba") || "";
    const inicial = p.get("q") || "";
    const t = TIPOS.some((x) => x.id === p.get("tipo")) ? (p.get("tipo") as string) : "";
    let cr = p.get("cr") === "1";

    (async () => {
      // Primero el estado: deja la cookie de persona anónima y, si el enlace es de prueba, quita el tope.
      let esPrueba = false;
      try {
        const r = await fetch(`/api/que-dijo?estado=1${codigo ? `&prueba=${encodeURIComponent(codigo)}` : ""}`, { cache: "no-store" });
        const d = await r.json();
        esPrueba = Boolean(d.prueba);
        setPrueba(esPrueba);
        setEstado({ pase: d.pase ?? null, quedan: Number(d.quedan) || 0, usadas: Number(d.usadas) || 0 });
      } catch {
        /* sin estado la página sigue sirviendo */
      }
      if (codigo) {
        // El código no se queda en la barra: así no viaja si la persona copia el enlace.
        p.delete("prueba");
        if (esPrueba && !inicial && !t) cr = true;
        const resto = p.toString();
        window.history.replaceState(null, "", `/que-dijo${resto ? `?${resto}` : ""}`);
      }
      if (cr) setSoloCr(true);
      anotar("vista", p.get("utm_source") || "", document.referrer);
      if (inicial || t) {
        setQ(inicial);
        buscar(inicial, cr, t);
      } else {
        fetch("/api/que-dijo?inicio=1", { cache: "no-store" })
          .then((r) => r.json())
          .then((d) => setInicio(Array.isArray(d.resultados) ? d.resultados : []))
          .catch(() => {});
      }
    })();
  }, [buscar]);

  const donde = `${soloCr ? "cr:" : ""}${tipo ? `${tipo}:` : ""}${buscado.toLowerCase().slice(0, 60)}`;
  const enlacePagina = `${SITIO}/que-dijo?q=${encodeURIComponent(buscado)}${soloCr ? "&cr=1" : ""}${tipo ? `&tipo=${tipo}` : ""}&utm_source=whatsapp`;

  return (
    <div className="mt-8">
      {aviso && (
        <p role="status" className="mb-5 rounded-lg border-2 border-po-ocean bg-white px-4 py-3 text-[17px] font-medium text-po-ocean">
          {aviso}
        </p>
      )}
      {prueba && (
        <p role="status" className="mb-5 rounded-lg border-2 border-po-ocean bg-white px-4 py-3 text-[17px] font-medium text-po-ocean">
          Estás probando ¿Qué dijo? Busca todo lo que quieras.
        </p>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          buscar(q, soloCr);
        }}
        className="flex flex-col gap-3 sm:flex-row"
      >
        <input
          id="qd-q"
          aria-label="Nombre o tema"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          maxLength={80}
          placeholder="Un nombre o un tema"
          autoComplete="off"
          enterKeyHint="search"
          className="h-14 w-full flex-1 rounded-lg border-2 border-stone-400 bg-white px-4 text-[19px] text-stone-900 placeholder:text-stone-500 focus:border-po-ocean focus:outline-none focus:ring-4 focus:ring-po-ocean/25"
        />
        <button
          type="submit"
          disabled={cargando}
          className="h-14 rounded-lg bg-red-700 px-7 text-[18px] font-bold text-white transition-colors hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-red-700/40 disabled:opacity-70"
        >
          {cargando ? "Buscando" : "Buscar"}
        </button>
      </form>

      <label className="mt-4 flex min-h-12 cursor-pointer items-center gap-3 text-[17px] font-medium text-stone-900">
        <input
          type="checkbox"
          checked={soloCr}
          onChange={(e) => {
            setSoloCr(e.target.checked);
            if (tipo || q.trim().length >= 3) buscar(q, e.target.checked, tipo);
          }}
          className="h-6 w-6 shrink-0 accent-[#1E3A5F]"
        />
        <span>Solo Cabo Rojo (videos de CaboRojo.com desde 2023)</span>
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[16px] text-stone-700">
        <span>O mira sin escribir:</span>
        {TIPOS.map((t) => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tipo === t.id}
            onClick={() => buscar(q.trim().length >= 3 ? q : "", soloCr, t.id)}
            className={`min-h-12 rounded-full border-2 px-5 text-[17px] font-bold focus:outline-none focus:ring-4 focus:ring-po-ocean/25 ${
              tipo === t.id ? "border-po-ocean bg-po-ocean text-white" : "border-po-ocean bg-white text-po-ocean hover:bg-po-ocean hover:text-white"
            }`}
          >
            {t.boton}
          </button>
        ))}
      </div>

      {!soloCr && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-[16px] text-stone-700">
          <span>Prueba con:</span>
          {EJEMPLOS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => {
                setQ(e);
                buscar(e, soloCr);
              }}
              className="min-h-12 rounded-full border border-stone-400 bg-white px-4 text-[16px] font-medium text-stone-900 hover:border-po-ocean hover:text-po-ocean focus:outline-none focus:ring-4 focus:ring-po-ocean/25"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {estado && !prueba && (estado.pase || estado.usadas > 0) && (
        <p className="mt-4 text-[16px] text-stone-700">
          {estado.pase
            ? `Tu pase está activo en este navegador hasta el ${fechaCorta(estado.pase)}.`
            : `Te quedan ${estado.quedan} de 3 búsquedas gratis hoy.`}
        </p>
      )}

      {error && (
        <p role="alert" className="mt-6 rounded-lg border-2 border-red-700 bg-white px-4 py-3 text-[17px] text-red-800">
          {error}
        </p>
      )}

      {tope && (
        <section className="mt-8 rounded-xl bg-po-ocean px-5 py-7 text-white md:px-8">
          <h2 className="font-heading text-[26px] font-black leading-tight">Ya hiciste tus 3 búsquedas gratis de hoy</h2>
          <p className="mt-3 text-[18px] leading-[1.5]">Mañana tienes 3 más. Si lo usas para trabajar, busca sin tope por $9 al mes.</p>
          <a
            href="/api/que-dijo/pase?ir=1"
            className="mt-5 inline-flex min-h-14 items-center justify-center rounded-lg bg-white px-6 text-[18px] font-bold text-po-ocean hover:bg-stone-100 focus:outline-none focus:ring-4 focus:ring-white/50"
          >
            Buscar sin tope por $9 al mes
          </a>
          <p className="mt-4 text-[16px] leading-[1.5]">
            Pagas con tarjeta. El pase vive en el navegador donde pagaste. Para cancelar o si algo falla, textea al 787-417-7711.
          </p>
        </section>
      )}

      {!filas && !tope && inicio.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-[22px] font-bold text-stone-900">Lo último que se dijo en Cabo Rojo</h2>
          <p className="mt-2 text-[16px] leading-[1.5] text-stone-700">
            Estas frases las escogió una máquina. Son citas del video, no un juicio. Mira el video antes de citar.
          </p>
          <ol className="mt-5 space-y-5">
            {inicio.map((f, i) => (
              <Momento key={f.enlace} f={f} pos={i + 1} exacto donde="inicio" enlacePagina={`${SITIO}/que-dijo?tipo=promesa&cr=1&utm_source=whatsapp`} />
            ))}
          </ol>
        </section>
      )}

      {filas && (
        <section className="mt-8" aria-live="polite">
          <h2 className="font-heading text-[22px] font-bold text-stone-900">
            {(() => {
              const t = TIPOS.find((x) => x.id === tipo);
              if (!t) return filas.length ? `${filas.length} momentos para “${buscado}”` : `Nada para “${buscado}”`;
              const de = buscado ? ` con “${buscado}”` : "";
              const lugar = soloCr ? " en videos de Cabo Rojo" : "";
              return filas.length
                ? `${filas.length} ${filas.length === 1 ? t.uno : t.varios}${de}${lugar}, lo más reciente primero`
                : `No hay ${t.varios}${de}${lugar}`;
            })()}
          </h2>
          {tipo && filas.length > 0 && (
            <p className="mt-2 text-[16px] leading-[1.5] text-stone-700">
              Estas frases las escogió una máquina y a veces se equivoca de tipo. Son citas del video, no un juicio. Mira el
              video antes de citar.
            </p>
          )}
          {!filas.length && (
            <p className="mt-3 text-[17px] leading-[1.6] text-stone-700">
              Prueba con el apellido solo, o con la agencia{soloCr ? ", o quita la marca de Solo Cabo Rojo" : ""}. Esta búsqueda no gastó turno.
            </p>
          )}
          <ol className="mt-5 space-y-5">
            {filas.map((f, i) => (
              <Momento key={f.enlace} f={f} pos={i + 1} exacto={Boolean(tipo)} donde={donde} enlacePagina={enlacePagina} />
            ))}
          </ol>
          <Opinion key={vuelta} donde={donde} />
        </section>
      )}
    </div>
  );
}
