import { NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createSupabaseAdminClient()
  const { data, error } = await supabase
    .from('relationship_history')
    .select('*')
    .eq('relationship_id', id)
    .order('logged_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
