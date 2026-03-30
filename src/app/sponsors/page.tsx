import { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { BOT_PHONE, CONTACT_WHATSAPP } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Nuestros Sponsors — Anunciantes Fundadores",
  description:
    "Los 25 negocios que confiaron en Pal Oeste desde la primera edición. Anunciantes fundadores de la Revista 2025.",
};

const FOUNDERS = [
  { name: "Marina Puerto Real", location: "Cabo Rojo", phone: "787-827-6300", type: "Marina · Náutica", presenting: true },
  { name: "Antares Caribbean Cuisine", location: "Marina Puerto Real, Cabo Rojo", phone: "", type: "Restaurante" },
  { name: "Concierge 308", location: "Cabo Rojo", phone: "787-513-2783", type: "Bienes Raíces" },
  { name: "Scout Boats", location: "PR-100, Boquerón", phone: "787-725-5946", type: "Botes" },
  { name: "La Cajita Bento", location: "Lighthouse Plaza, Cabo Rojo", phone: "939-400-0026", type: "Restaurante" },
  { name: "Puesta de Sol Restaurant", location: "Joyuda, Cabo Rojo", phone: "787-254-5756", type: "Restaurante" },
  { name: "O Positivo Café", location: "San Sebastián", phone: "787-589-7370", type: "Café" },
  { name: "Todo Por Un Café", location: "Quebradillas", phone: "787-895-7921", type: "Café" },
  { name: "D'Fantasy Salon", location: "Cabo Rojo", phone: "787-851-6503", type: "Salón de Belleza" },
  { name: "REGSS – Reel E Good Sea Service", location: "Marina Puerto Real", phone: "787-244-3355", type: "Servicios Marinos" },
  { name: "Farmacia Encarnación", location: "Cabo Rojo", phone: "787-851-1250", type: "Farmacia" },
  { name: "Performance Auto Parts", location: "Carr 308, Cabo Rojo", phone: "787-851-4770", type: "Auto Partes" },
  { name: "RG Generator Service", location: "Cabo Rojo", phone: "787-310-1730", type: "Generadores" },
  { name: "Finca Monte de Sol", location: "San Sebastián", phone: "939-248-6337", type: "Agroturismo" },
  { name: "Hotel Perichi's", location: "Joyuda, Cabo Rojo", phone: "787-313-0038", type: "Hotel" },
];

const BENEFITS = [
  { icon: "🌐", title: "Listing destacado en paloeste.com", desc: "Tu negocio con foto, contacto, y badge exclusivo" },
  { icon: "🤖", title: "Recomendado por El Veci *7711", desc: "El Vecino Digital te menciona cuando la gente busca" },
  { icon: "📱", title: "Mención en Facebook", desc: "Posts de Orgullo Local en CaboRojo.com (15K+ seguidores)" },
  { icon: "📧", title: "Inclusión en Newsletter", desc: "2,400+ suscriptores reciben tu nombre cada semana" },
  { icon: "📊", title: "Dashboard de Analytics", desc: "Vistas, clicks, búsquedas — datos reales de tu negocio" },
  { icon: "📕", title: "Presencia en la Revista", desc: "Edición impresa y digital distribuida en el oeste" },
];

export default function SponsorsPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
      {/* Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-sm px-4 py-1">
          🏅 Edición Fundadores — Solo 25 negocios
        </Badge>
        <h1 className="text-4xl font-display font-black text-stone-900">
          Los negocios que creyeron primero
        </h1>
        <p className="text-lg text-stone-500">
          Estos 15 negocios confiaron en Pal&apos; Oeste desde la primera edición
          de la revista. Su badge de Anunciante Fundador es exclusivo y permanente — nunca
          se otorga a nuevos sponsors.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
        {[
          { num: "15", label: "Fundadores" },
          { num: "162+", label: "Negocios en directorio" },
          { num: "15K+", label: "Seguidores FB" },
          { num: "2,400+", label: "Suscriptores newsletter" },
        ].map((s) => (
          <div key={s.label} className="text-center p-4 bg-po-surface rounded-xl border border-po-border">
            <div className="text-2xl font-black text-red-600">{s.num}</div>
            <div className="text-xs text-stone-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Founders Grid */}
      <section className="space-y-4">
        <h2 className="text-2xl font-display font-bold text-stone-900">🏅 Anunciantes Fundadores</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FOUNDERS.map((f) => (
            <div key={f.name} className="p-5 rounded-xl bg-[#FAFAF7] border border-po-border shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-100 text-amber-700 border-amber-300 text-[10px]">
                  🏅 Fundador
                </Badge>
                {f.presenting && (
                  <Badge className="bg-red-600 text-white text-[10px]">
                    🏆 Presenting Sponsor
                  </Badge>
                )}
              </div>
              <h3 className="text-lg font-bold text-stone-900">{f.name}</h3>
              <p className="text-sm text-stone-500">{f.type}</p>
              <p className="text-xs text-stone-400">📍 {f.location}</p>
              {f.phone && (
                <a href={`tel:${f.phone}`} className="text-sm text-red-600 font-medium block">
                  📞 {f.phone}
                </a>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <h2 className="text-2xl font-display font-bold text-stone-900 text-center">
          Lo que reciben nuestros sponsors
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-3 p-4 bg-[#FAFAF7] border border-po-border rounded-xl shadow-sm">
              <span className="text-2xl shrink-0">{b.icon}</span>
              <div>
                <h3 className="font-bold text-stone-900 text-sm">{b.title}</h3>
                <p className="text-xs text-stone-500 mt-0.5">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-8 md:p-12 text-center space-y-4 max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-red-700">
          ¿Quieres ser el próximo?
        </h2>
        <p className="text-stone-600">
          Los badges de Fundador están cerrados, pero los paquetes Sponsor están abiertos.
          Directorio + El Veci *{BOT_PHONE} + Facebook + newsletter. Desde $299/año.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/anuncia"
            className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-full transition-colors"
          >
            Ver Paquetes →
          </Link>
          <Link
            href={CONTACT_WHATSAPP}
            target="_blank"
            className="bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-full transition-colors"
          >
            WhatsApp Directo
          </Link>
        </div>
      </div>
    </div>
  );
}
