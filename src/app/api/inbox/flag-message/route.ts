import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseAdminClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  // Identify the user who's flagging
  const userClient = await createSupabaseServerClient()
  const { data: { user } } = await userClient.auth.getUser()

  const { messageId, conversationId, reason, suggestedResponse, originalBody } = await req.json()
  if (!messageId || !conversationId || !reason || !suggestedResponse) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const supabase = await createSupabaseAdminClient()
  const { error } = await supabase.from('message_feedback').insert({
    message_id: messageId,
    conversation_id: conversationId,
    flagged_by: user?.email || 'unknown',
    reason,
    suggested_response: suggestedResponse,
    original_body: originalBody || null,
    status: 'pending',
  })

  if (error) {
    console.error('[flag-message] Insert failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
