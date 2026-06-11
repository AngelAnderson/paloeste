import type { OverdueRelationship, ConversionOpportunity, Prospect } from './types'
import type { UnbilledBusiness } from './admin-queries'

// Las 6 Bandejas (canon LOCKED 2026-06-08) computed live from Supabase data.
// HOY caps at 3; everything else falls to its own tray. Money/peace items
// carry costo de inacción; every item carries its age so silence is impossible.

export interface BandejaItem {
  id: string
  title: string
  detail: string
  costo?: string
  ageDays?: number
  amountCents?: number
  phone?: string | null
  draftMessage?: string
  href?: string
  cta?: string
}

export interface Bandejas {
  hoy: BandejaItem[]
  dinero: BandejaItem[]
  paz: BandejaItem[]
  futuro: BandejaItem[]
  delegar: BandejaItem[]
  despues: BandejaItem[]
}

export interface BandejasInput {
  overdueRels: OverdueRelationship[]
  unbilled: UnbilledBusiness[]
  opportunities: ConversionOpportunity[]
  prospects: Prospect[]
  needsHumanCount: number
  pendingSubmissions: number
  pendingEdits: number
  pendingDecisions: number
  missingPhotos: { id: string; name: string; category: string; sponsor_weight: number }[]
  noeliaTasksOpen: number
  relsSinPhone: number
  prospectsSinFecha: number
}

const MONEY_SIGNAL = /costo|precio|vitrina|pago|cuanto|cuánto|billetera|presupuesto/i
const ACTIVE_STAGES = new Set(['lead', 'contacted', 'pitched', 'negotiating'])

function dollars(cents: number) {
  return `$${Math.round(cents / 100).toLocaleString()}`
}

function leadDraft(rel: OverdueRelationship): string {
  if (MONEY_SIGNAL.test(rel.next_action || '')) {
    return 'Saludos, soy Angel de CaboRojo.com. Vi tu pregunta sobre la Vitrina y te quedé debiendo la respuesta. La prueba es $40 (una publicación esta semana + listing en el Veci) y el mes completo $150 (4 publicaciones, una por semana). Si te cuadra te mando el link de pago. Y si no, todo bien.'
  }
  return 'Saludos, soy Angel de CaboRojo.com y El Veci (787-417-7711). Vi tu mensaje y te quedé debiendo respuesta. Cuéntame, ¿en qué te puedo ayudar?'
}

