import type { Metadata } from "next";
import { Buscador } from "./buscador";

export const metadata: Metadata = {
  title: "¿Qué dijo? Busca lo que se dijo en video en Puerto Rico",
  description:
    "Escribe un nombre o un tema y mira el momento exacto del video donde lo dijeron. Noticias, vistas públicas y programas de Puerto Rico.",
  alternates: { canonical: "/que-dijo" },
};

export default function QueDijoPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-20 pt-10 md:pt-16">
      <h1 className="font-heading text-[clamp(2.6rem,9vw,4.2rem)] font-black leading-[1.02] text-stone-900">¿Qué dijo?</h1>
      <p className="mt-4 max-w-2xl text-[20px] leading-[1.5] text-stone-800">
        Escribe un nombre o un tema. Te enseñamos el momento exacto del video donde lo dijeron.
      </p>
      <Buscador />
      <section className="mt-14 border-t border-po-border pt-8 text-[17px] leading-[1.6] text-stone-700">
        <h2 className="font-heading text-[22px] font-bold text-stone-900">De dónde sale esto</h2>
        <p className="mt-3">
          De más de 2,600 videos públicos de noticias, vistas públicas, conferencias de prensa y programas de Puerto Rico
          (conteo del 18 de noviembre de 2026). Cada resultado te lleva al video original en YouTube, en el segundo exacto.
        </p>
        <p className="mt-3">
          El texto lo transcribe una máquina y puede tener errores, sobre todo en los nombres. Antes de citar a alguien,
          mira el video.
        </p>
        <p className="mt-3">Funciona mejor con nombres, apellidos, agencias y cifras. 3 búsquedas gratis al día.</p>
      </section>
    </main>
  );
}
