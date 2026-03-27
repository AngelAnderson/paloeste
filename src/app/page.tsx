import Link from "next/link";
import { SearchInput } from "@/components/search-input";
import { CategoryPills } from "@/components/category-pills";
import { PlaceCard } from "@/components/place-card";
import { Badge } from "@/components/ui/badge";
import { getFeaturedPlaces } from "@/lib/supabase";
import { BOT_PHONE, BOT_WHATSAPP_URL } from "@/lib/constants";

export const revalidate = 3600;

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof getFeaturedPlaces>> = [];
  try {
    featured = await getFeaturedPlaces();
  } catch {
    // Will show empty state if Supabase not configured yet
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-950/20 via-zinc-950 to-zinc-950" />
        <div className="relative max-w-4xl mx-auto px-4 pt-20 pb-16 text-center space-y-6">
          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30 text-sm px-4 py-1">
            🌴 El Oeste de Puerto Rico
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Encuentra lo mejor del{" "}
            <span className="text-orange-500">Oeste</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            Negocios, restaurantes, playas, músicos y cultura. Pregunta como si
            le hablaras a un pana — nuestra AI te conecta.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchInput size="large" />
          </div>
          <p className="text-sm text-zinc-600">
            También por WhatsApp:{" "}
            <Link
              href={BOT_WHATSAPP_URL}
              target="_blank"
              className="text-orange-400 hover:text-orange-300 font-medium"
            >
              *{BOT_PHONE}
            </Link>
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <h2 className="text-2xl font-bold">Explora por categoría</h2>
        <CategoryPills />
      </section>

      {/* Featured / Sponsors */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Negocios Destacados</h2>
            <Link
              href="/directorio"
              className="text-sm text-orange-400 hover:text-orange-300"
            >
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      {/* Bot CTA */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 border border-zinc-700 rounded-2xl p-8 md:p-12 text-center space-y-4">
          <h2 className="text-3xl font-black">
            📱 ¿Prefieres por WhatsApp?
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Manda un mensaje a <strong className="text-orange-400">*{BOT_PHONE}</strong> y
            nuestro bot AI te encuentra lo que necesitas — restaurante, plomero,
            electricista, lo que sea.
          </p>
          <Link
            href={BOT_WHATSAPP_URL}
            target="_blank"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-full transition-colors"
          >
            Abrir WhatsApp →
          </Link>
        </div>
      </section>

      {/* Sponsor CTA */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-8 md:p-12 text-center space-y-4">
          <h2 className="text-2xl font-bold text-orange-400">
            ¿Tienes un negocio en el oeste?
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Aparece en nuestro directorio, en el bot *{BOT_PHONE}, en Facebook, y
            en el newsletter. Paquetes desde $299/año.
          </p>
          <Link
            href="/anuncia"
            className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-full transition-colors"
          >
            Anuncia tu Negocio →
          </Link>
        </div>
      </section>
    </div>
  );
}