export function clasificarBandejas(input: BandejasInput): Bandejas {
  const dinero: BandejaItem[] = []
  const paz: BandejaItem[] = []
  const futuro: BandejaItem[] = []
  const delegar: BandejaItem[] = []
  const despues: BandejaItem[] = []

  // --- Candidates for HOY, scored by costo de inacción ---
  const hoyCandidates: { item: BandejaItem; score: number; pool: BandejaItem[] }[] = []

  // 1. Inbound leads overdue — the exact failure the ledger exists to prevent.
  //    Canon: lead que preguntó precio + ≥7d callado → HOY automático.
  const inboundLeads = input.overdueRels.filter(r => r.type === 'inbound_lead')
  for (const rel of inboundLeads) {
    const age = rel.days_since_contact >= 999 ? undefined : rel.days_since_contact
    const askedMoney = MONEY_SIGNAL.test(rel.next_action || '')
    const potential = rel.revenue_potential_cents || 0
    const item: BandejaItem = {
      id: `lead_${rel.id}`,
      title: rel.name,
      detail: rel.next_action || 'Inbound lead sin respuesta',
      costo: askedMoney
        ? `${potential > 0 ? dollars(potential) + ' ' : 'Dinero '}enfriándose — preguntó y nadie contestó`
        : 'Lead que se enfría en silencio',
      ageDays: age,
      amountCents: potential || undefined,
      phone: rel.contact_phone,
      draftMessage: leadDraft(rel),
      href: '/admin/contactos',
      cta: rel.contact_phone ? 'Responder' : 'Ver',
    }
    const score = (askedMoney ? 100000 : 20000) + potential / 100 + Math.min(rel.days_since_contact, 90) * 200
    hoyCandidates.push({ item, score, pool: dinero })
  }

  // 2. Cobros pendientes (unbilled, non-sponsor)
  for (const u of input.unbilled) {
    if (u.sponsor_weight > 0) continue
    const age = Math.max(0, Math.floor((Date.now() - new Date(u.newest).getTime()) / 86400000))
    const item: BandejaItem = {
      id: `cobro_${u.business_id}`,
      title: u.business_name,
      detail: `${u.lead_count} leads del Veci sin cobrar`,
      costo: `${dollars(u.total_cents)} en la mesa`,
      ageDays: age,
      amountCents: u.total_cents,
      phone: u.phone,
      draftMessage: `Oye, este mes El Veci le envió ${u.lead_count} clientes a ${u.business_name} buscando ${u.category || 'tu categoría'}. Son ${dollars(u.total_cents)}. ¿Te paso el link de pago?`,
      href: `/admin/editar/${u.business_id}`,
      cta: u.phone ? 'Cobrar' : 'Ver',
    }
    hoyCandidates.push({ item, score: u.total_cents + age * 500, pool: dinero })
  }

  // 3. Prospect follow-ups vencidos
  const today = new Date().toISOString().slice(0, 10)
  for (const p of input.prospects) {
    if (!ACTIVE_STAGES.has(p.stage.replace('closed_', ''))) continue
    if (!p.next_action_date || p.next_action_date.slice(0, 10) > today) continue
    const age = Math.max(0, Math.floor((Date.now() - new Date(p.next_action_date).getTime()) / 86400000))
    const amount = p.proposed_amount_cents || 0
    const item: BandejaItem = {
      id: `prospect_${p.id}`,
      title: p.business_name,
      detail: p.next_action || `Follow-up (${p.stage})`,
      costo: amount > 0 ? `${dollars(amount)} propuestos esperando follow-up` : 'Pipeline parado',
      ageDays: age,
      amountCents: amount || undefined,
      phone: p.contact_phone,
      draftMessage: p.next_action || '',
      href: '/admin/pipeline',
      cta: p.contact_phone ? 'Mensaje' : 'Pipeline',
    }
    hoyCandidates.push({ item, score: (amount || 30000) + age * 300, pool: dinero })
  }

  // 4. Oportunidades de pitch (negocios con leads gratis) → DINERO directo
  for (const o of input.opportunities.slice(0, 5)) {
    if (o.has_billing) continue
    dinero.push({
      id: `pitch_${o.place_id}`,
      title: o.name,
      detail: `${o.lead_count} leads gratis del Veci · ${o.category || ''}`,
      costo: `${dollars(o.total_value_cents)} en valor sin pitchear`,
      amountCents: o.total_value_cents,
      href: `/admin/editar/${o.place_id}`,
      cta: 'Pitchear',
    })
  }

  // --- PAZ: lo que roba paz si sigue abierto ---
  const personalRels = input.overdueRels.filter(r => r.type === 'personal')
  for (const rel of personalRels.slice(0, 4)) {
    paz.push({
      id: `personal_${rel.id}`,
      title: rel.name,
      detail: rel.next_action || `Toca contacto (cadencia ${rel.cadence})`,
      costo: 'La familia no va después de todo',
      ageDays: rel.days_since_contact >= 999 ? undefined : rel.days_since_contact,
      phone: rel.contact_phone,
      draftMessage: '',
      href: '/admin/contactos',
      cta: rel.contact_phone ? 'Mensaje' : 'Ver',
    })
  }
  if (input.needsHumanCount > 0) {
    paz.push({
      id: 'inbox_humano',
      title: `${input.needsHumanCount} conversaciones esperando humano`,
      detail: 'El Veci las marcó needs_human — cada una es un vecino esperando',
      costo: 'Vecino que no vuelve si nadie contesta',
      href: '/admin/inbox',
      cta: 'Abrir inbox',
    })
  }

  // --- DELEGAR: el sistema o Noelia ya tienen el draft listo ---
  if (input.pendingDecisions > 0) {
    delegar.push({
      id: 'decisiones',
      title: `${input.pendingDecisions} propuestas de agentes esperando "dale"`,
      detail: 'Los agentes ya hicieron el trabajo — solo falta aprobar o rechazar',
      href: '/admin/decisiones',
      cta: 'Decidir',
    })
  }
  if (input.pendingSubmissions > 0) {
    delegar.push({
      id: 'submissions',
      title: `${input.pendingSubmissions} submission${input.pendingSubmissions > 1 ? 's' : ''} de vecinos`,
      detail: 'Contenido que llegó por el Veci — revisar y publicar en 1 clic',
      href: '/admin/submissions',
      cta: 'Revisar',
    })
  }
  if (input.pendingEdits > 0) {
    delegar.push({
      id: 'edits',
      title: `${input.pendingEdits} edits de negocios pendientes`,
      detail: 'Cambios sugeridos al directorio — aprobar o rechazar',
      href: '/admin/edits',
      cta: 'Revisar',
    })
  }
  if (input.noeliaTasksOpen > 0) {
    delegar.push({
      id: 'noelia_tasks',
      title: `${input.noeliaTasksOpen} tareas abiertas para Noelia`,
      detail: 'Verificaciones de salud + audit de farmacias — el sistema las reparte',
      href: '/admin/tareas',
      cta: 'Ver tareas',
    })
  }
  const sponsorPhotos = input.missingPhotos.filter(p => p.sponsor_weight > 0)
  if (input.missingPhotos.length > 0) {
    delegar.push({
      id: 'fotos',
      title: `${input.missingPhotos.length} negocios sin foto${sponsorPhotos.length > 0 ? ` (${sponsorPhotos.length} sponsor)` : ''}`,
      detail: 'Lista lista para Noelia — sponsors primero',
      href: '/admin/directorio',
      cta: 'Ver lista',
    })
  }

  // --- FUTURO: substrate que compound (data hygiene = el moat) ---
  if (input.relsSinPhone > 0) {
    futuro.push({
      id: 'rels_sin_phone',
      title: `${input.relsSinPhone} relaciones sin teléfono`,
      detail: 'No se les puede escribir desde el admin — cada una que arregles vuelve contactable',
      href: '/admin/contactos',
      cta: 'Limpiar',
    })
  }
  if (input.prospectsSinFecha > 0) {
    futuro.push({
      id: 'prospects_sin_fecha',
      title: `${input.prospectsSinFecha} prospect${input.prospectsSinFecha > 1 ? 's' : ''} sin próxima acción`,
      detail: 'Invisibles en el pipeline — nunca aparecen en follow-ups',
      costo: 'Un prospect sin fecha es un prospect que se olvida solo',
      href: '/admin/pipeline',
      cta: 'Ponerles fecha',
    })
  }

  // --- HOY: top 3 por costo de inacción; el resto cae a su bandeja ---
  hoyCandidates.sort((a, b) => b.score - a.score)
  const hoy = hoyCandidates.slice(0, 3).map(c => c.item)
  for (const c of hoyCandidates.slice(3)) c.pool.push(c.item)

  // --- DESPUÉS: la cola larga de relaciones (prospect/cold/client overdue) ---
  const longTail = input.overdueRels.filter(r => r.type !== 'inbound_lead' && r.type !== 'personal')
  if (longTail.length > 0) {
    despues.push({
      id: 'rels_long_tail',
      title: `${longTail.length} relaciones más fuera de cadencia`,
      detail: 'Prospects, clientes y contactos fríos — el radar completo vive en Contactos',
      href: '/admin/contactos',
      cta: 'Ver radar',
    })
  }

  // DINERO: cap visible, lo demás implícito en sus páginas
  dinero.sort((a, b) => (b.amountCents || 0) - (a.amountCents || 0))

  return { hoy, dinero: dinero.slice(0, 8), paz, futuro, delegar, despues }
}
