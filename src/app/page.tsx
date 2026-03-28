import Link from "next/link";
import Image from "next/image";
import { SearchInput } from "@/components/search-input";
import { CategoryPills } from "@/components/category-pills";
import { PlaceCard } from "@/components/place-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getFeaturedPlaces, getPlaces, getUpcomingEvents } from "@/lib/supabase";
import { BOT_PHONE, BOT_WHATSAPP_URL } from "@/lib/constants";
import type { Event, Place } from "@/lib/types";

export const revalidate = 3600;

const MUSICIANS = [
  { name: "Grupo Esencia", genre: "Salsa · Merengue", phone: "787-487-7007" },
  { name: "Los NN's de la Rumba", genre: "Rumba · Tropical", phone: "787-517-2865" },
  { name: "Pleneros de Severo", genre: "Plena Tradicional", phone: "787-487-7007" },
  { name: "El Curteto de Bomba", genre: "Bomba Puertorriqueña", phone: "787-487-7007" },
  { name: "Típica Plena – El Callejero", genre: "Plena Típica", phone: "787-487-7007" },
  { name: "Las Juanas del Merengue", genre: "Merengue", phone: "787-517-2865" },
];

const ROUTES = [
  { name: "Ruta Playera", stops: "Cabo Rojo → Joyuda → Boquerón → Lajas", icon: "🏖️" },
  { name: "Ruta del Café", stops: "Las Marías → Maricao → San Sebastián", icon: "☕" },
  { name: "Ruta Cultural", stops: "San Germán → Mayagüez → Añasco", icon: "🏛️" },
];

export default async function HomePage() {
  let featured: Place[] = [];
  let restaurants: Place[] = [];
  let events: Event[] = [];
  try {
    featured = await getFeaturedPlaces();
    restaurants = (await getPlaces("FOOD")).slice(0, 6);
    events = (await getUpcomingEvents()).slice(0, 3);
  } catch {
    // Empty state if Supabase not configured
  }

  return (
    <div className="space-y-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-po-surface">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-white to-blue-600" />
        <div className="max-w-4xl mx-auto px-4 pt-16 pb-20 text-center space-y-6">
          <h1 className="font-display text-4xl md:text-6xl font-black tracking-tight text-stone-900">
            Lo mejor del{" "}
            <span className="text-red-600">Oeste</span>
          </h1>
          <p className="text-lg text-stone-500 max-w-2xl mx-auto">
            Negocios, restaurantes, playas, músicos y cultura del oeste de Puerto Rico.
            Pregunta como si le hablaras a un pana.
          </p>
          <div className="max-w-xl mx-auto">
            <SearchInput size="large" />
          </div>
          <p className="text-sm text-stone-400">
            También por WhatsApp:{" "}
            <Link href={BOT_WHATSAPP_URL} target="_blank" className="text-red-600 hover:text-red-700 font-medium">
              *{BOT_PHONE}
            </Link>
          </p>
        </div>
      </section>

      {/* Marina Puerto Real — Featured Sponsor */}
      <section className="max-w-6xl mx-auto px-4">
        <div className="bg-po-ocean rounded-2xl overflow-hidden md:flex shadow-lg">
          <div className="p-8 md:p-10 flex-1 space-y-4">
            <Badge className="bg-red-600 text-white font-bold">🏆 Presenting Sponsor</Badge>
            <h2 className="font-display text-3xl font-black text-white">Marina Puerto Real</h2>
            <p className="text-blue-200/80">
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
          <div className="h-48 md:h-auto md:w-80 bg-po-ocean-light flex items-center justify-center text-6xl">
            ⛵
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <h2 className="font-display text-2xl font-bold text-stone-900">Explora por categoría</h2>
        <CategoryPills />
      </section>

      {/* Dónde Comer */}
      {restaurants.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-stone-900">🍽️ Dónde Comer</h2>
            <Link href="/directorio/food" className="text-sm text-red-600 hover:text-red-700">
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
        <h2 className="font-display text-2xl font-bold text-stone-900">🗺️ Rutas del Oeste</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ROUTES.map((route) => (
            <Card key={route.name} className="bg-[#FAFAF7] border-po-border shadow-sm">
              <CardContent className="p-5 space-y-2">
                <div className="text-3xl">{route.icon}</div>
                <h3 className="font-display text-lg font-bold text-stone-900">{route.name}</h3>
                <p className="text-sm text-stone-500">{route.stops}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Músicos del Oeste */}
      <section className="max-w-6xl mx-auto px-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-stone-900">🎵 Músicos del Oeste</h2>
          <Link href="/musicos" className="text-sm text-red-600 hover:text-red-700">
            Ver directorio completo →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {MUSICIANS.map((m) => (
            <div key={m.name} className="flex items-center gap-3 p-4 rounded-xl bg-[#FAFAF7] border border-po-border shadow-sm">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-xl shrink-0">
                🎶
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-display font-bold text-stone-900 text-sm truncate">{m.name}</h3>
                <p className="text-xs text-stone-500">{m.genre}</p>
                <a href={`tel:${m.phone}`} className="text-xs text-red-600">{m.phone}</a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Eventos */}
      {events.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-stone-900">📅 Próximos Eventos</h2>
            <Link href="/eventos" className="text-sm text-red-600 hover:text-red-700">
              Ver todos →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {events.map((e) => (
              <Card key={e.id} className="bg-[#FAFAF7] border-po-border shadow-sm">
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">
                      {e.category}
                    </Badge>
                    {e.family_friendly && (
                      <Badge className="bg-green-50 text-green-600 border-green-200 text-xs">
                        Familiar
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-display text-lg font-bold text-stone-900">{e.title}</h3>
                  <p className="text-sm text-stone-500 line-clamp-2">{e.description}</p>
                  <p className="text-xs text-stone-400">📍 {e.location_name}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Featured / Sponsors */}
      {featured.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold text-stone-900">⭐ Negocios Destacados</h2>
            <Link href="/directorio" className="text-sm text-red-600 hover:text-red-700">
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
        <div className="bg-po-surface border border-po-border rounded-2xl p-8 md:p-12 text-center space-y-6 shadow-sm">
          <h2 className="font-display text-3xl font-black text-stone-900">📕 Nuestras Revistas</h2>
          <p className="text-stone-500 max-w-lg mx-auto">
            Guías del oeste de Puerto Rico. Disponibles en PDF digital o versión física en Amazon.
          </p>
          <Link href="/revista" className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full transition-colors">
            Ver Tienda →
          </Link>
        </div>
      </section>

      {/* Bot CTA */}
      <section className="max-w-4xl mx-auto px-4">
        <div className="bg-po-ocean rounded-2xl p-8 md:p-12 text-center space-y-4 shadow-lg">
          <h2 className="font-display text-3xl font-black text-white">📱 ¿Prefieres por WhatsApp?</h2>
          <p className="text-blue-200/80 max-w-lg mx-auto">
            Manda un mensaje a <strong className="text-white">*{BOT_PHONE}</strong> y
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
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 md:p-12 text-center space-y-4">
          <h2 className="font-display text-2xl font-bold text-red-700">
            ¿Tienes un negocio en el oeste?
          </h2>
          <p className="text-stone-600 max-w-lg mx-auto">
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
