import Link from "next/link";
import Image from "next/image";
import { SearchInput } from "@/components/search-input";
import { CategoryPills } from "@/components/category-pills";
import { PlaceCard } from "@/components/place-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getFeaturedPlaces, getPlaces } from "@/lib/supabase";
import { BOT_PHONE, BOT_WHATSAPP_URL } from "@/lib/constants";

export const revalidate = 3600;

const MUSICIANS = [
  { name: "Grupo Esencia", genre: "Salsa · Merengue", phone: "787-487-7007" },
  { name: "Los NN's de la Rumba", genre: "Rumba · Tropical", phone: "787-517-2865" },
  { name: "Pleneros de Severo", genre: "Plena Tradicional", phone: "787-487-7007" },
  { name: "El Curteto de Bomba", genre: "Bomba Puertorriqueña", phone: "787-487-7007" },
  { name: "Típica Plena – El Callejero", genre: "Plena Típica", phone: "787-487-7007" },
  { name: "Las Juanas del Merengue", genre: "Merengue", phone: "787-517-2865" },
];

const EVENTS = [
  { name: "Mangata De Bomba", location: "Puesta Del Sol, Joyuda", type: "Bomba · Gratis" },
  { name: "Mercado de Artesanos", location: "Plaza Colón, Mayagüez", type: "1er Domingo de cada mes" },
  { name: "Noche de Salsa", location: "Boquerón Boardwalk", type: "Último viernes del mes" },
];

