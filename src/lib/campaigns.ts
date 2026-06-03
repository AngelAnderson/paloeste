// Campaign Swipe File — reusable source for the AdMent /admin/campanas panel.
// Mirrors Outbox/Sponsors/Swipe-File-Campanas.md. Edit here to update the panel.
// Rule: we sell named campaigns with a measurable goal, not "publicaciones".
// The one-page plan is the free off-sale (abra-puertas); execution is the Vitrina.

export interface CampaignArchetype {
  id: string
  emoji: string
  name: string
  feels: string       // lo que el dueño SIENTE
  mechanism: string
  metric: string      // la meta medible
  fits: string
  tier: string
  /** true → panel lists live businesses that qualify from bot demand */
  qualifiesFromDemand?: boolean
  accent: string
}

export interface BusinessPlay {
  business: string
  emoji: string
  status: 'sponsor' | 'prospecto' | 'cliente'
  archetypeId: string
  campaignName: string
  hiddenOpportunity: string
  mechanism: string
  metric: string
  hook: string
}

export const ARCHETYPES: CampaignArchetype[] = [
  {
    id: 'resultado',
    emoji: '🔥',
    name: 'Campaña de Resultado',
    feels: 'Esto me trae clientes, no posts.',
    mechanism: 'El Veci recomienda activamente al negocio. Posts = combustible, no el producto. Solo donde el bot YA muestra demanda real.',
    metric: 'X conversaciones/inquiries en 30-60 días, o se extiende gratis.',
    fits: 'Categorías con demanda probada en *7711.',
    tier: 'Premium ($1,800 reframeado / SKU performance)',
    qualifiesFromDemand: true,
    accent: '#f87171',
  },
  {
    id: 'temporada',
    emoji: '📅',
    name: 'La Temporada',
    feels: 'Tengo un verano/temporada planificado, no posts sueltos.',
    mechanism: 'Arco de 90 días: teaser → build (sabor/experiencia de la semana) → final (evento o push). Modelo 1×7 envuelto en narrativa.',
    metric: 'Foot traffic / covers / reservas durante la ventana.',
    fits: 'Negocios estacionales (heladería, marina, hospedaje).',
    tier: '$1,800 "La Campaña"',
    accent: '#fb923c',
  },
  {
    id: 'lanzamiento',
    emoji: '🚀',
    name: 'El Lanzamiento',
    feels: 'Lancé y se llenó el día 1.',
    mechanism: 'Menú/producto/servicio nuevo en drop coordinado FB + Veci + newsletter + evento opcional. Cuenta regresiva.',
    metric: 'Tráfico/ventas el día de apertura.',
    fits: 'Menú nuevo, servicio nuevo, reapertura.',
    tier: '$799 / $1,800',
    accent: '#a78bfa',
  },
  {
    id: 'reactivacion',
    emoji: '🔄',
    name: 'La Reactivación',
    feels: 'Volvieron los que no veía hace meses.',
    mechanism: 'UGC de clientes + oferta "vuelve" + recordatorios del Veci a base dormida.',
    metric: 'Base reactivada / repeat visits.',
    fits: 'Restaurantes y servicios con base dormida.',
    tier: '$799',
    accent: '#38bdf8',
  },
  {
    id: 'confianza',
    emoji: '🛡️',
    name: 'El Sello de Confianza',
    feels: 'Soy el negocio en que la gente confía.',
    mechanism: 'Badge verificado (NPPES/Mapa) + serie Q&A ("Pregúntale a…") + El Veci recomienda + alertas.',
    metric: 'Confianza → retención (recetas/clientes que se quedan).',
    fits: 'Salud, farmacia, profesionales, oficios certificados.',
    tier: '$1,800',
    accent: '#4ade80',
  },
  {
    id: 'resenas',
    emoji: '⭐',
    name: 'El Imán de Reseñas',
    feels: 'Subí de estrellas y salgo primero en Google.',
    mechanism: 'Foot traffic → flujo del Veci pide la reseña + CTA en local + UGC.',
    metric: '+N reseñas Google / subir rating.',
    fits: 'Cualquiera con tráfico físico (add-on universal).',
    tier: 'Add-on',
    accent: '#fbbf24',
  },
]

