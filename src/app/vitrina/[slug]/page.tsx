import { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { getPlaceBySlug } from "@/lib/supabase"
import { createSupabaseAdminClient } from "@/lib/supabase-server"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { BOT_PHONE, CONTACT_WHATSAPP, CATEGORIES, SITE_URL } from "@/lib/constants"

export const revalidate = 3600

const VITRINA_PRICE = 799
const LEAD_VALUE = 2.15

const CAT_LABEL: Record<string, string> = {}
CATEGORIES.forEach((c) => { CAT_LABEL[c.id] = c.label_es })

// Sub-category fuzzy matching — agrupa subs sucias del DB en familias coherentes
// para que el ranking sea honesto ("#1 entre 3 técnicos de aire" vs "#1 entre 581 servicios").
function getSubcategoryFamily(sub: string | null | undefined): { label: string; patterns: string[] } | null {
  if (!sub) return null
  const lower = sub.toLowerCase()
  if (/refrig|aire|hvac|\bac\b/.test(lower)) {
    return { label: "Refrigeración y AC", patterns: ["%refrig%", "%aire%", "%hvac%"] }
  }
  if (/plomer|fontaner/.test(lower)) {
    return { label: "Plomería", patterns: ["%plom%", "%fontan%"] }
  }
  if (/electric/.test(lower)) {
    return { label: "Electricidad", patterns: ["%electric%"] }
  }
  if (/carpinter|madera/.test(lower)) {
    return { label: "Carpintería", patterns: ["%carpinter%", "%madera%"] }
  }
  if (/solar/.test(lower)) {
    return { label: "Energía Solar", patterns: ["%solar%"] }
  }
  if (/abogad|lawyer|notari/.test(lower)) {
    return { label: "Servicios Legales", patterns: ["%abogad%", "%lawyer%", "%notari%"] }
  }
  if (/mechanic|mecanic|taller|gomer/.test(lower)) {
    return { label: "Mecánica y Auto", patterns: ["%mechanic%", "%mecanic%", "%taller%", "%gomer%"] }
  }
  if (/landscap|jardin/.test(lower)) {
    return { label: "Jardinería", patterns: ["%landscap%", "%jardin%"] }
  }
  if (/lavander|laund|tintor|dry-clean/.test(lower)) {
    return { label: "Lavandería", patterns: ["%lavander%", "%laund%", "%tintor%", "%dry-clean%"] }
  }
  // default: exact match
  return { label: sub, patterns: [`%${sub}%`] }
}

interface DemandGapBucket {
  category: string
  unmet_count: number
  top_queries: { query: string; count: number }[]
}

// Filtros de "ruido" — palabras pegadas que no son intent real
const NOISE_WORDS = /^(gracias|si|sí|ok|hola|bien|perfecto|nice|todo|todos|tengo|unico|claro|listo|que|qué|tropa|pulso|el coral|carreteras|leones|directorio|libro|vitrina|tv fascias)$/i

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const place = await getPlaceBySlug(slug)
  if (!place) return { title: "No encontrado" }
  const catLabel = CAT_LABEL[place.category] || place.category
  return {
    title: `${place.name} — La Vitrina | Pal Oeste`,
    description: `Datos reales de demanda para ${place.name} en Cabo Rojo. ${catLabel}.`,
    openGraph: {
      title: `${place.name} — Demanda en Cabo Rojo`,
      type: "website",
      url: `${SITE_URL}/vitrina/${slug}`,
    },
  }
}

interface CategoryReport {
  category: string
  total_queries: number
  unique_users: number
  top_queries: { query: string; count: number }[] | null
}

