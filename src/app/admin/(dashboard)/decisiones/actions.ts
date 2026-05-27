'use server'

import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

interface ExecutionResult {
  ok: boolean
  message: string
}

function formatJsonBlock(label: string, value: unknown): string {
  if (value == null) return ''
  try {
    return `\n\n${label}:\n${JSON.stringify(value, null, 2)}`
  } catch {
    return `\n\n${label}:\n${String(value)}`
  }
}

function actionTypeForProposal(proposalType: string): string {
  switch (proposalType) {
    case 'collect_unbilled_leads':
      return 'review_and_collect'
    case 'follow_up_prospect':
      return 'contact_prospect'
    case 'answer_inbox':
      return 'open_inbox'
    case 'fix_search_match':
      return 'fix_search_quality'
    case 'source_directory_supply':
      return 'source_directory_supply'
    case 'review_bot_feedback':
      return 'review_bot_feedback'
    case 'refresh_place_data':
      return 'verify_place_data'
    case 'activate_sponsor':
      return 'pitch_vitrina'
    default:
      return `mission_control_${proposalType || 'manual'}`
  }
}

function buildDecisionPreview(proposal: {
  title: string
  rationale: string
  proposal_type: string
  target_table: string | null
  target_id: string | null
  evidence: unknown
  proposed_patch: unknown
  rollback_plan: string | null
}): string {
  const patch = proposal.proposed_patch as { suggested_next_steps?: unknown; suggested_message?: unknown; suggested_post?: unknown } | null
  const nextSteps = Array.isArray(patch?.suggested_next_steps)
    ? `\n\nPróximos pasos:\n${patch.suggested_next_steps.map((s, i) => `${i + 1}. ${String(s)}`).join('\n')}`
    : ''
  const suggested = patch?.suggested_message
    ? `\n\nMensaje sugerido:\n${String(patch.suggested_message)}`
    : patch?.suggested_post
      ? `\n\nPost sugerido:\n${String(patch.suggested_post)}`
      : ''

  return [
    `Mission Control: ${proposal.title}`,
    '',
    proposal.rationale,
    proposal.target_table ? `\nTarget: ${proposal.target_table}${proposal.target_id ? `/${proposal.target_id}` : ''}` : '',
    nextSteps,
    suggested,
    proposal.rollback_plan ? `\n\nRegla de seguridad:\n${proposal.rollback_plan}` : '',
    formatJsonBlock('Evidencia', proposal.evidence),
    formatJsonBlock('Proposed patch', proposal.proposed_patch),
  ].filter(Boolean).join('\n')
}

async function createDecisionFromProposal(
  supabase: Awaited<ReturnType<typeof createSupabaseAdminClient>>,
  proposal: {
    id: string
    title: string
    rationale: string
    proposal_type: string
    target_table: string | null
    target_id: string | null
    evidence: unknown
    proposed_patch: unknown
    rollback_plan: string | null
    risk_level: string
  },
): Promise<ExecutionResult> {
  const actionType = actionTypeForProposal(proposal.proposal_type)
  const context = {
    source: 'mission_control',
    proposal_id: proposal.id,
    proposal_type: proposal.proposal_type,
    risk_level: proposal.risk_level,
    target_table: proposal.target_table,
    target_id: proposal.target_id,
    evidence: proposal.evidence,
  }
  const payload = {
    source: 'mission_control',
    proposal_id: proposal.id,
    title: proposal.title,
    rationale: proposal.rationale,
    proposed_patch: proposal.proposed_patch,
    rollback_plan: proposal.rollback_plan,
  }

  const { data: existing, error: existingErr } = await supabase
    .from('cartera_decisions')
    .select('id, decision')
    .eq('agent_id', 'daily-learning-gaps')
    .contains('context_jsonb', { proposal_id: proposal.id })
    .limit(1)
    .maybeSingle()

  if (existingErr) return { ok: false, message: existingErr.message }
  if (existing) return { ok: true, message: `decision already queued #${existing.id}` }

  const { data: inserted, error } = await supabase
    .from('cartera_decisions')
    .insert({
      agent_id: 'daily-learning-gaps',
      tenant_id: 'veci',
      action_type: actionType,
      preview: buildDecisionPreview(proposal),
      context_jsonb: context,
      payload_jsonb: payload,
    })
    .select('id')
    .single()

  if (error) return { ok: false, message: error.message }
  return { ok: true, message: `queued as decision #${inserted.id}` }
}

async function executePayload(actionType: string, payload: Record<string, unknown>): Promise<ExecutionResult> {
  // Phase 3 v1: support send_wa (Twilio) + send_email (Resend). Other action types
  // (publish_fb, publish_blog, db_mutation, pay, commit_code, contact_lead) return
  // "manual: copy preview" so Angel can paste outside; we mark them executed=true
  // in DB so they leave the inbox.
  try {
    switch (actionType) {
      case 'send_wa': {
        const to = String(payload.to ?? '')
        const body = String(payload.body ?? '')
        const from = String(payload.from ?? 'whatsapp:+17874177711')
        if (!to || !body) return { ok: false, message: 'missing to/body' }
        const sid = process.env.TWILIO_ACCOUNT_SID || process.env.TWILIO_SID || ''
        const token = process.env.TWILIO_AUTH_TOKEN || ''
        if (!sid || !token) return { ok: false, message: 'Twilio creds missing' }
        const auth = Buffer.from(`${sid}:${token}`).toString('base64')
        const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({ From: from, To: to.startsWith('whatsapp:') ? to : `whatsapp:${to}`, Body: body }),
        })
        if (!res.ok) {
          const errText = await res.text()
          return { ok: false, message: `Twilio ${res.status}: ${errText.slice(0, 150)}` }
        }
        const json = await res.json() as { sid?: string }
        return { ok: true, message: `Twilio sid=${json.sid || 'ok'}` }
      }

      case 'send_email': {
        const to = String(payload.to ?? '')
        const subject = String(payload.subject ?? '')
        const html = String(payload.html ?? payload.body ?? '')
        const from = String(payload.from ?? process.env.DIGEST_FROM_EMAIL ?? 'noreply@angelanderson.com')
        const apiKey = process.env.RESEND_API_KEY || ''
        if (!apiKey) return { ok: false, message: 'RESEND_API_KEY missing' }
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [to], subject, html }),
        })
        if (!res.ok) {
          const errText = await res.text()
          return { ok: false, message: `Resend ${res.status}: ${errText.slice(0, 150)}` }
        }
        const json = await res.json() as { id?: string }
        return { ok: true, message: `Resend id=${json.id || 'ok'}` }
      }

      default:
        // Manual action types — Angel copy/paste from preview. Mark executed.
        return { ok: true, message: 'manual action — preview ready to copy' }
    }
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message.slice(0, 150) : String(err).slice(0, 150) }
  }
}

