import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import { BOT_PHONE, CONTACT_WHATSAPP, SITE_NAME, SITE_DESCRIPTION, SITE_URL } from "@/lib/constants";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
  },
};

function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/90 backdrop-blur-lg">
      <nav className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo-black.png" alt="Pal Oeste" width={120} height={40} className="h-9 w-auto" />
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-500">
          <Link href="/directorio" className="hover:text-zinc-900 transition-colors">
            Directorio
          </Link>
          <Link href="/donde-comer" className="hover:text-zinc-900 transition-colors">
            Dónde Comer
          </Link>
          <Link href="/musicos" className="hover:text-zinc-900 transition-colors">
            Músicos
          </Link>
          <Link href="/eventos" className="hover:text-zinc-900 transition-colors">
            Eventos
          </Link>
          <Link href="/revista" className="hover:text-zinc-900 transition-colors">
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
    <footer className="border-t border-zinc-200 bg-zinc-50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <Image src="/logo-black.png" alt="Pal Oeste" width={100} height={33} className="h-8 w-auto mb-3" />
          <p className="text-sm text-zinc-500">
            Tu guía real del oeste de Puerto Rico. Negocios, cultura, música y turismo.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-900 mb-3">Explora</h4>
          <div className="space-y-2 text-sm text-zinc-500">
            <Link href="/directorio" className="block hover:text-zinc-900">Directorio</Link>
            <Link href="/donde-comer" className="block hover:text-zinc-900">Dónde Comer</Link>
            <Link href="/musicos" className="block hover:text-zinc-900">Músicos</Link>
            <Link href="/eventos" className="block hover:text-zinc-900">Eventos</Link>
            <Link href="/revista" className="block hover:text-zinc-900">Tienda</Link>
            <Link href="/anuncia" className="block hover:text-zinc-900">Anuncia tu Negocio</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-900 mb-3">Búscanos</h4>
          <div className="space-y-2 text-sm text-zinc-500">
            <p>📱 Bot WhatsApp: <span className="text-red-600 font-medium">*{BOT_PHONE}</span></p>
            <p>📧 angel@angelanderson.com</p>
            <Link href={CONTACT_WHATSAPP} target="_blank" className="block text-red-600 hover:text-red-700">
              WhatsApp Directo →
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-400">
        © {new Date().getFullYear()} Pal&apos; Oeste · CaboRojo.com · Angel Anderson
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-zinc-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
