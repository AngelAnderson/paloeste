import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const action = body.action ?? 'Contacto'
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase.rpc('log_relationship_contact', {
    rel_id: id,
    action_text: action,
    notes_text: body.notes ?? null,
    logged_by_val: 'paloeste_admin',
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ history_id: data })
}
