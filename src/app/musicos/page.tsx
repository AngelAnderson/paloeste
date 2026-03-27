import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { CONTACT_WHATSAPP } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Músicos del Oeste de Puerto Rico",
  description:
    "Directorio de músicos, grupos y artistas del oeste de Puerto Rico. Bomba, plena, salsa, merengue y más.",
};

const MUSICIANS = [
  { name: "Grupo Esencia", genre: "Salsa · Merengue · Música Variada", phone: "787-487-7007" },
  { name: "Los NN's de la Rumba", genre: "Rumba · Música Tropical", phone: "787-517-2865" },
  { name: "Pleneros de Severo", genre: "Plena Tradicional", phone: "787-487-7007" },
  { name: "Duo Pantera", genre: "Música Variada · Duo", phone: "787-517-2865" },
  { name: "Siembra Maestra", genre: "Música Folklórica · Raíces", phone: "787-487-7007" },
  { name: "El Curteto de Bomba", genre: "Bomba Puertorriqueña", phone: "787-487-7007" },
  { name: "Maestro Carlos A. Laster", genre: "Música Clásica · Dirección Musical", phone: "787-487-7007" },
  { name: "Típica Plena – Alex López 'El Callejero'", genre: "Plena Típica", phone: "787-487-7007" },
  { name: "Jay Ruiz", genre: "Cantante · Música Variada", phone: "787-487-7007" },
  { name: "Las Juanas del Merengue", genre: "Merengue", phone: "787-517-2865" },
];

export default function MusicosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black text-zinc-900">
          🎵 Músicos del Oeste de Puerto Rico
        </h1>
        <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
          Los artistas y grupos que mantienen viva la tradición musical del oeste.
          Bomba, plena, salsa, merengue — aquí los encuentras.
        </p>
        <p className="text-sm text-zinc-400 italic">
          Publicado en la Revista Pal&apos; Oeste, Edición No. 1 (Enero 2026)
        </p>
      </div>

      <div className="space-y-3">
        {MUSICIANS.map((m) => (
          <div
            key={m.name}
            className="flex items-center gap-4 p-5 rounded-xl bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-2xl shrink-0">
              🎶
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-zinc-900 text-lg">{m.name}</h2>
              <p className="text-sm text-zinc-500">{m.genre}</p>
            </div>
            <a
              href={`tel:${m.phone}`}
              className="shrink-0 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
            >
              📞 {m.phone}
            </a>
          </div>
        ))}
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center space-y-3">
        <h3 className="text-xl font-bold text-zinc-900">
          ¿Eres músico del oeste de Puerto Rico?
        </h3>
        <p className="text-zinc-500">
          Aparece en nuestro directorio. Contáctanos para incluir tu perfil.
        </p>
        <Link
          href={CONTACT_WHATSAPP}
          target="_blank"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-full transition-colors text-sm"
        >
          Contáctanos por WhatsApp →
        </Link>
      </div>
    </div>
  );
}
