import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// Cierra el loop acción→resultado: registra qué pasó con un DM enviado.
// Alimenta deals_closed → la alarma "0 DMs cerrados" + el termómetro del cockpit.
// Gateado por el proxy del admin (mismo que /api/send-message).
export async function POST(req: NextRequest) {
  const supabase = await createSupabaseAdminClient()
  const payload = await req.json().catch(() => ({}))
  const { business_name, contact_phone, outcome, amount, source, related_keyword } = payload

  if (!outcome || !['respondio', 'cerro', 'silencio'].includes(outcome)) {
    return NextResponse.json({ error: 'outcome inválido (respondio|cerro|silencio)' }, { status: 400 })
  }

  const { error } = await supabase.from('deals_closed').insert({
    business_name: business_name || null,
    contact_phone: contact_phone || null,
    outcome,
    amount: Number(amount) || 0,
    source: source || 'decisiones',
    related_keyword: related_keyword || null,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
