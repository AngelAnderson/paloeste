import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { BOT_PHONE, CONTACT_WHATSAPP, CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Anuncia tu Negocio",
  description:
    "Aparece en el directorio, el bot *7711, Facebook y el newsletter. Paquetes desde $299/año.",
};

const tiers = [
  {
    name: "Gratis",
    price: "$0",
    period: "",
    features: [
      "Listing básico en directorio",
      "Nombre, teléfono, dirección",
      "Visible en búsquedas",
    ],
    cta: "Ya estás incluido",
    ctaStyle: "bg-zinc-200 text-zinc-500 cursor-default",
  },
  {
    name: "Básico",
    price: "$299",
    period: "/año",
    features: [
      "Listing mejorado con foto",
      "Tracking de clicks y vistas",
      "Aparece en el bot *7711",
      "Badge de verificado",
    ],
    cta: "Empezar",
    ctaStyle: "bg-zinc-900 text-white hover:bg-zinc-700",
  },
  {
    name: "Pro",
    price: "$699",
    period: "/año",
    popular: true,
    features: [
      "Todo lo de Básico",
      "Featured en búsquedas AI",
      "Dashboard de analytics",
      "Mención semanal en Facebook",
      "Inclusión en newsletter",
      "Recomendado por bot *7711",
    ],
    cta: "Elegir Pro",
    ctaStyle: "bg-red-600 text-white hover:bg-red-700",
  },
  {
    name: "Enterprise",
    price: "$1,200",
    period: "/año",
    features: [
      "Todo lo de Pro",
      "Artículo dedicado en Historias",
      "Top placement permanente",
      "Menciones en redes sociales",
      "Display ads en el site",
      "Reporte mensual PDF",
    ],
    cta: "Contactar",
    ctaStyle: "bg-zinc-900 text-white hover:bg-zinc-700",
  },
];

export default function AnunciaPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <Badge className="bg-red-100 text-red-600 border-red-200">
          Para Negocios del Oeste
        </Badge>
        <h1 className="text-4xl font-black text-zinc-900">
          Haz que tu negocio sea{" "}
          <span className="text-red-600">imposible de ignorar</span>
        </h1>
        <p className="text-lg text-zinc-500">
          Directorio web + bot WhatsApp *{BOT_PHONE} + Facebook + newsletter.
          Todo conectado. Un precio.
        </p>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {tiers.map((tier) => (
          <Card
            key={tier.name}
            className={`relative bg-zinc-50 border border-zinc-200 ${
              tier.popular ? "border-red-600 ring-1 ring-red-600" : ""
            }`}
          >
            {tier.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-red-600 text-white font-bold">
                  Más Popular
                </Badge>
              </div>
            )}
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-zinc-900">{tier.name}</h3>
              <div>
                <span className="text-3xl font-black text-zinc-900">
                  {tier.price}
                </span>
                <span className="text-zinc-500">{tier.period}</span>
              </div>
              <ul className="space-y-2">
                {tier.features.map((f) => (
                  <li
                    key={f}
                    className="text-sm text-zinc-600 flex items-start gap-2"
                  >
                    <span className="text-green-600 mt-0.5">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href={CONTACT_WHATSAPP}
                target="_blank"
                className={`block text-center py-2.5 rounded-lg font-bold text-sm transition-colors ${tier.ctaStyle}`}
              >
                {tier.cta}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Social Proof */}
      <div className="text-center space-y-4 py-8">
        <h2 className="text-2xl font-bold text-zinc-700">
          25+ negocios ya confían en Pal Oeste
        </h2>
        <p className="text-zinc-500 max-w-lg mx-auto">
          Marina Puerto Real · La Cajita Bento · Hotel Perichi&apos;s · Finca Monte
          de Sol · O Positivo Café · y más...
        </p>
      </div>

      {/* Contact */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-8 text-center space-y-4 max-w-xl mx-auto">
        <h3 className="text-xl font-bold text-zinc-900">¿Preguntas? Hablemos.</h3>
        <div className="space-y-2 text-zinc-600">
          <p>
            📱{" "}
            <Link
              href={CONTACT_WHATSAPP}
              target="_blank"
              className="text-red-600 hover:text-red-700"
            >
              WhatsApp Directo
            </Link>
          </p>
          <p>
            📧{" "}
            <Link
              href={`mailto:${CONTACT_EMAIL}`}
              className="text-red-600 hover:text-red-700"
            >
              {CONTACT_EMAIL}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
