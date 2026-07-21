'use server'

import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

const EXECUTOR_URL = 'https://vprjteqgmanntvisjrvp.supabase.co/functions/v1/caborojo-ops-executor'

async function callExecutor(action: 'apply' | 'revert', id: string): Promise<{ ok: boolean; message: string }> {
  const key = process.env.OPS_ADMIN_KEY
  if (!key) return { ok: false, message: 'OPS_ADMIN_KEY missing' }
  try {
    const r = await fetch(`${EXECUTOR_URL}?action=${action}&id=${encodeURIComponent(id)}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(25000),
    })
    const body = await r.json().catch(() => ({}))
    if (!r.ok || !body.ok) return { ok: false, message: body.error || `HTTP ${r.status}` }
    return { ok: true, message: action === 'apply' ? `Publicado: ${body.url}` : 'Revertido al contenido anterior.' }
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) }
  }
}

const AUTO_THRESHOLD = 5 // aprobaciones seguidas → el action_type gana auto-publish

async function getItemKind(id: string): Promise<{ kind: string; title: string } | null> {
  const supabase = await createSupabaseAdminClient()
  const { data } = await supabase.from('ops_queue').select('kind, title').eq('id', id).single()
  return data
}

// Escalera de confianza: cada decisión de Angel entrena al agente.
async function trustUp(actionType: string) {
  const supabase = await createSupabaseAdminClient()
  const { data: t } = await supabase.from('ops_trust').select('*').eq('action_type', actionType).single()
  const streak = (t?.streak || 0) + 1
  const level = streak >= AUTO_THRESHOLD ? 'auto' : (t?.level || 'draft')
  await supabase.from('ops_trust').upsert({ action_type: actionType, streak, level, updated_at: new Date().toISOString() })
  return { streak, level }
}

async function trustDown(actionType: string, lesson: string, source: 'revert' | 'dismiss') {
  const supabase = await createSupabaseAdminClient()
  await supabase.from('ops_trust').upsert({ action_type: actionType, streak: 0, level: 'draft', updated_at: new Date().toISOString() })
  await supabase.from('ops_agent_memory').insert({ lesson, source })
}

export async function approveOpsItem(id: string) {
  const item = await getItemKind(id)
  const res = await callExecutor('apply', id)
  if (res.ok && item) {
    const t = await trustUp(item.kind)
    if (t.level === 'auto' && t.streak === AUTO_THRESHOLD) {
      res.message += ` · ${item.kind} ganó auto-publish (${t.streak} aprobaciones seguidas).`
    }
  }
  revalidatePath('/admin/ops')
  return res
}

export async function revertOpsItem(id: string) {
  const item = await getItemKind(id)
  const res = await callExecutor('revert', id)
  if (res.ok && item) {
    await trustDown(item.kind, `Angel revirtió: "${item.title}". Revisar qué falló en ese draft antes de proponer algo parecido.`, 'revert')
  }
  revalidatePath('/admin/ops')
  return res
}

// Memoria manual: Angel le enseña una lección directa al agente.
export async function teachLesson(lesson: string) {
  const clean = lesson.trim().slice(0, 500)
  if (!clean) return { ok: false, message: 'Escribe la lección primero.' }
  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase.from('ops_agent_memory').insert({ lesson: clean, source: 'manual' })
  revalidatePath('/admin/ops')
  return { ok: !error, message: error ? error.message : 'Aprendida. Entra al prompt de la próxima corrida.' }
}

// Editar el texto de una respuesta antes de publicarla (la edición también enseña).
export async function editReplyText(id: string, newText: string) {
  const clean = newText.trim()
  if (!clean) return { ok: false, message: 'La respuesta no puede quedar vacía.' }
  const supabase = await createSupabaseAdminClient()
  const { data: item } = await supabase.from('ops_queue').select('payload, status').eq('id', id).single()
  if (!item || item.status !== 'pending') return { ok: false, message: 'Item no editable.' }
  const original = item.payload.reply_text
  const { error } = await supabase.from('ops_queue').update({ payload: { ...item.payload, reply_text: clean } }).eq('id', id)
  if (!error && original && original !== clean) {
    await supabase.from('ops_agent_memory').insert({
      lesson: `Angel editó una respuesta a vecino. Original: "${String(original).slice(0, 150)}" → Suya: "${clean.slice(0, 150)}". Imitar su versión.`,
      source: 'manual',
    })
  }
  revalidatePath('/admin/ops')
  return { ok: !error, message: error ? error.message : 'Editada.' }
}

export async function dismissOpsItem(id: string) {
  const item = await getItemKind(id)
  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase
    .from('ops_queue')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
  if (!error && item && item.kind !== 'note') {
    await trustDown(item.kind, `Angel descartó: "${item.title}". Ese tipo de propuesta no le sirvió; no repetir sin razón nueva.`, 'dismiss')
  }
  revalidatePath('/admin/ops')
  return { ok: !error, message: error ? error.message : 'Descartado.' }
}