export async function approveDecision(id: number): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseAdminClient()

  const { data: decision, error: fetchErr } = await supabase
    .from('cartera_decisions')
    .select('id, action_type, payload_jsonb, decision')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr || !decision) return { ok: false, message: 'decision not found' }
  if (decision.decision) return { ok: false, message: `already ${decision.decision}` }

  const payload = (decision.payload_jsonb || {}) as Record<string, unknown>
  const result = await executePayload(decision.action_type as string, payload)

  const { error: updateErr } = await supabase
    .from('cartera_decisions')
    .update({
      decision: 'approved',
      reviewed_at: new Date().toISOString(),
      final_payload_jsonb: payload,
      executed_at: result.ok ? new Date().toISOString() : null,
      execution_result: result.message,
    })
    .eq('id', id)

  if (updateErr) return { ok: false, message: updateErr.message }

  revalidatePath('/admin/decisiones')
  return { ok: result.ok, message: result.message }
}

export async function editDecision(id: number, newText: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseAdminClient()

  const { data: decision, error: fetchErr } = await supabase
    .from('cartera_decisions')
    .select('id, action_type, payload_jsonb, preview, decision')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr || !decision) return { ok: false, message: 'decision not found' }
  if (decision.decision) return { ok: false, message: `already ${decision.decision}` }

  // Build edited payload: replace `body` (WA), `html`/`body` (email), or just the preview text.
  const oldPayload = (decision.payload_jsonb || {}) as Record<string, unknown>
  const newPayload: Record<string, unknown> = { ...oldPayload }
  switch (decision.action_type as string) {
    case 'send_wa':
      newPayload.body = newText
      break
    case 'send_email':
      newPayload.html = newText
      newPayload.body = newText
      break
    default:
      newPayload.body = newText
      break
  }

  const result = await executePayload(decision.action_type as string, newPayload)

  const { error: updateErr } = await supabase
    .from('cartera_decisions')
    .update({
      decision: 'edited',
      reviewed_at: new Date().toISOString(),
      final_payload_jsonb: newPayload,
      executed_at: result.ok ? new Date().toISOString() : null,
      execution_result: result.message,
    })
    .eq('id', id)

  if (updateErr) return { ok: false, message: updateErr.message }

  revalidatePath('/admin/decisiones')
  return { ok: result.ok, message: result.message }
}

export async function rejectDecision(id: number, reason?: string): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseAdminClient()

  const { data: decision, error: fetchErr } = await supabase
    .from('cartera_decisions')
    .select('id, decision')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr || !decision) return { ok: false, message: 'decision not found' }
  if (decision.decision) return { ok: false, message: `already ${decision.decision}` }

  const { error: updateErr } = await supabase
    .from('cartera_decisions')
    .update({
      decision: 'rejected',
      reviewed_at: new Date().toISOString(),
      execution_result: reason ? `rejected: ${reason}` : 'rejected',
    })
    .eq('id', id)

  if (updateErr) return { ok: false, message: updateErr.message }

  revalidatePath('/admin/decisiones')
  return { ok: true, message: 'rejected' }
}

export async function reviewAgentProposal(
  id: string,
  status: 'approved' | 'rejected' | 'applied',
  notes?: string,
): Promise<{ ok: boolean; message: string }> {
  const supabase = await createSupabaseAdminClient()

  const { data: proposal, error: fetchErr } = await supabase
    .from('agent_proposals')
    .select('id,status,title,rationale,proposal_type,target_table,target_id,evidence,proposed_patch,rollback_plan,risk_level')
    .eq('id', id)
    .maybeSingle()
  if (fetchErr || !proposal) return { ok: false, message: 'proposal not found' }

  const current = proposal.status as string
  if (!['draft', 'needs_review', 'approved'].includes(current)) {
    return { ok: false, message: `already ${current}` }
  }
  if (status === 'approved' && current === 'approved') {
    return { ok: false, message: 'already approved' }
  }

  let queueResult: ExecutionResult | null = null
  if (status === 'approved') {
    queueResult = await createDecisionFromProposal(supabase, proposal)
    if (!queueResult.ok) return queueResult
  }

  const now = new Date().toISOString()
  const { error: updateErr } = await supabase
    .from('agent_proposals')
    .update({
      status,
      reviewer: 'angel',
      review_notes: notes?.trim() || null,
      applied_at: status === 'applied' ? now : null,
      updated_at: now,
    })
    .eq('id', id)

  if (updateErr) return { ok: false, message: updateErr.message }

  revalidatePath('/admin/decisiones')
  return { ok: true, message: queueResult ? `${status}; ${queueResult.message}` : status }
}
