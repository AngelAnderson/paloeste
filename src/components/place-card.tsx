import Link from "next/link";
import { Place } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BOT_PHONE } from "@/lib/constants";

export function PlaceCard({ place }: { place: Place }) {
  const isOpen = place.status === "open";
  const isSponsor = place.is_featured || place.plan !== "free";

  return (
    <Link href={`/negocio/${place.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-200 border-zinc-200 bg-white shadow-sm">
        {place.hero_image_url && (
          <div className="relative h-40 overflow-hidden">
            <img
              src={place.hero_image_url}
              alt={place.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isSponsor && (
              <Badge className="absolute top-2 right-2 bg-amber-500 text-black font-bold">
                Sponsor
              </Badge>
            )}
          </div>
        )}
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-bold text-lg text-zinc-900 group-hover:text-red-400 transition-colors line-clamp-1">
              {place.name}
            </h3>
            {isOpen ? (
              <Badge variant="outline" className="text-green-400 border-green-700 shrink-0 text-xs">
                Abierto
              </Badge>
            ) : (
              <Badge variant="outline" className="text-red-400 border-red-700 shrink-0 text-xs">
                Cerrado
              </Badge>
            )}
          </div>

          <p className="text-sm text-zinc-500 line-clamp-2">
            {place.one_liner || place.description}
          </p>

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <span className="uppercase font-medium">{place.category}</span>
            {place.address && (
              <>
                <span>·</span>
                <span className="line-clamp-1">{place.address}</span>
              </>
            )}
          </div>

          {place.phone && (
            <div className="text-sm text-red-400 font-medium">
              📞 {place.phone}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

export function PlaceCardCompact({ place }: { place: Place }) {
  return (
    <Link
      href={`/negocio/${place.slug}`}
      className="flex items-center gap-3 p-3 rounded-lg bg-blue-950/50 border border-blue-800/30 hover:border-red-300 transition-colors group"
    >
      {place.hero_image_url && (
        <img
          src={place.hero_image_url}
          alt={place.name}
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-zinc-900 text-sm group-hover:text-red-400 transition-colors truncate">
          {place.name}
        </h4>
        <p className="text-xs text-zinc-400 truncate">
          {place.category} · {place.address || "Cabo Rojo"}
        </p>
      </div>
      {place.is_featured && (
        <Badge className="bg-amber-500/20 text-amber-400 text-[10px] shrink-0">
          ⭐
        </Badge>
      )}
    </Link>
  );
}
