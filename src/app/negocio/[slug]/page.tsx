import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPlaceBySlug, getAllSlugs } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BOT_PHONE, BOT_WHATSAPP_URL, SITE_URL } from "@/lib/constants";

export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const slugs = await getAllSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) return { title: "No encontrado" };

  return {
    title: place.name,
    description: place.one_liner || place.description?.slice(0, 160),
    openGraph: {
      title: `${place.name} — Pal Oeste`,
      description: place.one_liner || place.description?.slice(0, 160),
      type: "website",
      url: `${SITE_URL}/negocio/${slug}`,
      ...(place.hero_image_url ? { images: [place.hero_image_url] } : {}),
    },
  };
}

function JsonLd({ place }: { place: { name: string; description: string; phone: string; address: string; hero_image_url?: string; lat?: number; lon?: number } }) {
  // Server-generated trusted content for SEO structured data
  const data = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: place.name,
    description: place.description,
    telephone: place.phone,
    address: place.address,
    ...(place.hero_image_url ? { image: place.hero_image_url } : {}),
    ...(place.lat && place.lon
      ? { geo: { "@type": "GeoCoordinates", latitude: place.lat, longitude: place.lon } }
      : {}),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function BusinessPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const place = await getPlaceBySlug(slug);
  if (!place) notFound();

  const isSponsor = place.is_featured || place.plan !== "free";

  return (
    <>
      <JsonLd place={place} />
      <article className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        {place.hero_image_url && (
          <div className="relative h-64 md:h-80 rounded-2xl overflow-hidden">
            <img
              src={place.hero_image_url}
              alt={place.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/60 via-transparent to-transparent" />
          </div>
        )}

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase text-xs">
              {place.category}
            </Badge>
            {isSponsor && (
              <Badge className="bg-amber-500 text-black font-bold">
                ⭐ Sponsor
              </Badge>
            )}
            {place.is_verified && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                ✓ Verificado
              </Badge>
            )}
            {place.status === "open" ? (
              <Badge variant="outline" className="text-green-600 border-green-300">
                Abierto
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-300">
                Cerrado
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-zinc-900">{place.name}</h1>
          {place.one_liner && (
            <p className="text-lg text-zinc-500">{place.one_liner}</p>
          )}
        </div>

        <Separator className="bg-zinc-200" />

        {/* Description */}
        <section className="space-y-2">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            Sobre el negocio
          </h2>
          <p className="text-zinc-700 leading-relaxed">{place.description}</p>
        </section>

        {/* Local Tip */}
        {place.local_tip && (
          <section className="bg-red-50 border border-red-100 rounded-xl p-5 space-y-2">
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider">
              💡 Tip Local
            </h3>
            <p className="text-zinc-700">{place.local_tip}</p>
          </section>
        )}

        {/* Contact Info */}
        <section className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            Contacto
          </h2>
          {place.phone && (
            <div className="flex items-center gap-3">
              <span className="text-xl">📞</span>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-medium">Teléfono</p>
                <a
                  href={`tel:${place.phone}`}
                  className="text-red-600 font-bold hover:text-red-700"
                >
                  {place.phone}
                </a>
              </div>
            </div>
          )}
          {place.address && (
            <div className="flex items-center gap-3">
              <span className="text-xl">📍</span>
              <div>
                <p className="text-xs text-zinc-500 uppercase font-medium">Dirección</p>
                <p className="text-zinc-700">{place.address}</p>
              </div>
            </div>
          )}
          {place.gmaps_url && (
            <Link
              href={place.gmaps_url}
              target="_blank"
              className="inline-block text-sm text-blue-600 hover:text-blue-700"
            >
              Abrir en Google Maps →
            </Link>
          )}
        </section>

        {/* Hours */}
        {place.opening_hours?.formatted && (
          <section className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 space-y-2">
            <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
              Horario
            </h2>
            <p className="text-zinc-700 whitespace-pre-line">
              {place.opening_hours.formatted}
            </p>
          </section>
        )}

        {/* Tags */}
        {place.tags && place.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {place.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="text-zinc-600 border-zinc-300 text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}

        {/* Bot CTA */}
        <section className="bg-zinc-50 border border-zinc-200 rounded-xl p-5 text-center space-y-3">
          <p className="text-zinc-500 text-sm">
            También puedes preguntar por este negocio por WhatsApp:
          </p>
          <Link
            href={`${BOT_WHATSAPP_URL}?text=${encodeURIComponent(`info ${place.name}`)}`}
            target="_blank"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-bold px-6 py-2 rounded-full transition-colors text-sm"
          >
            📱 Preguntar en *{BOT_PHONE}
          </Link>
        </section>
      </article>
    </>
  );
}
