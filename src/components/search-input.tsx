"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function SearchInput({ size = "default" }: { size?: "default" | "large" }) {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/buscar?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const isLarge = size === "large";

  return (
    <form onSubmit={handleSearch} className="flex gap-2 w-full">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="¿Qué buscas? — plomero, restaurante, playa..."
        className={`bg-[#FAFAF7] border-po-border text-stone-900 placeholder:text-stone-400 focus-visible:ring-red-500 ${
          isLarge ? "h-14 text-lg px-5" : "h-10"
        }`}
      />
      <Button
        type="submit"
        className={`bg-red-600 hover:bg-red-700 text-white font-bold shrink-0 ${
          isLarge ? "h-14 px-8 text-lg" : "h-10"
        }`}
      >
        Buscar
      </Button>
    </form>
  );
}
