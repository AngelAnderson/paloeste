import { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { CONTACT_WHATSAPP } from "@/lib/constants";
import { getAllEvents } from "@/lib/supabase";
import type { Event } from "@/lib/types";
import Link from "next/link";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Eventos en el Oeste de Puerto Rico",
  description:
    "Calendario de eventos, festivales, ferias y actividades culturales en el oeste de Puerto Rico.",
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es-PR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function getMonthYear(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("es-PR", { month: "long", year: "numeric" });
}

function getDayNum(dateStr: string) {
  return new Date(dateStr).getDate().toString();
}

function getMonthShort(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("es-PR", { month: "short" }).toUpperCase();
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Comida: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  Deportes: { bg: "bg-blue-50", text: "text-blue-600", border: "border-blue-200" },
  Cultura: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  Comunidad: { bg: "bg-green-50", text: "text-green-600", border: "border-green-200" },
  Música: { bg: "bg-amber-50", text: "text-amber-600", border: "border-amber-200" },
  default: { bg: "bg-zinc-50", text: "text-zinc-600", border: "border-zinc-200" },
};

function getCatColor(cat: string) {
  return CATEGORY_COLORS[cat] || CATEGORY_COLORS.default;
}

function EventCard({ event, isPast }: { event: Event; isPast: boolean }) {
  const colors = getCatColor(event.category);

  return (
    <div className={`flex gap-4 p-4 rounded-xl bg-white border border-zinc-200 shadow-sm ${isPast ? "opacity-60" : ""}`}>
      {/* Date block */}
      <div className="shrink-0 w-16 text-center">
        <div className="bg-red-600 text-white text-[10px] font-bold uppercase rounded-t-lg py-0.5">
          {getMonthShort(event.start_time)}
        </div>
        <div className="bg-zinc-50 border border-t-0 border-zinc-200 rounded-b-lg py-1.5">
          <span className="text-2xl font-black text-zinc-900">{getDayNum(event.start_time)}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={`${colors.bg} ${colors.text} ${colors.border} text-[10px]`}>
            {event.category}
          </Badge>
          {event.family_friendly && (
            <Badge className="bg-green-50 text-green-600 border-green-200 text-[10px]">
              Familiar
            </Badge>
          )}
          {event.is_featured && (
            <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[10px]">
              Destacado
            </Badge>
          )}
          {isPast && (
            <Badge variant="outline" className="text-zinc-400 border-zinc-300 text-[10px]">
              Pasado
            </Badge>
          )}
        </div>
        <h3 className="font-bold text-zinc-900 leading-tight">{event.title}</h3>
        <p className="text-sm text-zinc-500 line-clamp-2">{event.description}</p>
        <div className="flex flex-wrap gap-3 text-xs text-zinc-400">
          <span>🕐 {formatTime(event.start_time)}</span>
          <span>📍 {event.location_name}</span>
        </div>
      </div>
    </div>
  );
}

export default async function EventosPage() {
  let allEvents: Event[] = [];
  try {
    allEvents = await getAllEvents();
  } catch {
    // Empty state
  }

  const now = new Date();
  const upcoming = allEvents
    .filter((e) => new Date(e.start_time) >= now && e.status !== "archived")
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const past = allEvents
    .filter((e) => new Date(e.start_time) < now || e.status === "archived")
    .sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

  // Group upcoming by month
  const upcomingByMonth: Record<string, Event[]> = {};
  for (const e of upcoming) {
    const key = getMonthYear(e.start_time);
    if (!upcomingByMonth[key]) upcomingByMonth[key] = [];
    upcomingByMonth[key].push(e);
  }

  // Group past by month (show last 3 months)
  const pastByMonth: Record<string, Event[]> = {};
  for (const e of past.slice(0, 30)) {
    const key = getMonthYear(e.start_time);
    if (!pastByMonth[key]) pastByMonth[key] = [];
    pastByMonth[key].push(e);
  }

  // Count events per category in a single pass
  const categoryCounts = new Map<string, number>();
  for (const e of allEvents) {
    categoryCounts.set(e.category, (categoryCounts.get(e.category) ?? 0) + 1);
  }
  const categories = [...categoryCounts.keys()];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-black text-zinc-900">
          📅 Eventos en el Oeste
        </h1>
        <p className="text-lg text-zinc-500 max-w-2xl mx-auto">
          {allEvents.length} eventos registrados · {upcoming.length} próximos · {categories.length} categorías
        </p>
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map((cat) => {
          const colors = getCatColor(cat);
          const count = categoryCounts.get(cat) ?? 0;
          return (
            <span key={cat} className={`${colors.bg} ${colors.text} ${colors.border} border px-3 py-1 rounded-full text-xs font-medium`}>
              {cat} ({count})
            </span>
          );
        })}
      </div>

      {/* Upcoming */}
      {upcoming.length > 0 ? (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-zinc-900">Próximos Eventos</h2>
          {Object.entries(upcomingByMonth).map(([month, events]) => (
            <div key={month} className="space-y-3">
              <h3 className="text-sm font-bold text-red-600 uppercase tracking-wider border-b border-zinc-200 pb-1">
                {month}
              </h3>
              <div className="space-y-3">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} isPast={false} />
                ))}
              </div>
            </div>
          ))}
        </section>
      ) : (
        <div className="text-center py-8 bg-zinc-50 border border-zinc-200 rounded-xl p-6">
          <p className="text-lg font-medium text-zinc-700">No hay eventos próximos registrados.</p>
          <p className="text-sm text-zinc-500 mt-1">¿Tienes un evento? Envíanoslo para publicarlo.</p>
        </div>
      )}

      {/* Past events */}
      {Object.keys(pastByMonth).length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold text-zinc-900">Eventos Pasados</h2>
          {Object.entries(pastByMonth).map(([month, events]) => (
            <div key={month} className="space-y-3">
              <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 pb-1">
                {month}
              </h3>
              <div className="space-y-2">
                {events.map((e) => (
                  <EventCard key={e.id} event={e} isPast={true} />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

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
