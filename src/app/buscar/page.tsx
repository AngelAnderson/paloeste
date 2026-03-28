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

      // Synonym expansion (same as bot *7711)
      const synonyms: Record<string, string> = {
        plomero: "plumber", plumber: "plomero",
        electricista: "electrician", electrician: "electricista",
        mariscos: "seafood", seafood: "mariscos",
        grua: "tow", tow: "grua",
        carniceria: "butcher", butcher: "carniceria",
        restaurante: "FOOD", comida: "FOOD",
        hotel: "LODGING", hospedaje: "LODGING",
        playa: "BEACH", beach: "BEACH",
        cafe: "café", coffee: "café",
      };

      const terms = [query, synonyms[query.toLowerCase()]].filter(Boolean);
      const searchTerm = `%${query}%`;

      // Text search across name, description, category, subcategory, address, one_liner
      const { data, error } = await supabase
        .from("places")
        .select("*")
        .eq("visibility", "published")
        .neq("quality_tier", "hidden")
        .or(
          terms.map(t => {
            const term = `%${t}%`;
            return `name.ilike.${term},description.ilike.${term},category.ilike.${term},subcategory.ilike.${term},address.ilike.${term},one_liner.ilike.${term}`;
          }).join(",")
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
      <h1 className="text-2xl font-display font-black text-stone-900">Buscar</h1>
      <SearchInput />

      {loading && (
        <div className="text-center py-12 text-stone-500">
          Buscando &quot;{query}&quot;...
        </div>
      )}

      {searched && !loading && results.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <p className="text-stone-500 text-lg">
            No encontramos resultados para &quot;{query}&quot;
          </p>
          <p className="text-stone-400 text-sm">
            Intenta con otro término o explora el directorio.
          </p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-stone-500">
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
    <Suspense fallback={<div className="max-w-3xl mx-auto px-4 py-8"><p className="text-stone-500">Cargando...</p></div>}>
      <SearchResults />
    </Suspense>
  );
}