export const BUSINESS_PLAYS: BusinessPlay[] = [
  {
    business: 'Gold Ice Cream',
    emoji: '🍦',
    status: 'prospecto',
    archetypeId: 'temporada',
    campaignName: 'El Verano de Gold',
    hiddenOpportunity: 'Producto visual + emocional (nenes, familia, calor) = UGC infinito que no están capturando.',
    mechanism: 'Sabor de la semana + foto de nenes con helado + foot traffic fines de semana.',
    metric: 'X visitas/fin de semana durante el verano.',
    hook: 'El verano es TU temporada y se va a ir sin que nadie sepa lo que tienes nuevo.',
  },
  {
    business: 'Farmacia Encarnación',
    emoji: '💊',
    status: 'prospecto',
    archetypeId: 'confianza',
    campaignName: 'La Farmacia en que se Confía',
    hiddenOpportunity: 'Ya tiene badge NPPES verificado y el case study — falta empaquetarlo como campaña que ELLOS sientan.',
    mechanism: 'Alertas de recall + "Pregúntale a la consultora" con Noelia + badge verificada en el Mapa.',
    metric: 'Confianza = recetas que no se van a la cadena grande.',
    hook: 'Las cadenas tienen presupuesto; tú tienes confianza. Vamos a hacerla visible.',
  },
  {
    business: 'Marina Puerto Real',
    emoji: '⚓',
    status: 'sponsor',
    archetypeId: 'temporada',
    campaignName: 'Atardecer en la Marina',
    hiddenOpportunity: 'Activo visual brutal (botes, sunset, mar) desperdiciado en posts genéricos. Sirve a metro + diáspora + turista.',
    mechanism: 'Serie experiencia atardecer/náutica targeting visitantes; empuja covers de Antares + inquiries de slips.',
    metric: 'Covers en Antares + inquiries de slips en la ventana de temporada.',
    hook: 'No vendes un slip; vendes el atardecer. Vamos a venderlo.',
  },
  {
    business: 'Villa La Mela',
    emoji: '🏖️',
    status: 'prospecto',
    archetypeId: 'resultado',
    campaignName: '60 Noches Antes de Temporada',
    hiddenOpportunity: 'Lo que de verdad quieren = noches reservadas, NO likes. La diáspora (FL/NY/TX) reserva por OTA pagando fees.',
    mechanism: 'Booking-driver directo a diáspora; se brincan las fees de Airbnb; El Veci/Mapa los manda.',
    metric: 'Noches reservadas directas (número duro).',
    hook: 'Cada reserva por Airbnb te cuesta ~15% en fees. Vamos a llenarte directo.',
  },
  {
    business: 'Costa Brava',
    emoji: '🍽️',
    status: 'prospecto',
    archetypeId: 'lanzamiento',
    campaignName: 'Lo que el Oeste No Sabe de Ti',
    hiddenOpportunity: 'Verificar primero: ¿menú/temporada nueva (Lanzamiento) o base dormida (Reactivación)?',
    mechanism: 'Drop coordinado FB + Veci + newsletter, o win-back con UGC + oferta vuelve.',
    metric: 'Covers / repeat visits.',
    hook: '¿Qué quieres que el oeste sepa de ti que ahora mismo no sabe?',
  },
]

/**
 * Builds the free "plan de una página" abra-puertas message — value-first,
 * NO price, NO Stripe (per CLAUDE.md production rule #3). Price comes only if
 * they ask.
 */
export function buildPlanMessage(opts: {
  businessName: string
  campaignName: string
  hook: string
  demand?: { leadCount: number; category: string }
}): string {
  const { businessName, campaignName, hook, demand } = opts
  const dataLine = demand
    ? `En El Veci (*7711) ${demand.leadCount} personas buscaron ${demand.category} este mes y tu negocio salió en los resultados. `
    : ''
  return (
    `Oye ${businessName} 👋 — soy Angel de CaboRojo.com. ` +
    dataLine +
    `Se me ocurrió una campaña para ti: "${campaignName}". ${hook} ` +
    `No es pagar por publicaciones — es una campaña con una meta clara. ` +
    `¿Te mando el plan de una página pa' que lo veas? Si no es pa' ti, sin problema, sigue tu camino. ` +
    `— Angel | Menos revolú, más sistema, mejor vida.`
  )
}
