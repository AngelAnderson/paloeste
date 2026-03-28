import Link from "next/link";
import { Place } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { FOUNDER_SLUGS } from "@/lib/constants";

export function PlaceCard({ place }: { place: Place }) {
  const isOpen = place.status === "open";
  const isSponsor = place.is_featured || place.plan !== "free";
  const isFounder = FOUNDER_SLUGS.includes(place.slug);

  return (
    <Link href={`/negocio/${place.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 border-po-border bg-[#FAFAF7] shadow-sm">
        {place.hero_image_url && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={place.hero_image_url}
              alt={place.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isFounder && (
              <Badge className="absolute top-2 right-2 bg-amber-500 text-black font-bold text-[10px]">
                🏅 Fundador
              </Badge>
            )}
            {!isFounder && isSponsor && (
              <Badge className="absolute top-2 right-2 bg-red-600 text-white font-bold text-[10px]">
                ⭐ Sponsor
              </Badge>
            )}
          </div>
        )}
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-bold text-lg text-stone-900 group-hover:text-red-600 transition-colors line-clamp-1">
              {place.name}
            </h3>
            {isOpen ? (
              <Badge variant="outline" className="text-green-600 border-green-300 shrink-0 text-xs">
                Abierto
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-600 border-red-300 shrink-0 text-xs">
                Cerrado
              </Badge>
            )}
          </div>

          <p className="text-sm text-stone-500 line-clamp-2">
            {place.one_liner || place.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-stone-400">
            <span className="uppercase font-medium">{place.category}</span>
            {place.address && (
              <>
                <span>·</span>
                <span className="line-clamp-1">{place.address}</span>
              </>
            )}
          </div>

          {place.phone && (
            <div className="text-sm text-red-600 font-medium">
              📞 {place.phone}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function PlaceCardCompact({ place }: { place: Place }) {
  const isFounder = FOUNDER_SLUGS.includes(place.slug);

  return (
    <Link
      href={`/negocio/${place.slug}`}
      className="flex items-center gap-3 p-3 rounded-lg bg-[#FAFAF7] border border-po-border hover:border-red-300 transition-colors group shadow-sm"
    >
      {place.hero_image_url && (
        <img
          src={place.hero_image_url}
          alt={place.name}
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-stone-900 text-sm group-hover:text-red-600 transition-colors truncate">
          {place.name}
        </h4>
        <p className="text-xs text-stone-400 truncate">
          {place.category} · {place.address || "Cabo Rojo"}
        </p>
      </div>
      {isFounder && (
        <Badge className="bg-amber-100 text-amber-700 text-[10px] shrink-0">
          🏅 Fundador
        </Badge>
      )}
      {!isFounder && place.is_featured && (
        <Badge className="bg-red-50 text-red-600 text-[10px] shrink-0">
          ⭐
        </Badge>
      )}
    </Link>
  );
}
