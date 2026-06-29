import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin(req)
  if (denied) return denied
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
