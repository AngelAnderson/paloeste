"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/search-input";
import { PlaceCardCompact } from "@/components/place-card";
import { supabase } from "@/lib/supabase";
import type { Place } from "@/lib/types";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [results, setResults] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (!query.trim()) return;

    async function search() {
      setLoading(true);
      setSearched(true);

      // Text search across name, description, tags, category, subcategory, address
      const searchTerm = `%${query}%`;
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("visibility", "published")
        .neq("quality_tier", "hidden")
        .or(
          `name.ilike.${searchTerm},description.ilike.${searchTerm},category.ilike.${searchTerm},subcategory.ilike.${searchTerm},address.ilike.${searchTerm},one_liner.ilike.${searchTerm}`
        )
        .order("sponsor_weight", { ascending: false })
        .order("name")
        .limit(20);

      if (!error && data) {
        setResults(data as Place[]);
      } else {
        setResults([]);
      }
      setLoading(false);
    }

    search();
  }, [query]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-2xl font-black text-zinc-900">Buscar</h1>
      <SearchInput />

      {loading && (
        <div className="text-center py-12 text-zinc-500">
          Buscando &quot;{query}&quot;...
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <p className="text-zinc-500 text-lg">
            No encontramos resultados para &quot;{query}&quot;
          </p>
          <p className="text-zinc-400 text-sm">
            Intenta con otro término o explora el directorio.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-zinc-500">
            {results.length} resultado{results.length !== 1 ? "s" : ""} para &quot;{query}&quot;
          </p>
          <div className="space-y-2">
            {results.map((place) => (
              <PlaceCardCompact key={place.id} place={place} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function BuscarPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8"><p className="text-zinc-500">Cargando...</p></div>}>
      <SearchResults />
    </Suspense>
  );
}
