import { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Tienda — Revistas del Oeste",
  description: "Revistas digitales y físicas del oeste de Puerto Rico. Descubre Cabo Rojo y Pal Oeste.",
};

const products = [
  {
    name: "Revista Pal' Oeste 2025",
    description: "58 páginas dedicadas a lo mejor del oeste de Puerto Rico. Perfiles de 25 negocios locales, artistas, músicos, y destinos turísticos.",
    pricePdf: "$9.99",
    pricePhysical: "En Amazon",
    badge: "🆕 Nueva Edición",
    badgeColor: "bg-red-600 text-white",
    features: ["15 negocios destacados", "10 músicos y grupos", "Perfiles culturales", "Guía de destinos turísticos"],
    stripePdfUrl: "#", // Angel: agregar Stripe payment link
    amazonUrl: "#", // Angel: agregar Amazon KDP link
  },
  {
    name: "Descubre Cabo Rojo",
    description: "La guía completa del municipio de Cabo Rojo. Playas, restaurantes, historia, y todo lo que necesitas saber.",
    pricePdf: "$5.00",
    pricePhysical: null,
    badge: "Edición Digital",
    badgeColor: "bg-blue-600 text-white",
    features: ["Guía completa de Cabo Rojo", "Playas y restaurantes", "Historia y cultura", "Mapa de referencia"],
    stripePdfUrl: "#", // Angel: agregar Stripe payment link
    amazonUrl: null,
  },
  {
    name: "Bundle: Pal' Oeste + Descubre Cabo Rojo",
    description: "Las dos guías esenciales del oeste en un solo paquete. Ahorra $2 comprando el bundle.",
    pricePdf: "$12.99",
    pricePhysical: null,
    badge: "💰 Ahorra $2",
    badgeColor: "bg-green-600 text-white",
    features: ["Revista Pal' Oeste 2025 (58 págs)", "Descubre Cabo Rojo", "Descarga inmediata", "2 PDFs por el precio de 1.5"],
    stripePdfUrl: "#", // Angel: agregar Stripe payment link
    amazonUrl: null,
  },
];

export default function RevistaPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <h1 className="text-4xl font-black">📕 Tienda Pal&apos; Oeste</h1>
        <p className="text-lg text-blue-200/60">
          Guías del oeste de Puerto Rico. PDF digital con descarga inmediata o versión física en Amazon.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.name} className="bg-blue-950/50 border-blue-800/30 flex flex-col">
            <CardContent className="p-6 space-y-4 flex-1 flex flex-col">
              <Badge className={`${product.badgeColor} w-fit`}>
                {product.badge}
              </Badge>
              <h2 className="text-xl font-bold text-white">{product.name}</h2>
              <p className="text-sm text-blue-200/60 flex-1">{product.description}</p>

              <ul className="space-y-1.5">
                {product.features.map((f) => (
                  <li key={f} className="text-sm text-blue-300/60 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span> {f}
                  </li>
                ))}
              </ul>

              <div className="space-y-2 pt-2">
                <Link
                  href={product.stripePdfUrl}
                  className="block text-center bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors"
                >
                  Compra Digital — {product.pricePdf}
                </Link>
                {product.amazonUrl && (
                  <Link
                    href={product.amazonUrl}
                    target="_blank"
                    className="block text-center bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-lg transition-colors text-sm"
                  >
                    📦 Compra en Amazon — Versión Física
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-blue-300/40 max-w-lg mx-auto">
        <p>Los PDFs se entregan inmediatamente después de la compra. La versión física se envía a través de Amazon.</p>
      </div>
    </div>
  );
}