const ROUTES = [
  { name: "Ruta Playera", stops: "Cabo Rojo → Joyuda → Boquerón → Lajas", icon: "🏖️" },
  { name: "Ruta del Café", stops: "Las Marías → Maricao → San Sebastián", icon: "☕" },
  { name: "Ruta Cultural", stops: "San Germán → Mayagüez → Añasco", icon: "🏛️" },
];

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof getFeaturedPlaces>> = [];
  let restaurants: Awaited<ReturnType<typeof getPlaces>> = [];
  try {
    featured = await getFeaturedPlaces();
    restaurants = (await getPlaces("FOOD")).slice(0, 6);
  } catch {
    // Empty state if Supabase not configured
  }

  return (
    <div className="space-y-20">
      {/* Hero — PR Flag Colors */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-red-950/30 via-[#0b1a2e] to-[#0b1a2e]" />
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-white to-blue-600" />
        <div className="relative max-w-4xl mx-auto px-4 pt-16 pb-20 text-center space-y-6">
          <Image src="/logo-white.png" alt="Pal Oeste" width={200} height={66} className="mx-auto h-16 w-auto" />
          <h1 className="text-4xl md:text-6xl font-black tracking-tight">
            Lo mejor del{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-white to-blue-400">
              Oeste
            </span>
          </h1>
          <p className="text-lg text-blue-200/60 max-w-2xl mx-auto">
            Negocios, restaurantes, playas, músicos y cultura del oeste de Puerto Rico.
            Pregunta como si le hablaras a un pana.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchInput size="large" />
          </div>
          <p className="text-sm text-blue-300/40">
            También por WhatsApp:{" "}
            <Link href={BOT_WHATSAPP_URL} target="_blank" className="text-red-400 hover:text-red-300 font-medium">
              *{BOT_PHONE}
            </Link>
          </p>
        </div>
      </section>

      {/* Marina Puerto Real — Featured Sponsor */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-700/30 rounded-2xl overflow-hidden md:flex">
          <div className="p-8 md:p-10 flex-1 space-y-4">
            <Badge className="bg-red-600 text-white font-bold">🏆 Presenting Sponsor</Badge>
            <h2 className="text-3xl font-black">Marina Puerto Real</h2>
            <p className="text-blue-200/70">
              El destino náutico del oeste de Puerto Rico. Restaurantes, servicios marinos,
              pesca deportiva y vistas espectaculares en Cabo Rojo.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="tel:7878276300" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                📞 787-827-6300
              </a>
              <Link href="/negocio/marina-puerto-real" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors">
                Ver Perfil →
              </Link>
            </div>
          </div>
          <div className="h-48 md:h-auto md:w-80 bg-blue-800/50 flex items-center justify-center text-6xl">
            ⛵
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <h2 className="text-2xl font-bold">Explora por categoría</h2>
        <CategoryPills />
      </section>

      {/* Dónde Comer */}
      {restaurants.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">🍽️ Dónde Comer</h2>
            <Link href="/directorio/food" className="text-sm text-red-400 hover:text-red-300">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map((place) => (
              <PlaceCard key={place.id} place={place} />
            ))}
          </div>
        </section>
      )}

      {/* Rutas Turísticas */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <h2 className="text-2xl font-bold">🗺️ Rutas del Oeste</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROUTES.map((route) => (
            <Card key={route.name} className="bg-blue-950/50 border-blue-800/30">
              <CardContent className="p-5 space-y-2">
                <div className="text-3xl">{route.icon}</div>
                <h3 className="text-lg font-bold text-white">{route.name}</h3>
                <p className="text-sm text-blue-300/60">{route.stops}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Músicos del Oeste */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">🎵 Músicos del Oeste</h2>
          <Link href="/musicos" className="text-sm text-red-400 hover:text-red-300">
            Ver directorio completo →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MUSICIANS.map((m) => (
            <div key={m.name} className="flex items-center gap-3 p-4 rounded-xl bg-blue-950/50 border border-blue-800/30">
              <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center text-xl shrink-0">
                🎶
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white text-sm truncate">{m.name}</h3>
                <p className="text-xs text-blue-300/60">{m.genre}</p>
                <a href={`tel:${m.phone}`} className="text-xs text-red-400">{m.phone}</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Eventos */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <h2 className="text-2xl font-bold">📅 Próximos Eventos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {EVENTS.map((e) => (
            <Card key={e.name} className="bg-blue-950/50 border-blue-800/30">
              <CardContent className="p-5 space-y-2">
                <Badge className="bg-red-600/20 text-red-400 border-red-600/30 text-xs">
                  {e.type}
                </Badge>
                <h3 className="text-lg font-bold text-white">{e.name}</h3>
                <p className="text-sm text-blue-300/60">📍 {e.location}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Featured / Sponsors */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">⭐ Negocios Destacados</h2>
            <Link href="/directorio" className="text-sm text-red-400 hover:text-red-300">
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

      {/* Tienda */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-br from-red-950/40 to-blue-950/40 border border-red-800/20 rounded-2xl p-8 md:p-12 text-center space-y-6">
          <h2 className="text-3xl font-black">📕 Nuestras Revistas</h2>
          <p className="text-blue-200/60 max-w-lg mx-auto">
            Guías del oeste de Puerto Rico. Disponibles en PDF digital o versión física en Amazon.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/revista" className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full transition-colors">
              Ver Tienda →
            </Link>
          </div>
        </div>
      </section>

      {/* Bot CTA */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-gradient-to-br from-blue-950 to-blue-900 border border-blue-700/30 rounded-2xl p-8 md:p-12 text-center space-y-4">
          <h2 className="text-3xl font-black">📱 ¿Prefieres por WhatsApp?</h2>
          <p className="text-blue-200/60 max-w-lg mx-auto">
            Manda un mensaje a <strong className="text-red-400">*{BOT_PHONE}</strong> y
            nuestro bot AI te encuentra lo que necesitas.
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
        <div className="bg-red-600/10 border border-red-600/20 rounded-2xl p-8 md:p-12 text-center space-y-4">
          <h2 className="text-2xl font-bold text-red-400">
            ¿Tienes un negocio en el oeste?
          </h2>
          <p className="text-blue-200/60 max-w-lg mx-auto">
            Aparece en nuestro directorio, en el bot *{BOT_PHONE}, en Facebook, y
            en el newsletter. Paquetes desde $299/año.
          </p>
          <Link
            href="/anuncia"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full transition-colors"
          >
            Anuncia tu Negocio →
          </Link>
        </div>
      </section>
    </div>
  );
}
