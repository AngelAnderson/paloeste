import { Metadata } from "next";
import { CategoryPills } from "@/components/category-pills";
import { PlaceCard } from "@/components/place-card";
import { getPlaces } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/constants";

export const revalidate = 3600;

export function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ category: cat.id.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category } = await params;
  const cat = CATEGORIES.find(
    (c) => c.id.toLowerCase() === category.toLowerCase()
  );
  return {
    title: cat ? `${cat.label_es} — Directorio` : "Directorio",
    description: cat
      ? `${cat.label_es} en el oeste de Puerto Rico`
      : "Directorio del Oeste",
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const cat = CATEGORIES.find(
    (c) => c.id.toLowerCase() === category.toLowerCase()
  );

  let places: Awaited<ReturnType<typeof getPlaces>> = [];
  try {
    places = await getPlaces(category.toUpperCase());
  } catch {
    // Empty state
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-black">
          {cat ? `${cat.icon} ${cat.label_es}` : category}
        </h1>
        <p className="text-zinc-400">
          {places.length} resultados en el oeste de Puerto Rico
        </p>
      </div>

      <CategoryPills active={category} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {places.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>

      {places.length === 0 && (
        <div className="text-center py-16 text-zinc-500">
          <p>No hay negocios en esta categoría todavía.</p>
        </div>
      )}
    </div>
  );
}
