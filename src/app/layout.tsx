import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
    <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-lg">
      <nav className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-xl font-black text-orange-500 tracking-tight">
          Pal Oeste
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
          <Link href="/directorio" className="hover:text-zinc-100 transition-colors">
            Directorio
          </Link>
          <Link href="/historias" className="hover:text-zinc-100 transition-colors">
            Historias
          </Link>
          <Link href="/musicos" className="hover:text-zinc-100 transition-colors">
            Músicos
          </Link>
          <Link href="/revista" className="hover:text-zinc-100 transition-colors">
            Revista
          </Link>
          <Link
            href="/anuncia"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1.5 rounded-full font-medium transition-colors"
          >
            Anuncia
          </Link>
        </div>
        <Link
          href={CONTACT_WHATSAPP}
          className="md:hidden text-sm text-orange-400 font-medium"
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
    <footer className="border-t border-zinc-800 bg-zinc-950 mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 className="text-lg font-black text-orange-500 mb-2">Pal Oeste</h3>
          <p className="text-sm text-zinc-500">
            Tu guía real del oeste de Puerto Rico. Negocios, cultura, música y turismo.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-300 mb-3">Explora</h4>
          <div className="space-y-2 text-sm text-zinc-500">
            <Link href="/directorio" className="block hover:text-zinc-300">Directorio</Link>
            <Link href="/historias" className="block hover:text-zinc-300">Historias</Link>
            <Link href="/musicos" className="block hover:text-zinc-300">Músicos</Link>
            <Link href="/revista" className="block hover:text-zinc-300">Revista</Link>
            <Link href="/anuncia" className="block hover:text-zinc-300">Anuncia tu Negocio</Link>
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-zinc-300 mb-3">Búscanos</h4>
          <div className="space-y-2 text-sm text-zinc-500">
            <p>📱 Bot WhatsApp: <span className="text-orange-400 font-medium">*{BOT_PHONE}</span></p>
            <p>📧 angel@angelanderson.com</p>
            <Link href={CONTACT_WHATSAPP} target="_blank" className="block text-orange-400 hover:text-orange-300">
              WhatsApp Directo →
            </Link>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 px-4 py-4 text-center text-xs text-zinc-600">
        © {new Date().getFullYear()} Pal Oeste · CaboRojo.com · Angel Anderson
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-zinc-100">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
