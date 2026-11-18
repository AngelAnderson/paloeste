"use client";

import { useCallback, useEffect, useState } from "react";

type Fila = { titulo: string; canal: string; fecha: string; minuto: string; texto: string; enlace: string; mas?: number };
type Estado = { pase: string | null; quedan: number };

const EJEMPLOS = ["Roig renuncia", "LUMA aumento", "contrato del gas"];
const EJEMPLOS_CR = ["ambulancia", "el faro", "Combate"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fechaCorta(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${Number(m[3])} ${MESES[Number(m[2]) - 1]} ${m[1]}` : iso;
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

export function Buscador() {
  const [soloCr, setSoloCr] = useState(false);
  const [q, setQ] = useState("");
  const [filas, setFilas] = useState<Fila[] | null>(null);
  const [buscado, setBuscado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [tope, setTope] = useState(false);
  const [estado, setEstado] = useState<Estado | null>(null);
  const [aviso, setAviso] = useState("");

  const buscar = useCallback(async (texto: string, cr: boolean) => {
    const limpio = texto.trim();
    if (limpio.length < 3) {
      setError("Escribe un nombre o un tema de 3 letras o más.");
      return;
    }
    setCargando(true);
    setError("");
    setTope(false);
    try {
      const r = await fetch(`/api/que-dijo?q=${encodeURIComponent(limpio)}${cr ? "&cr=1" : ""}`, { cache: "no-store" });
      const d = await r.json();
      if (d.error) {
        setError(d.error);
      } else if (d.tope) {
        setTope(true);
        setFilas(null);
        setEstado((e) => ({ pase: e?.pase ?? null, quedan: 0 }));
      } else {
        setFilas(d.resultados || []);
        setBuscado(limpio);
        if (typeof d.quedan === "number") setEstado((e) => ({ pase: e?.pase ?? null, quedan: d.quedan }));
        window.history.replaceState(null, "", `/que-dijo?q=${encodeURIComponent(limpio)}${cr ? "&cr=1" : ""}`);
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
    fetch("/api/que-dijo?estado=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEstado({ pase: d.pase ?? null, quedan: Number(d.quedan) || 0 }))
      .catch(() => {});
    const cr = p.get("cr") === "1";
    if (cr) setSoloCr(true);
    const inicial = p.get("q");
    if (inicial) {
      setQ(inicial);
      buscar(inicial, cr);
    }
  }, [buscar]);

  return (
    <div className="mt-8">
      {aviso && (
        <p role="status" className="mb-5 rounded-lg border-2 border-po-ocean bg-white px-4 py-3 text-[17px] font-medium text-po-ocean">
          {aviso}
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
            if (q.trim().length >= 3) buscar(q, e.target.checked);
          }}
          className="h-6 w-6 shrink-0 accent-[#1E3A5F]"
        />
        <span>Solo Cabo Rojo (videos de CaboRojo.com desde 2020)</span>
      </label>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-[16px] text-stone-700">
        <span>Prueba con:</span>
        {(soloCr ? EJEMPLOS_CR : EJEMPLOS).map((e) => (
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

      {estado && (
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

      {filas && (
        <section className="mt-8" aria-live="polite">
          <h2 className="font-heading text-[22px] font-bold text-stone-900">
            {filas.length ? `${filas.length} momentos para “${buscado}”` : `Nada para “${buscado}”`}
          </h2>
          {!filas.length && (
            <p className="mt-3 text-[17px] leading-[1.6] text-stone-700">
              Prueba con el apellido solo, o con la agencia{soloCr ? ", o quita la marca de Solo Cabo Rojo" : ""}. Esta búsqueda no gastó turno.
            </p>
          )}
          <ol className="mt-5 space-y-5">
            {filas.map((f) => (
              <li key={f.enlace} className="rounded-xl border border-po-border bg-white p-5">
                <p className="font-mono text-[16px] font-medium tabular-nums text-red-800">
                  {fechaCorta(f.fecha)} · cerca del minuto {f.minuto}
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
                <a
                  href={f.enlace}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex min-h-12 items-center justify-center rounded-lg border-2 border-po-ocean px-5 text-[17px] font-bold text-po-ocean hover:bg-po-ocean hover:text-white focus:outline-none focus:ring-4 focus:ring-po-ocean/25"
                >
                  Ver ese momento en el video
                </a>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
