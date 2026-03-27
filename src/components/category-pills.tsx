"use client";

import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export function CategoryPills({ active }: { active?: string }) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      <Link
        href="/directorio"
        className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
          !active
            ? "bg-red-600 text-white"
            : "bg-blue-950/50 text-blue-200/60 hover:bg-blue-900/50"
        }`}
      >
        Todos
      </Link>
      {CATEGORIES.map((cat) => (
        <Link
          key={cat.id}
          href={`/directorio/${cat.id.toLowerCase()}`}
          className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-1.5 ${
            active?.toUpperCase() === cat.id
              ? "bg-red-600 text-white"
              : "bg-blue-950/50 text-blue-200/60 hover:bg-blue-900/50"
          }`}
        >
          <span>{cat.icon}</span>
          <span>{cat.label_es}</span>
        </Link>
      ))}
    </div>
  );
}
