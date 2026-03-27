import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { PlaceCard } from "@/components/place-card";
import { FOUNDER_SLUGS, BOT_PHONE, CONTACT_WHATSAPP } from "@/lib/constants";
import { supabase } from "@/lib/supabase";
import type { Place } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Nuestros Sponsors — Anunciantes Fundadores",
  description:
    "Los 25 negocios que confiaron en Pal Oeste desde la primera edición. Anunciantes fundadores de la Revista 2025.",
};

const BENEFITS = [
  { icon: "🌐", title: "Listing destacado en paloeste.com", desc: "Tu negocio con foto, contacto, y badge exclusivo" },
  { icon: "🤖", title: "Recomendado por Bot *7711", desc: "El asistente AI te menciona cuando la gente busca" },
  { icon: "📱", title: "Mención en Facebook", desc: "Posts de Orgullo Local en CaboRojo.com (15K+ seguidores)" },
  { icon: "📧", title: "Inclusión en Newsletter", desc: "2,400+ suscriptores reciben tu nombre cada semana" },
  { icon: "📊", title: "Dashboard de Analytics", desc: "Vistas, clicks, búsquedas — datos reales de tu negocio" },
  { icon: "📕", title: "Presencia en la Revista", desc: "Edición impresa y digital distribuida en el oeste" },
];

export default async function SponsorsPage() {
  const { data } = await supabase
    .from("places")
    .select("*")
    .in("slug", FOUNDER_SLUGS)
    .eq("visibility", "published")
    .order("name");

  const founders = (data as Place[]) || [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-sm px-4 py-1">
          🏅 Edición Fundadores — Solo 25 negocios
        </Badge>
        <h1 className="text-4xl font-black text-zinc-900">
          Los negocios que creyeron primero
        </h1>
        <p className="text-lg text-zinc-500">
          Estos {founders.length} negocios confiaron en Pal&apos; Oeste desde la primera edición
          de la revista. Su badge de Anunciante Fundador es exclusivo y permanente — nunca
          se otorga a nuevos sponsors.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {[
          { num: "25", label: "Fundadores" },
          { num: "162+", label: "Negocios en directorio" },
          { num: "15K+", label: "Seguidores FB" },
          { num: "2,400+", label: "Suscriptores newsletter" },
        ].map((s) => (
          <div key={s.label} className="text-center p-4 bg-zinc-50 rounded-xl border border-zinc-200">
            <div className="text-2xl font-black text-red-600">{s.num}</div>
            <div className="text-xs text-zinc-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Founders Grid */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900">🏅 Anunciantes Fundadores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {founders.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-zinc-900 text-center">
          Lo que reciben nuestros sponsors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-3 p-4 bg-white border border-zinc-200 rounded-xl shadow-sm">
              <span className="text-2xl shrink-0">{b.icon}</span>
              <div>
                <h3 className="font-bold text-zinc-900 text-sm">{b.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 md:p-12 text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-red-700">
          ¿Quieres ser el próximo?
        </h2>
        <p className="text-zinc-600">
          Los badges de Fundador están cerrados, pero los paquetes Sponsor están abiertos.
          Directorio + bot *{BOT_PHONE} + Facebook + newsletter. Desde $299/año.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/anuncia"
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full transition-colors"
          >
            Ver Paquetes →
          </Link>
          <Link
            href={CONTACT_WHATSAPP}
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-full transition-colors"
          >
            WhatsApp Directo
          </Link>
        </div>
      </div>
    </div>
  );
}
