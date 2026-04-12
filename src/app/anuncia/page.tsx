import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BOT_PHONE, CONTACT_WHATSAPP, CATEGORIES } from "@/lib/constants";
import { getPublicDemandStats } from "@/lib/admin-queries";

export const revalidate = 3600; // ISR: refresh every hour

export const metadata: Metadata = {
  title: "La Vitrina — Anuncia tu Negocio en Cabo Rojo",
  description:
    "Miles de personas buscan negocios como el tuyo cada mes en Cabo Rojo. Aparece en *7711, CaboRojo.com, y 6 sitios más. Desde $89/mes.",
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
        <p className="text-lg text-stone-500 max-w-2xl mx-auto">
          Cada día, residentes de Cabo Rojo textean al *{BOT_PHONE} buscando
          servicios. El bot recomienda negocios. Si no estás visible, recomienda
          a tu competencia.
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
            Datos reales del bot *{BOT_PHONE}. No encuestas — búsquedas reales.
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
          ¿Cómo funciona?
        </h2>
        <div className="grid md:grid-cols-3 gap-6 text-center">
          <Step
            num="1"
            title="Alguien textea *7711"
            desc={`"Necesito un electricista en Cabo Rojo" — por WhatsApp o SMS`}
          />
          <Step
            num="2"
            title="El Veci recomienda"
            desc="El bot responde con tu negocio: nombre, teléfono, horario, estrellas"
          />
          <Step
            num="3"
            title="Te llaman"
            desc="El cliente te contacta directamente. Sin intermediarios, sin clics."
          />
        </div>
      </section>

      {/* Luis David case study */}
      <section className="bg-stone-900 text-white rounded-2xl p-8 space-y-4">
        <Badge className="bg-green-900 text-green-300 border-green-700">
          Caso Real
        </Badge>
        <h3 className="text-xl font-bold">
          Luis David Refrigeration — Sponsor desde marzo 2026
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-stone-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-green-400">325</p>
            <p className="text-stone-400 text-sm">recomendaciones del bot</p>
          </div>
          <div className="bg-stone-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-green-400">✅</p>
            <p className="text-stone-400 text-sm">verificado con badge</p>
          </div>
          <div className="bg-stone-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-black text-green-400">24/7</p>
            <p className="text-stone-400 text-sm">leads por WhatsApp</p>
          </div>
        </div>
        <p className="text-stone-300 text-sm">
          Cada vez que alguien busca &ldquo;aire acondicionado&rdquo; o &ldquo;A/C&rdquo; en
          Cabo Rojo, el bot recomienda a Luis David primero. Sin que él tenga
          que hacer nada.
        </p>
      </section>

      {/* Value comparison */}
      <section className="space-y-6">
        <h2 className="text-2xl font-display font-bold text-stone-900 text-center">
          ¿Por qué La Vitrina y no Google Ads?
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="bg-stone-100 border-stone-200">
            <CardContent className="p-6 space-y-3">
              <h3 className="font-bold text-stone-400">Google Ads</h3>
              <ul className="space-y-2 text-sm text-stone-500">
                <li>❌ $3-5 por clic</li>
                <li>❌ Desaparece en 24 horas</li>
                <li>❌ Compites con todo Puerto Rico</li>
                <li>❌ Necesitas página web</li>
                <li>❌ $150-300/mes mínimo para funcionar</li>
              </ul>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200 ring-1 ring-red-200">
            <CardContent className="p-6 space-y-3">
              <h3 className="font-bold text-red-600">La Vitrina *7711</h3>
              <ul className="space-y-2 text-sm text-stone-700">
                <li>✅ $89/mes — precio fijo</li>
                <li>✅ Visible 24/7, permanente</li>
                <li>✅ Solo Cabo Rojo — tu mercado real</li>
                <li>✅ No necesitas página web</li>
                <li>✅ Leads directos por WhatsApp</li>
                <li>✅ Reporte mensual con datos reales</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing */}
      <section className="space-y-6" id="planes">
        <div className="text-center">
          <h2 className="text-2xl font-display font-bold text-stone-900">
            Planes de La Vitrina
          </h2>
          <p className="text-stone-500">
            Sin contratos. Cancela cuando quieras. Te activamos en 24 horas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Free */}
          <Card className="bg-po-surface border-po-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-stone-900">Gratis</h3>
              <div>
                <span className="text-3xl font-black text-stone-900">$0</span>
              </div>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Listado básico
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Nombre, tel, dirección
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Visible en búsquedas
                </li>
              </ul>
              <div className="block text-center py-2.5 rounded-lg text-sm bg-po-surface text-stone-400">
                Ya estás incluido
              </div>
            </CardContent>
          </Card>

          {/* Monthly */}
          <Card className="bg-po-surface border-po-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-stone-900">Mensual</h3>
              <div>
                <span className="text-3xl font-black text-stone-900">$89</span>
                <span className="text-stone-500">/mes</span>
              </div>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Prioridad en el bot *7711
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Badge verificado ✅
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Leads por WhatsApp
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>2 reposts/semana en FB
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Newsletter semanal
                </li>
              </ul>
              <Link
                href={`${CONTACT_WHATSAPP}?text=${encodeURIComponent("Quiero La Vitrina mensual ($89) para mi negocio")}`}
                target="_blank"
                className="block text-center py-2.5 rounded-lg font-bold text-sm bg-stone-900 text-white hover:bg-stone-700 transition-colors"
              >
                Empezar — $89/mes
              </Link>
            </CardContent>
          </Card>

          {/* 90 days - Recommended */}
          <Card className="relative bg-po-surface border-red-600 ring-1 ring-red-600">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge className="bg-red-600 text-white font-bold">
                Recomendado
              </Badge>
            </div>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-stone-900">90 Días</h3>
              <div>
                <span className="text-3xl font-black text-stone-900">$229</span>
                <span className="text-stone-500">/90 días</span>
              </div>
              <p className="text-xs text-green-600 font-medium">
                Ahorras $38 vs mensual — cabe en ATH Móvil
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Todo del plan mensual
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Reporte mensual de demanda
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Apareces en 6 sitios web
                </li>
              </ul>
              <Link
                href={`${CONTACT_WHATSAPP}?text=${encodeURIComponent("Quiero La Vitrina 90 días ($229) para mi negocio")}`}
                target="_blank"
                className="block text-center py-2.5 rounded-lg font-bold text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Elegir 90 Días — $229
              </Link>
            </CardContent>
          </Card>

          {/* Annual */}
          <Card className="bg-po-surface border-po-border">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-lg font-bold text-stone-900">Anual</h3>
              <div>
                <span className="text-3xl font-black text-stone-900">$799</span>
                <span className="text-stone-500">/año</span>
              </div>
              <p className="text-xs text-green-600 font-medium">
                $2.19/día — ahorra $269 vs mensual
              </p>
              <ul className="space-y-2 text-sm text-stone-600">
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Todo del plan 90 días
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Exclusividad de categoría
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Dashboard privado de demanda
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600">✓</span>Soporte directo con Angel
                </li>
              </ul>
              <Link
                href={`${CONTACT_WHATSAPP}?text=${encodeURIComponent("Quiero La Vitrina anual ($799) para mi negocio")}`}
                target="_blank"
                className="block text-center py-2.5 rounded-lg font-bold text-sm bg-stone-900 text-white hover:bg-stone-700 transition-colors"
              >
                Mejor Precio — $799/año
              </Link>
            </CardContent>
          </Card>
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
            a="No. Solo necesitas un teléfono. El bot envía tu número directamente al cliente."
          />
          <Faq
            q="¿Me garantizan ventas?"
            a="No — nadie puede. Lo que sí garantizamos: visibilidad constante ante personas que están buscando EXACTAMENTE lo que tú ofreces. Te damos un reporte mensual con datos reales: cuántas veces te recomendaron, cuántas personas te buscaron."
          />
          <Faq
            q="¿Puedo cancelar?"
            a="Sí. Sin penalidad, sin preguntas. Pero nadie ha cancelado todavía."
          />
          <Faq
            q="¿Cómo sé que funciona?"
            a="Reporte mensual con datos reales: búsquedas en tu categoría, recomendaciones de tu negocio, leads enviados. No estimados — datos del bot."
          />
          <Faq
            q="¿Cuánto tiempo toma activarse?"
            a="24 horas. Pagas hoy, mañana ya estás apareciendo en las recomendaciones."
          />
          <Faq
            q="¿Qué es exclusividad de categoría?"
            a="Solo con el plan anual. Si eres electricista y pagas $799/año, ningún otro electricista puede entrar en La Vitrina en tu zona durante tu contrato. Tú eres EL recomendado."
          />
        </div>
      </section>

      {/* Final CTA */}
      <section className="text-center space-y-6 py-8">
        <h2 className="text-3xl font-display font-black text-stone-900">
          Tu competencia ya aparece.
          <br />
          <span className="text-red-600">¿Y tú?</span>
        </h2>
        <p className="text-stone-500 max-w-xl mx-auto">
          Cada búsqueda que el bot responde sin tu negocio es un cliente que se
          fue a otro lugar. No necesitas página web. No necesitas redes sociales.
          Solo necesitas estar en *{BOT_PHONE}.
        </p>
        <Link
          href={`${CONTACT_WHATSAPP}?text=${encodeURIComponent("Quiero La Vitrina para mi negocio en *7711")}`}
          target="_blank"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors"
        >
          Escríbenos por WhatsApp — Te activamos en 24h
        </Link>
        <p className="text-stone-400 text-sm">
          O llama al *{BOT_PHONE} · ventas@caborojo.com
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
