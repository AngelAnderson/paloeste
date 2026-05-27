#!/usr/bin/env node
/**
 * Mission Control Diario — PalOeste / El Veci.
 *
 * Default: dry-run. Prints a Spanish morning brief and planned draft proposals.
 * With --write: inserts proposals into public.agent_proposals only.
 *
 * Required env:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */
import { createClient } from '@supabase/supabase-js'

const WRITE = process.argv.includes('--write')
const CHECK = process.argv.includes('--check')

if (CHECK) {
  console.log('mission-control: ok')
  process.exit(0)
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(2)
}

const sb = createClient(url, key, { auth: { persistSession: false } })

function isoDaysAgo(days) {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - days)
  return d.toISOString()
}

function todayDate() {
  return new Date().toISOString().slice(0, 10)
}

function searchTermsForGap(gap) {
  const raw = `${gap.query || ''} ${gap.category || ''}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  const terms = new Set(raw.split(/[^a-z0-9]+/).filter(t => t.length >= 4))

  if (raw.includes('plomero') || raw.includes('plumber')) {
    terms.add('plomero')
    terms.add('plumbing')
    terms.add('plumber')
  }
  if (raw.includes('air conditioner') || raw.includes('aire acondicionado') || raw.includes('refrigeracion')) {
    terms.add('refrigeracion')
    terms.add('acondicionado')
    terms.add('mecanico')
    terms.add('auto')
  }

  return Array.from(terms).slice(0, 6)
}

async function safe(label, fn, fallback) {
  try {
    const { data, error, count } = await fn()
    if (error) return { label, error: error.message, data: fallback, count: count ?? null }
    return { label, data: data ?? fallback, count: count ?? null }
  } catch (e) {
    return { label, error: e instanceof Error ? e.message : String(e), data: fallback, count: null }
  }
}

async function loadMissionData() {
  const today = todayDate()
  const [
    unbilled,
    followUps,
    needsHuman,
    pendingDecisions,
    existingProposals,
    botFeedback,
    searchGaps,
    apiErrors,
    stalePlaces,
    opportunities,
  ] = await Promise.all([
    safe('unbilled', () => sb
      .from('bot_leads')
      .select('id,business_id,business_name,user_phone,query,channel,amount_cents,created_at,billed')
      .eq('billed', false)
      .order('created_at', { ascending: false })
      .limit(50), []),
    safe('followUps', () => sb
      .from('prospects')
      .select('id,place_id,business_name,contact_name,contact_phone,stage,next_action,next_action_date,last_contact_at,proposed_amount_cents')
      .in('stage', ['lead', 'contacted', 'pitched', 'negotiating'])
      .lte('next_action_date', today)
      .order('next_action_date', { ascending: true })
      .limit(50), []),
    safe('needsHuman', () => sb
      .from('conversations')
      .select('id,contact,channel,last_inbound_body,last_message_at,intent')
      .eq('line', '7711')
      .eq('needs_human', true)
      .order('last_message_at', { ascending: false })
      .limit(25), []),
    safe('pendingDecisions', () => sb
      .from('cartera_decisions')
      .select('id,agent_id,action_type,preview,proposed_at,expires_at')
      .is('decision', null)
      .gt('expires_at', new Date().toISOString())
      .order('proposed_at', { ascending: false })
      .limit(50), []),
    safe('existingProposals', () => sb
      .from('agent_proposals')
      .select('id,title,proposal_type,status,created_at')
      .in('status', ['draft', 'needs_review'])
      .gte('created_at', isoDaysAgo(2))
      .limit(200), []),
    safe('botFeedback', () => sb
      .from('message_feedback')
      .select('id,message_id,conversation_id,flagged_by,reason,suggested_response,status,original_body,created_at')
      .gte('created_at', isoDaysAgo(7))
      .order('created_at', { ascending: false })
      .limit(25), []),
    safe('searchGaps', () => sb
      .from('search_gaps')
      .select('id,query,category,results_count,source,created_at')
      .gte('created_at', isoDaysAgo(7))
      .order('created_at', { ascending: false })
      .limit(25), []),
    safe('apiErrors', () => sb
      .from('api_logs')
      .select('id,endpoint,method,query,response_count,created_at')
      .gte('created_at', isoDaysAgo(1))
      .eq('response_count', 0)
      .order('created_at', { ascending: false })
      .limit(25), []),
    safe('stalePlaces', () => sb
      .from('places')
      .select('id,name,category,municipality,verified_at,phone,website')
      .eq('visibility', 'published')
      .or(`verified_at.is.null,verified_at.lt.${isoDaysAgo(120)}`)
      .order('verified_at', { ascending: true, nullsFirst: true })
      .limit(25), []),
    safe('opportunities', () => sb.rpc('get_conversion_opportunities', { min_leads: 3 }), []),
  ])

  const gapMatches = {}
  for (const gap of rows(searchGaps).slice(0, 8)) {
    const terms = searchTermsForGap(gap)
    if (!terms.length) {
      gapMatches[gap.id] = { terms, matches: [] }
      continue
    }

    const filters = terms.flatMap(term => [
      `name.ilike.%${term}%`,
      `category.ilike.%${term}%`,
      `subcategory.ilike.%${term}%`,
      `description.ilike.%${term}%`,
      `one_liner.ilike.%${term}%`,
    ]).join(',')

    const matchResult = await safe(`gapMatches:${gap.id}`, () => sb
      .from('places')
      .select('id,name,category,subcategory,municipality,phone,website,verified_at')
      .eq('visibility', 'published')
      .or(filters)
      .limit(5), [])

    gapMatches[gap.id] = { terms, matches: rows(matchResult), error: matchResult.error }
  }

  return {
    unbilled,
    followUps,
    needsHuman,
    pendingDecisions,
    existingProposals,
    botFeedback,
    searchGaps,
    apiErrors,
    stalePlaces,
    opportunities,
    gapMatches,
  }
}

function rows(result) {
  return Array.isArray(result.data) ? result.data : []
}

function proposalKey(p) {
  return `${p.proposal_type}::${p.title}`
}

function buildProposals(data) {
  const proposals = []

  const unbilledByBusiness = new Map()
  for (const lead of rows(data.unbilled)) {
    const id = lead.business_id || lead.business_name || lead.id
    const current = unbilledByBusiness.get(id) || {
      business_id: lead.business_id,
      business_name: lead.business_name || 'Unknown',
      lead_count: 0,
      amount_cents: 0,
      newest: lead.created_at,
      examples: [],
    }
    current.lead_count += 1
    current.amount_cents += lead.amount_cents || 0
    current.examples.push({ query: lead.query, channel: lead.channel, created_at: lead.created_at })
    unbilledByBusiness.set(id, current)
  }

  for (const item of Array.from(unbilledByBusiness.values()).filter(x => x.lead_count >= 2 || x.amount_cents > 0).slice(0, 8)) {
    proposals.push({
      agent_name: 'Mission Control',
      proposal_type: 'collect_unbilled_leads',
      target_table: 'bot_leads',
      target_id: null,
      title: `Cobrar o revisar leads: ${item.business_name}`,
      rationale: `${item.lead_count} lead(s) sin facturar detectados para ${item.business_name}.`,
      evidence: item,
      proposed_patch: {
        action: 'review_and_collect',
        admin_path: '/admin/dinero',
        suggested_message: `Oye ${item.business_name}, El Veci te envió ${item.lead_count} lead(s). ¿Revisamos el plan para activar La Vitrina?`,
      },
      risk_level: 'medium',
      rollback_plan: 'No se envía nada automáticamente; cerrar propuesta si no aplica.',
    })
  }

  for (const p of rows(data.followUps).slice(0, 8)) {
    proposals.push({
      agent_name: 'Mission Control',
      proposal_type: 'follow_up_prospect',
      target_table: 'prospects',
      target_id: p.id,
      title: `Follow-up hoy: ${p.business_name}`,
      rationale: `Prospect en etapa ${p.stage} tiene next_action vencido o para hoy.`,
      evidence: p,
      proposed_patch: {
        action: 'contact_prospect',
        admin_path: '/admin/pipeline',
        suggested_message: p.next_action || `Saludos ${p.contact_name || p.business_name}, quería darle seguimiento a lo que hablamos de PalOeste / El Veci.`,
      },
      risk_level: 'medium',
      rollback_plan: 'No se contacta automáticamente; marcar como no aplica si ya se atendió.',
    })
  }

  for (const c of rows(data.needsHuman).slice(0, 5)) {
    proposals.push({
      agent_name: 'Mission Control',
      proposal_type: 'answer_inbox',
      target_table: 'conversations',
      target_id: c.id,
      title: `Responder inbox: ${c.contact}`,
      rationale: 'Conversación marcada como needs_human.',
      evidence: c,
      proposed_patch: {
        action: 'open_inbox',
        admin_path: '/admin/inbox',
      },
      risk_level: 'low',
      rollback_plan: 'No se responde automáticamente.',
    })
  }

  for (const g of rows(data.searchGaps).slice(0, 5)) {
    const matchInfo = data.gapMatches?.[g.id] || { terms: [], matches: [] }
    const matches = Array.isArray(matchInfo.matches) ? matchInfo.matches : []
    const hasCandidate = matches.length > 0

    proposals.push({
      agent_name: 'Mission Control',
      proposal_type: hasCandidate ? 'fix_search_match' : 'source_directory_supply',
      target_table: 'search_gaps',
      target_id: g.id,
      title: hasCandidate
        ? `Arreglar búsqueda que no encontró candidato: ${g.query}`
        : `Conseguir oferta para búsqueda sin respuesta: ${g.query}`,
      rationale: hasCandidate
        ? `La búsqueda tuvo 0 resultados, pero el directorio ya tiene ${matches.length} candidato(s). Esto apunta a fallo de ranking, sinónimos, embeddings o filtro.`
        : 'Una búsqueda reciente no tuvo respuesta y no encontré candidato publicado en el directorio. Esto debe convertirse en tarea de supply/content, no solo edición.',
      evidence: { ...g, candidate_places: matches, terms_checked: matchInfo.terms, match_error: matchInfo.error },
      proposed_patch: {
        action: hasCandidate ? 'fix_retrieval_or_synonyms' : 'source_new_supply',
        admin_path: hasCandidate ? '/admin/bot' : '/admin/directorio',
        suggested_next_steps: hasCandidate
          ? [
              'Probar la búsqueda en el bot.',
              'Confirmar por qué no devolvió el candidato existente.',
              'Actualizar sinónimos, categoría, embedding o ranking antes de crear otra ficha.',
            ]
          : [
              'Crear post preguntando por recomendación local.',
              'Buscar candidato externo y crear ficha draft.',
              'Marcar como oportunidad de sponsor si la demanda se repite.',
            ],
        suggested_post: hasCandidate
          ? null
          : `La gente está buscando "${g.query}" en El Veci. ¿Conoces a alguien confiable en el oeste? Escríbenos al 787-417-7711.`,
      },
      risk_level: 'medium',
      rollback_plan: 'No edita directorio ni publica contenido automáticamente.',
    })
  }

  for (const f of rows(data.botFeedback).slice(0, 5)) {
    proposals.push({
      agent_name: 'Mission Control',
      proposal_type: 'review_bot_feedback',
      target_table: 'message_feedback',
      target_id: f.id,
      title: `Revisar feedback del bot: ${f.conversation_id || f.message_id || f.id}`,
      rationale: 'Feedback reciente puede revelar una respuesta mala o oportunidad de entrenamiento.',
      evidence: f,
      proposed_patch: {
        action: 'review_feedback',
        admin_path: '/admin/feedback',
      },
      risk_level: 'low',
      rollback_plan: 'Solo revisión; no muta comportamiento del bot.',
    })
  }

  for (const place of rows(data.stalePlaces).slice(0, 5)) {
    proposals.push({
      agent_name: 'Mission Control',
      proposal_type: 'refresh_place_data',
      target_table: 'places',
      target_id: place.id,
      title: `Verificar ficha stale: ${place.name}`,
      rationale: 'Ficha publicada sin verificación reciente.',
      evidence: place,
      proposed_patch: {
        action: 'verify_place',
        admin_path: `/admin/editar/${place.id}`,
      },
      risk_level: 'low',
      rollback_plan: 'No cambia la ficha automáticamente.',
    })
  }

  for (const o of rows(data.opportunities).slice(0, 5)) {
    proposals.push({
      agent_name: 'Mission Control',
      proposal_type: 'activate_sponsor',
      target_table: 'places',
      target_id: o.place_id,
      title: `Activar sponsor: ${o.name}`,
      rationale: `${o.lead_count} señales/leads sugieren demanda real para ${o.category}.`,
      evidence: o,
      proposed_patch: {
        action: 'pitch_vitrina',
        admin_path: '/admin/dinero',
      },
      risk_level: 'medium',
      rollback_plan: 'No se contacta automáticamente.',
    })
  }

  return proposals
}

function buildBrief(data, proposals) {
  const unbilled = rows(data.unbilled)
  const followUps = rows(data.followUps)
  const needsHuman = rows(data.needsHuman)
  const pendingDecisions = rows(data.pendingDecisions)
  const errors = rows(data.apiErrors)
  const gaps = rows(data.searchGaps)
  const opportunities = rows(data.opportunities)
  const totalCents = unbilled.reduce((sum, r) => sum + (r.amount_cents || 0), 0)

  const lines = [
    '# Mission Control Diario — El Veci / PalOeste',
    '',
    `Generado: ${new Date().toLocaleString('es-PR', { timeZone: 'America/Puerto_Rico' })}`,
    `Modo: ${WRITE ? 'WRITE draft-only' : 'DRY RUN'}`,
    '',
    '## Prioridad hoy',
    `1. Cobrar/revisar dinero: ${unbilled.length} leads sin facturar, $${(totalCents / 100).toFixed(0)} estimado.`,
    `2. Follow-ups: ${followUps.length} prospectos vencidos o para hoy.`,
    `3. Inbox humano: ${needsHuman.length} conversaciones necesitan intervención.`,
    `4. Decisiones existentes: ${pendingDecisions.length} drafts en /admin/decisiones.`,
    `5. Calidad: ${gaps.length} search gaps últimos 7 días, ${errors.length} errores API últimas 24h.`,
    '',
    '## Oportunidades',
    opportunities.slice(0, 5).map(o => `- ${o.name}: ${o.lead_count} señales (${o.category || 'sin categoría'})`).join('\n') || '- Sin oportunidades nuevas.',
    '',
    '## Propuestas draft-only',
    proposals.slice(0, 12).map(p => `- [${p.risk_level}] ${p.title}`).join('\n') || '- No se generaron propuestas.',
    '',
    '## Regla de seguridad',
    'No se enviaron mensajes, no se editaron fichas, no se publicó contenido y no se aplicó ninguna propuesta.',
  ]

  const sourceErrors = Object.values(data).filter(v => v && v.error).map(v => `- ${v.label}: ${v.error}`)
  if (sourceErrors.length) {
    lines.push('', '## Errores de lectura', ...sourceErrors)
  }

  return lines.join('\n')
}

async function insertProposals(proposals, existing) {
  const existingKeys = new Set(rows(existing).map(proposalKey))
  const fresh = proposals.filter(p => !existingKeys.has(proposalKey(p)))
  if (!fresh.length) return { inserted: 0, skipped: proposals.length }

  const { error } = await sb.from('agent_proposals').insert(fresh.map(p => ({
    ...p,
    status: 'draft',
  })))
  if (error) throw new Error(error.message)
  return { inserted: fresh.length, skipped: proposals.length - fresh.length }
}

const data = await loadMissionData()
const proposals = buildProposals(data)
const brief = buildBrief(data, proposals)

console.log(brief)

if (WRITE) {
  const result = await insertProposals(proposals, data.existingProposals)
  console.log(`\nProposals inserted: ${result.inserted}; skipped duplicates: ${result.skipped}`)
} else {
  console.log('\nDry-run only. Use --write to insert draft proposals into agent_proposals.')
}
