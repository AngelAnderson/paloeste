import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { CONTACT_WHATSAPP } from "@/lib/constants";
import { getUpcomingEvents } from "@/lib/supabase";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Eventos en el Oeste de Puerto Rico",
  description:
    "Calendario de eventos, festivales, ferias y actividades culturales en el oeste de Puerto Rico.",
};

const ANNUAL = [
  { name: "Festival del Café", location: "Maricao", month: "Mar" },
  { name: "Festival de la Ballena", location: "Rincón", month: "Jul" },
  { name: "Fiestas Patronales", location: "San Germán", month: "Ago" },
  { name: "Festival de la Capa Prieta", location: "Lajas", month: "Nov" },
  { name: "Festival de Reyes", location: "Hormigueros", month: "Ene" },
  { name: "Encendido Navideño", location: "Aguadilla", month: "Dic" },
];

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-PR", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function EventosPage() {
  let events: Awaited<ReturnType<typeof getUpcomingEvents>> = [];
  try {
    events = await getUpcomingEvents(30);
  } catch {
    // Empty state
  }

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

      {/* Upcoming Events from DB */}
      {events.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-zinc-900">Próximos Eventos</h2>
          <div className="space-y-4">
            {events.map((e) => (
              <Card key={e.id} className="bg-white border-zinc-200 shadow-sm">
                <CardContent className="p-6 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-red-50 text-red-600 border-red-200 text-xs">
                      {e.category}
                    </Badge>
                    {e.family_friendly && (
                      <Badge className="bg-green-50 text-green-600 border-green-200 text-xs">
                        Familiar
                      </Badge>
                    )}
                    {e.is_featured && (
                      <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-xs">
                        Destacado
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900">{e.title}</h3>
                  <p className="text-zinc-600">{e.description}</p>
                  <div className="flex flex-wrap gap-4 text-sm text-zinc-500">
                    <span>📅 {formatDate(e.start_time)}</span>
                    <span>📍 {e.location_name}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && (
        <div className="text-center py-8 text-zinc-500 bg-zinc-50 border border-zinc-200 rounded-xl p-6">
          <p className="text-lg font-medium">No hay eventos próximos registrados.</p>
          <p className="text-sm mt-1">¿Tienes un evento? Envíanoslo para publicarlo gratis.</p>
        </div>
      )}

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
                {e.month.toUpperCase()}
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
