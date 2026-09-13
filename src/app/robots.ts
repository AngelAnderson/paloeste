import { MetadataRoute } from 'next'

// Crawlers de SEO de terceros que no le traen un solo visitante al sitio pero barren
// las 8,292 paginas de /negocio/ como si fuera gratis. AhrefsBot disparo 3 alertas de
// spike en Vercel entre el 11 y el 13 de septiembre 2026 (hasta 6.5x la linea base de
// invocaciones). Google y Bing NO estan en esta lista: el trafico real se queda.
// Esto es la capa educada; los que no obedecen robots.txt caen en la regla de firewall
// "Bloquear crawlers SEO de terceros" (Vercel, proyecto paloeste).
const CRAWLERS_BLOQUEADOS = [
  'AhrefsBot',
  'SemrushBot',
  'DataForSeoBot',
  'MJ12bot',
  'DotBot',
  'PetalBot',
  'Barkrowler',
  'BLEXBot',
  'SeekportBot',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
      },
      ...CRAWLERS_BLOQUEADOS.map((userAgent) => ({
        userAgent,
        disallow: '/',
      })),
    ],
    sitemap: 'https://www.paloeste.com/sitemap.xml',
  }
}
