import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BOT_PHONE, CATEGORIES } from "@/lib/constants";
import { getPublicDemandStats } from "@/lib/admin-queries";

export const revalidate = 3600; // ISR: refresh every hour

export const metadata: Metadata = {
  title: "La Vitrina — Anuncia tu Negocio en Cabo Rojo",
  description:
    "Miles de personas buscan negocios como el tuyo cada mes en Cabo Rojo. La Vitrina de CaboRojo.com: 1 publicación por semana, ficha completa y una página hecha para que Google te encuentre.",
};

const CAT_LABEL: Record<string, string> = {};
CATEGORIES.forEach((c) => {
  CAT_LABEL[c.id] = c.label_es;
});

interface Props {
  searchParams: Promise<{ cat?: string }>;
}

export default async function AnunciaPage({ searchParams }: Props) {
  const { cat } = await searchParams;
  const stats = await getPublicDemandStats().catch(() => null);

  const totalSearches = stats?.total_searches || 4244;
  const uniqueUsers = stats?.unique_users || 120;
  const totalBiz = stats?.total_businesses || 975;

  // If ?cat=SERVICE, find that category's data
  const catData = cat
    ? (stats?.categories || []).find(
        (c: { category: string }) =>
          c.category.toUpperCase() === cat.toUpperCase()
      )
    : null;

  const heroNumber = catData ? catData.searches : totalSearches;
  const heroLabel = catData
    ? `personas buscaron ${CAT_LABEL[cat!.toUpperCase()] || cat} en Cabo Rojo`
    : "personas buscaron un negocio en Cabo Rojo";

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 space-y-16">
      {/* Hero */}
      <section className="text-center space-y-6 max-w-3xl mx-auto">
        <Badge className="bg-red-100 text-red-600 border-red-200">
          La Vitrina de Cabo Rojo
        </Badge>
        <h1 className="text-4xl md:text-5xl font-display font-black text-stone-900 leading-tight">
          <span className="text-red-600">
            {heroNumber.toLocaleString()}
          </span>{" "}
          {heroLabel}.
          <br />
          <span className="text-stone-400">¿Te encontraron?</span>
        </h1>
        <p className="text-lg text-stone-600 max-w-2xl mx-auto">
          Cada día, vecinos de Cabo Rojo textean al {BOT_PHONE} y le preguntan a
          El Veci por servicios. El Veci recomienda lo que le sirve al vecino, pague
          quien pague. La Vitrina es otra cosa: tu negocio publicado cada semana
          en CaboRojo.com.
        </p>
        {catData && (
          <p className="text-sm text-red-600 font-medium">
            Solo {catData.businesses} negocios aparecen en {CAT_LABEL[cat!.toUpperCase()] || cat}.{" "}
            {catData.searches} personas buscaron.
          </p>
        )}
      </section>

      {/* Proof strip */}
      <section className="grid grid-cols-3 text-center border-y border-po-border py-8">
        <div>
          <p className="text-3xl font-black text-stone-900">
            {totalSearches.toLocaleString()}
          </p>
          <p className="text-stone-500 text-sm mt-1">búsquedas</p>
        </div>
        <div>
          <p className="text-3xl font-black text-stone-900">{uniqueUsers}</p>
          <p className="text-stone-500 text-sm mt-1">usuarios únicos</p>
        </div>
        <div>
          <p className="text-3xl font-black text-stone-900">{totalBiz}+</p>
          <p className="text-stone-500 text-sm mt-1">negocios listados</p>
        </div>
      </section>

      {/* What people search */}
      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-display font-bold text-stone-900">
            Esto es lo que buscan en Cabo Rojo
          </h2>
          <p className="text-stone-500">
            Datos reales de lo que le preguntan a El Veci al {BOT_PHONE}. No encuestas, búsquedas reales.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          {(stats?.sample_queries || []).map(
            (q: { query: string; count: number; category: string }) => (
              <div
                key={q.query}
                className="bg-po-surface border border-po-border rounded-xl p-4 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-stone-900">
                    &ldquo;{q.query}&rdquo;
                  </p>
                  <p className="text-stone-400 text-sm">
                    {CAT_LABEL[q.category] || q.category}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-red-600">{q.count}</p>
                  <p className="text-stone-400 text-xs">búsquedas</p>
                </div>
              </div>
            )
          )}
        </div>
      </section>

      {/* How it works */}
      <section className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-stone-900 text-center">
          ¿Cómo funciona La Vitrina?
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <Step
            num="1"
            title="Publicamos cada semana"
            desc="1 publicación por semana en el Facebook de CaboRojo.com, 52 al año"
          />
          <Step
            num="2"
            title="Tu ficha y tu página"
            desc="Ficha completa con fotos reales y una página en CaboRojo.com hecha para que Google te encuentre"
          />
          <Step
            num="3"
            title="Te contamos lo entregado"
            desc="1 línea cada 3 meses y 1 reporte al año"
          />
        </div>
      </section>



      {/* La oferta, sin precio */}
      <section className="space-y-6" id="planes">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-stone-900">
            Una sola oferta
          </h2>
          <p className="text-stone-600 text-base">
            Sin exclusividad, sin plan mensual, sin mes de prueba.
          </p>
        </div>
        <div className="bg-po-surface border border-po-border rounded-2xl p-6 md:p-8 max-w-2xl mx-auto space-y-4">
          <ul className="space-y-3 text-base text-stone-700">
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>52 publicaciones al año (1 por semana) en el Facebook de CaboRojo.com
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>Ficha completa en el directorio con fotos reales
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>Una página en CaboRojo.com hecha para que Google te encuentre
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>1 línea cada 3 meses con lo entregado
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600">✓</span>1 reporte al año
            </li>
          </ul>
          <Link
            href="https://caborojo.com/vitrina"
            className="flex items-center justify-center min-h-12 px-6 rounded-lg font-bold text-base bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Ver La Vitrina en CaboRojo.com
          </Link>
          <p className="text-stone-600 text-base text-center">
            O textea VITRINA al {BOT_PHONE}.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-stone-900 text-center">
          Preguntas Frecuentes
        </h2>
        <div className="space-y-4 max-w-2xl mx-auto">
          <Faq
            q="¿Necesito tener página web?"
            a="No. Te hacemos una página en CaboRojo.com y tu ficha en el directorio. Solo necesitas un teléfono."
          />
          <Faq
            q="¿Me garantizan ventas?"
            a="No, nadie puede. Lo que entregamos es lo que dice la lista de arriba, y cada 3 meses te mandamos 1 línea con lo que se hizo."
          />
          <Faq
            q="¿El Veci recomienda a quien paga?"
            a="No. El Veci recomienda lo que le sirve al vecino, pague quien pague. La Vitrina no compra una recomendación."
          />
          <Faq
            q="¿Cómo empiezo?"
            a={`Entra a caborojo.com/vitrina o textea VITRINA al ${BOT_PHONE}.`}
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center space-y-6 py-8">
        <h2 className="text-3xl font-display font-black text-stone-900">
          ¿Quieres que te encuentren?
        </h2>
        <Link
          href="https://caborojo.com/vitrina"
          className="inline-flex items-center justify-center min-h-12 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors"
        >
          Ver La Vitrina en CaboRojo.com
        </Link>
        <p className="text-stone-600 text-base">
          Textea VITRINA al {BOT_PHONE}
        </p>
      </section>
    </div>
  );
}

function Step({
  num,
  title,
  desc,
}: {
  num: string;
  title: string;
  desc: string;
}) {
  return (
    <div>
      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 font-bold flex items-center justify-center mx-auto mb-3">
        {num}
      </div>
      <h3 className="font-bold text-stone-900 mb-1">{title}</h3>
      <p className="text-stone-500 text-sm">{desc}</p>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="border border-po-border rounded-xl p-5">
      <h3 className="font-bold text-stone-900 mb-2">{q}</h3>
      <p className="text-stone-500 text-sm">{a}</p>
    </div>
  );
}