export default async function VitrinaPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string }>
}) {
  const { slug } = await params
  const sp = await searchParams
  const from = sp?.from

  const place = await getPlaceBySlug(slug)
  if (!place) notFound()

  const category = place.category
  const catLabel = CAT_LABEL[category] || category
  const isSponsor = place.is_featured

  // Sub-category family resolution (Luis David "Refrigeración y AC" → group HVAC)
  const subFamily = getSubcategoryFamily(place.subcategory)
  const subOrFilter = subFamily ? subFamily.patterns.map(p => `subcategory.ilike.${p}`).join(',') : null

  // Fetch demand data using admin client
  let totalSearches = 0
  let uniqueUsers = 0
  let competitors = 0
  let sponsorsInCategory = 0
  let subCompetitors = 0
  let subSponsors = 0
  let topQueries: { query: string; count: number }[] = []
  let missedQueries: { query: string; count: number }[] = []

  try {
    const supabase = await createSupabaseAdminClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promises: any[] = [
      supabase.rpc('get_category_report', { p_category: category }),
      supabase.from('places').select('id', { count: 'exact', head: true }).eq('category', category).eq('visibility', 'published'),
      supabase.from('places').select('id', { count: 'exact', head: true }).eq('category', category).eq('is_featured', true).eq('visibility', 'published'),
      supabase.rpc('demand_gaps', { days_back: 30 }),
    ]

    if (subOrFilter) {
      promises.push(
        supabase.from('places').select('id', { count: 'exact', head: true }).eq('category', category).eq('visibility', 'published').or(subOrFilter)
      )
      promises.push(
        supabase.from('places').select('id', { count: 'exact', head: true }).eq('category', category).eq('is_featured', true).eq('visibility', 'published').or(subOrFilter)
      )
    }

    const results = await Promise.all(promises) as Array<{ data?: unknown; count?: number | null }>
    const [catReportRes, competitorsRes, sponsorsRes, demandGapsRes, subCompRes, subSponRes] = results

    const catReport = (catReportRes as { data: CategoryReport | null }).data
    totalSearches = catReport?.total_queries ?? 0
    uniqueUsers = catReport?.unique_users ?? 0
    topQueries = catReport?.top_queries?.slice(0, 8) ?? []
    competitors = (competitorsRes as { count: number | null }).count ?? 0
    sponsorsInCategory = (sponsorsRes as { count: number | null }).count ?? 0
    subCompetitors = subCompRes ? ((subCompRes as { count: number | null }).count ?? 0) : 0
    subSponsors = subSponRes ? ((subSponRes as { count: number | null }).count ?? 0) : 0

    // Extract missed queries for this place's subcategory family
    const gaps = (demandGapsRes as { data: DemandGapBucket[] | null }).data
    if (gaps && Array.isArray(gaps) && subFamily) {
      const subLower = subFamily.label.toLowerCase()
      // Find gap buckets whose category matches the subcategory family
      const matchingBuckets = gaps.filter(b => {
        const cat = (b.category || '').toLowerCase()
        return subFamily.patterns.some(p => {
          const word = p.replace(/%/g, '')
          return cat.includes(word)
        })
      })
      // Aggregate top_queries across matching buckets, filter noise
      const aggregated = new Map<string, number>()
      for (const bucket of matchingBuckets) {
        for (const q of bucket.top_queries || []) {
          const trimmed = (q.query || '').trim()
          if (!trimmed || trimmed.length > 80 || NOISE_WORDS.test(trimmed)) continue
          aggregated.set(trimmed, (aggregated.get(trimmed) ?? 0) + (q.count || 0))
        }
      }
      missedQueries = Array.from(aggregated.entries())
        .map(([query, count]) => ({ query, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    }
  } catch (err) {
    console.error('Vitrina demand fetch error:', err)
  }

  // Calculate position — use subcategory family if available (más honesto)
  let position = 1
  const positionDenominator = subCompetitors > 0 ? subCompetitors : competitors
  const positionLabel = subFamily ? subFamily.label : catLabel
  if (!isSponsor) {
    try {
      const supabase = await createSupabaseAdminClient()
      const q = supabase
        .from('places')
        .select('id', { count: 'exact', head: true })
        .eq('category', category)
        .eq('visibility', 'published')
        .neq('id', place.id)
        .or(`is_featured.eq.true,google_rating.gt.${place.google_rating ?? 0}`)
      if (subOrFilter) q.or(subOrFilter)
      const { count } = await q
      position = (count ?? 0) + 1
    } catch {
      position = positionDenominator
    }
  }

  const demandValue = Math.round(totalSearches * LEAD_VALUE)
  const dailyCost = (VITRINA_PRICE / 365).toFixed(2)
  const waMessage = encodeURIComponent(
    `Hola Angel, vi mis datos en paloeste.com/vitrina/${slug} y quiero La Vitrina para ${place.name}`
  )

  return (
    <div className="min-h-screen bg-white">
      {from === "angel" && (
        <div className="bg-stone-900 text-white text-center py-3 px-4 text-sm font-medium">
          Angel te envi&oacute; esta p&aacute;gina
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">

        {/* SECTION A: THE HOOK */}
        <section className="text-center space-y-4">
          <div className="flex flex-wrap justify-center gap-2">
            <Badge className="bg-red-100 text-red-600 border-red-200">
              {catLabel}
            </Badge>
            {subFamily && (
              <Badge className="bg-stone-100 text-stone-700 border-stone-200">
                {subFamily.label}
              </Badge>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-black text-stone-900">
            {place.name}
          </h1>
          {place.google_rating && (
            <p className="text-stone-400 text-sm">
              {"★"} {place.google_rating} en Google
              {place.address ? ` — ${place.address}` : ""}
            </p>
          )}

          {/* Trust signals strip */}
          {(place.is_verified || place.verified_at) && (
            <div className="flex flex-wrap justify-center gap-3 text-xs text-stone-500 pt-2">
              {place.is_verified && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-green-600">{"✓"}</span>
                  Verificado por Angel
                </span>
              )}
              {place.verified_at && (
                <span className="inline-flex items-center gap-1">
                  <span className="text-green-600">{"✓"}</span>
                  Listing al d{"í"}a desde {new Date(place.verified_at).toLocaleDateString("es-PR", { month: "long", year: "numeric" })}
                </span>
              )}
            </div>
          )}

          <div className="space-y-6">
            <div className="text-center">
              <p className="text-7xl md:text-8xl font-black text-red-600 tabular-nums leading-none">
                {totalSearches.toLocaleString()}
              </p>
              <p className="text-lg text-stone-500 mt-2">
                personas buscaron tu categor{"í"}a este mes
              </p>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-po-surface border border-po-border rounded-xl p-4">
                <p className="text-2xl font-black text-stone-900">{uniqueUsers}</p>
                <p className="text-stone-500 text-xs">usuarios {"ú"}nicos</p>
              </div>
              <div className="bg-po-surface border border-po-border rounded-xl p-4">
                <p className="text-2xl font-black text-stone-900">#{position}</p>
                <p className="text-stone-500 text-xs">tu posici{"ó"}n</p>
              </div>
              <div className="bg-po-surface border border-po-border rounded-xl p-4">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-2xl font-black text-stone-900">LIVE</p>
                </div>
                <p className="text-stone-500 text-xs">datos en tiempo real</p>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION B: FOMO BLOCK */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold text-stone-900">
            Tu {subFamily ? "sub-categor" : "categor"}{"í"}a: {subFamily ? subFamily.label : catLabel}
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-po-surface border border-po-border rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-stone-900">{positionDenominator}</p>
              <p className="text-stone-500 text-xs">negocios en {positionLabel}</p>
            </div>
            <div className="bg-po-surface border border-po-border rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-red-600">{subFamily ? subSponsors : sponsorsInCategory}</p>
              <p className="text-stone-500 text-xs">sponsors activos</p>
            </div>
            <div className="bg-po-surface border border-po-border rounded-xl p-4 text-center">
              <p className="text-2xl font-black text-stone-900">{positionDenominator - (subFamily ? subSponsors : sponsorsInCategory)}</p>
              <p className="text-stone-500 text-xs">sin patrocinio</p>
            </div>
          </div>

          {subFamily && (
            <p className="text-stone-400 text-xs text-center">
              ({competitors} negocios totales en {catLabel} {"·"} ranking honesto: solo cuenta los de tu sub-categor{"í"}a)
            </p>
          )}

          {(subFamily ? subSponsors : sponsorsInCategory) === 0 ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center">
              <p className="text-red-700 font-bold text-lg">
                0 sponsors en {positionLabel}
              </p>
              <p className="text-red-600 text-sm mt-1">
                El primero que anuncie toma la posici{"ó"}n #1 ante {totalSearches} b{"ú"}squedas mensuales.
              </p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
              <p className="text-amber-700 font-bold">
                {subFamily ? subSponsors : sponsorsInCategory} sponsor{(subFamily ? subSponsors : sponsorsInCategory) > 1 ? "es" : ""} en {positionLabel}
              </p>
              <p className="text-amber-600 text-sm mt-1">
                Quedan espacios disponibles. Los sponsors aparecen primero.
              </p>
            </div>
          )}

          {topQueries.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-stone-400 uppercase tracking-wider mb-3">
                Lo que la gente busca ({"\u00FA"}ltimos 30 d{"\u00ED"}as)
              </h3>
              <div className="flex flex-wrap gap-2">
                {topQueries.map((q) => (
                  <span
                    key={q.query}
                    className="bg-po-surface border border-po-border rounded-full px-3 py-1.5 text-sm text-stone-700 italic"
                  >
                    {"\u201C"}{q.query}{"\u201D"}
                    <span className="text-stone-400 not-italic ml-1">({q.count})</span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* SECTION B-2: MISSED QUERIES (oportunidades que se te escaparon) */}
        {missedQueries.length > 0 && (
          <section className="space-y-4">
            <div>
              <Badge className="bg-orange-100 text-orange-700 border-orange-200 mb-2">
                Oportunidades
              </Badge>
              <h2 className="text-2xl font-display font-bold text-stone-900">
                Queries donde NO apareciste
              </h2>
              <p className="text-stone-500 text-sm mt-1">
                Gente buscando en tu sub-categor{"\u00ED"}a que el bot NO te recomend{"\u00F3"}. Cada uno se arregla con un keyword o sin{"\u00F3"}nimo en tu perfil.
              </p>
            </div>

            <div className="space-y-2">
              {missedQueries.map((q) => (
                <div
                  key={q.query}
                  className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="text-stone-700 italic">
                    {"\u201C"}{q.query}{"\u201D"}
                  </span>
                  <span className="text-orange-700 text-sm font-bold whitespace-nowrap">
                    {q.count}{" "}b{"\u00FA"}squeda{q.count > 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-stone-400 text-xs text-center">
              Acci{"\u00F3"}n: text{"\u00E9"}ame estos keywords y los agrego al bot esta semana.
            </p>
          </section>
        )}

        {/* SECTION C: THE MATH */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold text-stone-900">
            El valor de esta demanda
          </h2>

          <div className="bg-stone-900 text-white rounded-2xl p-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-6 text-center">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">Oportunidad identificada</p>
                <p className="text-4xl font-black text-green-400 mt-1">
                  ${demandValue.toLocaleString()}
                </p>
                <p className="text-stone-400 text-sm mt-1">
                  {totalSearches.toLocaleString()} b{"ú"}squedas {"\u00D7"} ${LEAD_VALUE} por lead
                </p>
              </div>
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-wider">Costo de La Vitrina</p>
                <p className="text-4xl font-black text-red-400 mt-1">
                  ${VITRINA_PRICE}
                </p>
                <p className="text-stone-400 text-sm mt-1">
                  por a{"ñ"}o = ${dailyCost}/d{"í"}a
                </p>
              </div>
            </div>

            {demandValue > 0 && (
              <div className="space-y-2">
                <div className="h-8">
                  <div className="bg-green-500 rounded-sm h-full w-full" />
                </div>
                <div className="h-8">
                  <div
                    className="bg-red-500 rounded-sm h-full"
                    style={{ width: `${Math.min(100, Math.round((VITRINA_PRICE / demandValue) * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-stone-400">
                  <span className="text-green-400">Demanda: ${demandValue.toLocaleString()}</span>
                  <span className="text-red-400">Costo: ${VITRINA_PRICE}/a{"ñ"}o</span>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* SECTION D: SOCIAL PROOF */}
        <section className="space-y-6">
          <h2 className="text-2xl font-display font-bold text-stone-900">
            Negocios que ya son parte de La Vitrina
          </h2>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-po-surface border-po-border">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                  {"\u2744"}
                </div>
                <div>
                  <p className="font-bold text-stone-900">Luis David Refrigeraci{"ó"}n</p>
                  <p className="text-stone-500 text-sm">Servicios — {"★"} 4.9 — Sponsor desde 2026</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-po-surface border-po-border">
              <CardContent className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl flex-shrink-0">
                  {"\u2693"}
                </div>
                <div>
                  <p className="font-bold text-stone-900">Marina Puerto Real</p>
                  <p className="text-stone-500 text-sm">Marina — {"★"} 4.4 — Sponsor desde 2026</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="bg-stone-900 text-white rounded-2xl p-6 space-y-3">
            <Badge className="bg-green-900 text-green-300 border-green-700">Caso Real</Badge>
            <p className="font-bold text-lg">Luis David Refrigeraci{"ó"}n</p>
            <p className="text-stone-300 text-sm">
              Cada vez que alguien busca &quot;aire acondicionado&quot; en
              Cabo Rojo, el bot recomienda a Luis David primero. 325 recomendaciones y contando.
            </p>
          </div>
        </section>

        {/* SECTION E: CTA */}
        <section className="space-y-8">
          <div className="text-center space-y-4">
            {isSponsor ? (
              <h2 className="text-3xl font-display font-black text-stone-900">
                Ya eres parte de La Vitrina
              </h2>
            ) : (
              <>
                <h2 className="text-3xl font-display font-black text-stone-900">
                  {"¿"}Listo para que{" "}
                  <span className="text-red-600">{place.name}</span>
                  {" "}aparezca primero?
                </h2>

                <p className="text-stone-500 max-w-xl mx-auto">
                  Escr{"í"}beme por WhatsApp y lo activamos hoy mismo.
                  Sin llamadas. Sin presentaciones largas. En blanco y negro.
                </p>

                <Link
                  href={`https://wa.me/17874177711?text=${waMessage}`}
                  target="_blank"
                  className="inline-flex items-center gap-3 bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl text-lg transition-colors"
                >
                  Textear a Angel — {BOT_PHONE}
                </Link>

                <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
                  <Link
                    href={`${CONTACT_WHATSAPP}?text=${encodeURIComponent(`Quiero probar Boost 7 días ($29) para ${place.name}`)}`}
                    target="_blank"
                    className="border border-po-border rounded-xl p-4 text-center hover:border-stone-400 transition-colors"
                  >
                    <p className="text-2xl font-black text-stone-900">$29</p>
                    <p className="text-stone-500 text-xs">Boost 7 d{"í"}as</p>
                  </Link>
                  <Link
                    href={`${CONTACT_WHATSAPP}?text=${encodeURIComponent(`Quiero La Vitrina Básica ($799/año) para ${place.name}`)}`}
                    target="_blank"
                    className="border-2 border-red-600 rounded-xl p-4 text-center relative hover:bg-red-50 transition-colors"
                  >
                    <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Popular
                    </span>
                    <p className="text-2xl font-black text-stone-900">$799</p>
                    <p className="text-stone-500 text-xs">B{"á"}sica / a{"ñ"}o</p>
                    <p className="text-green-600 text-[10px] font-medium">${dailyCost}/d{"í"}a</p>
                  </Link>
                  <Link
                    href={`${CONTACT_WHATSAPP}?text=${encodeURIComponent(`Quiero Vitrina + Veci ($1,800/año) para ${place.name}`)}`}
                    target="_blank"
                    className="border border-po-border rounded-xl p-4 text-center hover:border-stone-400 transition-colors"
                  >
                    <p className="text-2xl font-black text-stone-900">$1,800</p>
                    <p className="text-stone-500 text-xs">+ Veci / a{"ñ"}o</p>
                  </Link>
                </div>

                <div className="flex justify-center gap-8 text-sm text-stone-400 pt-4 flex-wrap">
                  <span>1. Escr{"í"}benos por WhatsApp</span>
                  <span>2. Confirmamos tu perfil</span>
                  <span>3. Activo en 24 horas</span>
                </div>
              </>
            )}
          </div>
        </section>

        <footer className="text-center text-stone-400 text-xs py-8 border-t border-po-border space-y-2">
          <p className="font-bold text-stone-500 text-sm">
            Dashboard creado y mantenido por Angel Anderson
          </p>
          <p>
            <Link href="https://caborojo.com" className="text-red-600 hover:underline">CaboRojo.com</Link>
            {" · "}
            <Link href="https://paloeste.com" className="text-red-600 hover:underline">PalOeste.com</Link>
            {" · "}
            Datos en vivo del bot {BOT_PHONE}
          </p>
          <p className="text-stone-400">
            Cada n{"ú"}mero en esta p{"á"}gina viene de b{"ú"}squedas reales de vecinos en los {"ú"}ltimos 30 d{"í"}as.
            Sin estimados, sin proyecciones — solo lo que pas{"ó"}.
          </p>
          <p className="pt-2 text-stone-300">
            ¿Quieres una p{"á"}gina como {"é"}sta para tu negocio? Text{"é"}ame VITRINA al {BOT_PHONE}.
          </p>
        </footer>

      </div>
    </div>
  )
}
