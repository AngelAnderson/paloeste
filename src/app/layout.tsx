import type { Metadata } from "next";
import { DM_Sans, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { BOT_PHONE, CONTACT_WHATSAPP, SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

const cabinetGrotesk = localFont({
  src: "../fonts/CabinetGrotesk-Variable.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "100 900",
});

const dmSans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE_NAME} — Lo Mejor del Oeste de Puerto Rico`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    type: "website",
    locale: "es_PR",
    siteName: SITE_NAME,
    images: [{ url: "/og-image.svg", width: 1200, height: 630, alt: "Pal' Oeste — El directorio del oeste de Puerto Rico" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pal' Oeste — Lo Mejor del Oeste de Puerto Rico",
    description: "Tu guía real del oeste de Puerto Rico. Negocios, cultura, música y turismo.",
    images: ["/og-image.svg"],
  },
};

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-po-border bg-[#FAFAF7]/90 backdrop-blur-lg">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-dark-text.png" alt="Pal Oeste" width={120} height={40} className="h-9 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-stone-500">
          <Link href="/directorio" className="hover:text-stone-900 transition-colors">
            Directorio
          </Link>
          <Link href="/donde-comer" className="hover:text-stone-900 transition-colors">
            Dónde Comer
          </Link>
          <Link href="/musicos" className="hover:text-stone-900 transition-colors">
            Músicos
          </Link>
          <Link href="/eventos" className="hover:text-stone-900 transition-colors">
            Eventos
          </Link>
          <Link href="/sponsors" className="hover:text-stone-900 transition-colors">
            Sponsors
          </Link>
          <Link href="/revista" className="hover:text-stone-900 transition-colors">
            Tienda
          </Link>
          <Link
            href="/anuncia"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded-full font-bold transition-colors"
          >
            Anuncia
          </Link>
        </div>
        <Link
          href={CONTACT_WHATSAPP}
          className="md:hidden text-sm text-red-600 font-medium"
          target="_blank"
        >
          WhatsApp
        </Link>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-po-border bg-[#F2F0EB] mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Image src="/logo-dark-text.png" alt="Pal Oeste" width={100} height={33} className="h-8 w-auto mb-3" />
          <p className="text-sm text-stone-500">
            Tu guía real del oeste de Puerto Rico. Negocios, cultura, música y turismo.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-stone-900 mb-3">Explora</h4>
          <div className="space-y-2 text-sm text-stone-500">
            <Link href="/directorio" className="block hover:text-stone-900">Directorio</Link>
            <Link href="/donde-comer" className="block hover:text-stone-900">Dónde Comer</Link>
            <Link href="/musicos" className="block hover:text-stone-900">Músicos</Link>
            <Link href="/eventos" className="block hover:text-stone-900">Eventos</Link>
            <Link href="/revista" className="block hover:text-stone-900">Tienda</Link>
            <Link href="/anuncia" className="block hover:text-stone-900">Anuncia tu Negocio</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-stone-900 mb-3">Búscanos</h4>
          <div className="space-y-2 text-sm text-stone-500">
            <p>📱 El Veci: <span className="text-red-600 font-medium">*{BOT_PHONE}</span></p>
            <p>📧 angel@angelanderson.com</p>
            <Link href={CONTACT_WHATSAPP} target="_blank" className="block text-red-600 hover:text-red-700">
              WhatsApp Directo →
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-po-border px-4 py-4 text-center text-xs text-stone-400">
        © {new Date().getFullYear()} Pal&apos; Oeste · CaboRojo.com · Angel Anderson
      </div>
    </footer>
  );
}


function JsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://paloeste.com/#website",
        url: "https://paloeste.com",
        name: "Pal Oeste",
        description: "Tu guia real del oeste de Puerto Rico. Negocios, cultura, musica y turismo.",
        inLanguage: "es-PR",
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: "https://paloeste.com/directorio?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://paloeste.com/#organization",
        name: "PalOeste / CaboRojo.com",
        url: "https://paloeste.com",
        logo: {
          "@type": "ImageObject",
          url: "https://paloeste.com/logo-dark-text.png",
        },
        sameAs: ["https://caborojo.com"],
        contactPoint: {
          "@type": "ContactPoint",
          telephone: "+1-787-417-7711",
          contactType: "customer service",
          availableLanguage: ["Spanish"],
        },
        areaServed: {
          "@type": "Place",
          name: "Cabo Rojo, Puerto Rico",
        },
      },
    ],
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeJson = JSON.stringify(schema);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJson }} />;
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { headers } = await import("next/headers");
  const headersList = await headers();
  const isAdmin = headersList.get("x-is-admin") === "1";

  return (
    <html
      lang="es"
      className={`${cabinetGrotesk.variable} ${dmSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <JsonLd />
      <body className={isAdmin ? "min-h-full" : "min-h-full flex flex-col bg-[#FAFAF7] text-stone-900"}>
        {!isAdmin && <Header />}
        {isAdmin ? children : <main className="flex-1">{children}</main>}
        {!isAdmin && <Footer />}
      </body>
    </html>
  );
}
