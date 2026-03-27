import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CONTACT_WHATSAPP } from "@/lib/constants";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Eventos en el Oeste de Puerto Rico",
  description:
    "Calendario de eventos, festivales, ferias y actividades culturales en el oeste de Puerto Rico.",
};

const RECURRING = [
  {
    name: "Mangata De Bomba",
    location: "Puesta Del Sol, Joyuda, Cabo Rojo",
    schedule: "Último domingo del mes",
    type: "Bomba · Cultural",
    free: true,
    description: "Evento de bomba en la playa con comida, música y tambores tradicionales. Para toda la familia.",
  },
  {
    name: "Mercado de Artesanos",
    location: "Plaza Colón, Mayagüez",
    schedule: "1er domingo de cada mes",
    type: "Arte · Artesanía",
    free: true,
    description: "Venta de arte, dulces típicos y música en vivo en el corazón de Mayagüez.",
  },
  {
    name: "Noche de Salsa bajo las Estrellas",
    location: "Boquerón Boardwalk",
    schedule: "Último viernes del mes",
    type: "Música · Salsa",
    free: true,
    description: "Orquesta en vivo, ambiente casual, en el paseo de Boquerón.",
  },
];

const ANNUAL = [
  { name: "Festival del Café", location: "Maricao", month: "Marzo" },
  { name: "Festival de la Ballena", location: "Rincón", month: "Julio" },
  { name: "Fiestas Patronales", location: "San Germán", month: "Agosto" },
  { name: "Festival de la Capa Prieta", location: "Lajas", month: "Noviembre" },
  { name: "Festival de Reyes", location: "Hormigueros", month: "Enero" },
  { name: "Encendido Navideño", location: "Aguadilla", month: "Diciembre" },
];

export default function EventosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black text-zinc-900">
          📅 Eventos en el Oeste
        </h1>
        <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
          Festivales, ferias, actividades culturales y entretenimiento en el oeste de Puerto Rico.
        </p>
      </div>

      {/* Recurring Events */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900">Eventos Recurrentes</h2>
        <div className="space-y-4">
          {RECURRING.map((e) => (
            <Card key={e.name} className="bg-white border-zinc-200 shadow-sm">
              <CardContent className="p-6 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">
                    {e.type}
                  </Badge>
                  {e.free && (
                    <Badge className="bg-green-50 text-green-600 border-green-200 text-xs">
                      Gratis
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-zinc-500 border-zinc-300 text-xs">
                    {e.schedule}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold text-zinc-900">{e.name}</h3>
                <p className="text-zinc-600">{e.description}</p>
                <p className="text-sm text-zinc-500">📍 {e.location}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Annual Calendar */}
      <section className="space-y-4">
        <h2 className="text-2xl font-bold text-zinc-900">Calendario Anual</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ANNUAL.map((e) => (
            <div
              key={e.name}
              className="flex items-center gap-3 p-4 rounded-xl bg-white border border-zinc-200 shadow-sm"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-50 flex items-center justify-center text-sm font-black text-blue-700 shrink-0">
                {e.month.slice(0, 3).toUpperCase()}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900">{e.name}</h3>
                <p className="text-sm text-zinc-500">📍 {e.location}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Submit Event */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center space-y-3">
        <h3 className="text-xl font-bold text-zinc-900">
          ¿Tienes un evento en el oeste?
        </h3>
        <p className="text-zinc-500">
          Publícalo gratis en nuestro calendario.
        </p>
        <Link
          href={CONTACT_WHATSAPP}
          target="_blank"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-full transition-colors text-sm"
        >
          Enviar Evento por WhatsApp →
        </Link>
      </div>
    </div>
  );
}
