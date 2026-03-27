import { Metadata } from "next";
import { PlaceCard } from "@/components/place-card";
import { getPlaces } from "@/lib/supabase";
import type { Place } from "@/lib/types";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Dónde Comer en el Oeste de Puerto Rico",
  description:
    "Los mejores restaurantes, cafés, chinchorros y food trucks del oeste de Puerto Rico. Joyuda, Boquerón, Cabo Rojo y más.",
};

const ZONES = [
  {
    name: "Joyuda, Cabo Rojo",
    description: "15+ restaurantes frente al mar. Mariscos frescos, mofongo, vista al atardecer.",
    highlights: "Vista Bahía · El Bohío · Puesta del Sol",
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
        <h1 className="text-4xl font-black text-zinc-900">
          🍽️ Dónde Comer en el Oeste
        </h1>
        <p className="text-lg text-zinc-500">
          {restaurants.length} restaurantes, cafés y chinchorros en el oeste de Puerto Rico.
        </p>
      </div>

      {/* Zones */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ZONES.map((zone) => (
          <div
            key={zone.name}
            className="p-5 rounded-xl bg-white border border-zinc-200 shadow-sm space-y-2"
          >
            <h3 className="font-bold text-zinc-900">{zone.name}</h3>
            <p className="text-sm text-zinc-500">{zone.description}</p>
            <p className="text-xs text-red-600 font-medium">{zone.highlights}</p>
          </div>
        ))}
      </section>

      {/* Restaurant Grid */}
      {restaurants.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {restaurants.map((place) => (
            <PlaceCard key={place.id} place={place} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-zinc-500">
          <p>No hay restaurantes disponibles aún.</p>
        </div>
      )}
    </div>
  );
}
