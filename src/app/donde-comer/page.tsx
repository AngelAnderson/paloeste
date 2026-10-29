import { Metadata } from "next";
import Link from "next/link";
import { PlaceCard } from "@/components/place-card";
import { getPlaces } from "@/lib/supabase";
import type { Place } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Dónde Comer en el Oeste de Puerto Rico",
  description:
    "Los mejores restaurantes, cafés, chinchorros y food trucks del oeste de Puerto Rico. Joyuda, Boquerón, Cabo Rojo y más.",
};

const ZONES: { name: string; description: string; highlights: string; href?: string }[] = [
  {
    name: "Joyuda, Cabo Rojo",
    description: "Más de 30 restaurantes frente al mar, con teléfono y horario. Dinos cuántos son y qué les gusta y te damos 3 opciones abiertas ahora.",
    highlights: "Ver la Ruta Joyuda →",
    href: "https://www.mapadecaborojo.com/ruta-joyuda",
  },
  {
    name: "Boquerón",
    description: "Empanadas, alcapurrias, mofongo relleno. El paseo marítimo con sabor.",
    highlights: "Kioscos · Frituras · Ambiente casual",
  },
  {
    name: "Región Cafetera",
    description: "Café de altura en Maricao, Las Marías y San Sebastián.",
    highlights: "Hacienda Lealtad · Café Lucero · Café Don Ruiz",
  },
];

export default async function DondeComerPage() {
  let restaurants: Place[] = [];
  try {
    restaurants = await getPlaces("FOOD");
  } catch {
    // Empty state
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <div className="space-y-3">
        <h1 className="text-4xl font-display font-black text-stone-900">
          🍽️ Dónde Comer en el Oeste
        </h1>
        <p className="text-lg text-stone-500">
          {restaurants.length} restaurantes, cafés y chinchorros en el oeste de Puerto Rico.
        </p>
      </div>

      {/* Zones */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ZONES.map((zone) => {
          const card = (
            <>
              <h3 className="font-bold text-stone-900">{zone.name}</h3>
              <p className="text-base text-stone-600">{zone.description}</p>
              <p className="text-base text-red-700 font-bold">{zone.highlights}</p>
            </>
          );
          const cls = "p-5 rounded-xl bg-[#FAFAF7] border border-po-border shadow-sm space-y-2";
          return zone.href ? (
            <Link key={zone.name} href={zone.href} className={`${cls} block no-underline min-h-12`}>
              {card}
            </Link>
          ) : (
            <div key={zone.name} className={cls}>
              {card}
            </div>
          );
        })}
      </section>

      {/* Restaurant Grid */}
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-stone-500">
          <p>No hay restaurantes disponibles aún.</p>
        </div>
      )}
    </div>
  );
}
