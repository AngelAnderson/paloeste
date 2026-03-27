import { Metadata } from "next";
import { SearchInput } from "@/components/search-input";
import { CategoryPills } from "@/components/category-pills";
import { PlaceCard } from "@/components/place-card";
import { getPlaces } from "@/lib/supabase";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Directorio de Negocios",
  description:
    "Encuentra negocios, restaurantes, servicios y más en el oeste de Puerto Rico.",
};

export default async function DirectorioPage() {
  let places: Awaited<ReturnType<typeof getPlaces>> = [];
  try {
    places = await getPlaces();
  } catch {
    // Empty state
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">Directorio del Oeste</h1>
        <p className="text-zinc-400">
          {places.length} negocios y servicios en el oeste de Puerto Rico
        </p>
      </div>

      <SearchInput />
      <CategoryPills />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>

      {places.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <p className="text-lg">No hay negocios disponibles aún.</p>
          <p className="text-sm mt-2">
            Configura las variables de Supabase para ver los datos.
          </p>
        </div>
      )}
    </div>
  );
}
