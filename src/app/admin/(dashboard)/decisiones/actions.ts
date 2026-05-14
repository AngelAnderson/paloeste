'use server'

import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

interface ExecutionResult {
  ok: boolean
  message: string
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
