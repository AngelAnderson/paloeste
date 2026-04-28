import type { ConversionOpportunity, SponsorROI, Prospect } from './types'
import type { UnbilledBusiness } from './admin-queries'

export type ActionType = 'follow_up' | 'unbilled' | 'pitch' | 'sponsor_risk'

export interface RankedAction {
  type: ActionType
  id: string
  title: string
  reason: string
  amountCents: number | null
  score: number
  ctaLabel: string
  href: string
  payload:
    | { type: 'follow_up'; prospect: Prospect }
    | { type: 'unbilled'; unbilled: UnbilledBusiness }
    | { type: 'pitch'; opportunity: ConversionOpportunity }
    | { type: 'sponsor_risk'; sponsor: SponsorROI }
}

const ACTIVE_PROSPECT_STAGES = new Set(['lead', 'contacted', 'pitched', 'negotiating'])

export function rankActions(inputs: {
  followUps: Prospect[]
  unbilled: UnbilledBusiness[]
  opportunities: ConversionOpportunity[]
  sponsors: SponsorROI[]
}): RankedAction[] {
  const actions: RankedAction[] = []
  const now = Date.now()

  // 1. Pipeline follow-ups due today/overdue
  for (const p of inputs.followUps) {
    if (!ACTIVE_PROSPECT_STAGES.has(p.stage.replace('closed_', ''))) continue
    if (!p.next_action_date) continue
    const daysOverdue = Math.max(
      0,
      Math.floor((now - new Date(p.next_action_date).getTime()) / 86400000),
    )
    const amount = p.proposed_amount_cents ?? 50000
    const urgency = 1 + daysOverdue * 0.5
    actions.push({
      type: 'follow_up',
      id: `follow_${p.id}`,
      title: p.business_name,
      reason: daysOverdue > 0
        ? `Follow-up ${daysOverdue}d atrasado · ${p.stage.replace('closed_', '')}`
        : `Follow-up hoy · ${p.stage.replace('closed_', '')}`,
      amountCents: p.proposed_amount_cents,
      score: amount * urgency,
      ctaLabel: p.contact_phone ? 'Mensaje' : 'Pipeline',
      href: '/admin/pipeline',
      payload: { type: 'follow_up', prospect: p },
    })
  }

  // 2. Unbilled cobros — priority grows with $ × age
  for (const u of inputs.unbilled) {
    if (u.sponsor_weight > 0) continue // sponsors are paying — skip
    const daysSince = Math.max(
      1,
      Math.floor((now - new Date(u.newest).getTime()) / 86400000),
    )
    const urgency = 1 + daysSince / 7
    actions.push({
      type: 'unbilled',
      id: `unbilled_${u.business_id}`,
      title: u.business_name,
      reason: `${u.lead_count} leads · ${daysSince}d sin cobrar`,
      amountCents: u.total_cents,
      score: u.total_cents * urgency,
      ctaLabel: u.phone ? 'Cobrar' : 'Copiar mensaje',
      href: `/admin/editar/${u.business_id}`,
      payload: { type: 'unbilled', unbilled: u },
    })
  }

  // 3. Pitch opportunities — businesses with 3+ leads not paying
  for (const o of inputs.opportunities) {
    if (o.has_billing) continue
    const leadBoost = 1 + Math.min(o.lead_count / 3, 3)
    actions.push({
      type: 'pitch',
      id: `pitch_${o.place_id}`,
      title: o.name,
      reason: `${o.lead_count} leads gratis sin cobrar`,
      amountCents: o.total_value_cents,
      score: o.total_value_cents * leadBoost,
      ctaLabel: 'Pitchear',
      href: `/admin/editar/${o.place_id}`,
      payload: { type: 'pitch', opportunity: o },
    })
  }

  // 4. Sponsors at risk — paying but red health (renewal risk)
  for (const s of inputs.sponsors) {
    if (s.sponsor_weight === 0) continue
    const isRed = s.leads_30d === 0 && s.profile_completeness < 60
    if (!isRed) continue
    // Vitrina annual = $799, treat as renewal risk amount
    const renewalRisk = 79900
    actions.push({
      type: 'sponsor_risk',
      id: `sponsor_${s.place_id}`,
      title: s.name,
      reason: `Sponsor sin leads 30d · perfil ${s.profile_completeness}%`,
      amountCents: renewalRisk,
      score: renewalRisk * 1.2, // mid priority — renewal risk
      ctaLabel: 'Revisar',
      href: `/admin/editar/${s.place_id}`,
      payload: { type: 'sponsor_risk', sponsor: s },
    })
  }

  return actions.sort((a, b) => b.score - a.score)
}
