import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

// Quick-action flags for inbox conversations.
// PATCH body: { conversationId: string, action: 'star' | 'unstar' | 'snooze' | 'unsnooze' |
//   'awaiting' | 'unawaiting' | 'resolve' | 'reopen', snoozeDays?: number }
// Apr 29 2026 — added with the inbox quick-actions feature so Angel can mark each
// conversation's state without typing. State persists in conversations columns.
export async function PATCH(req: NextRequest) {
  const supabase = await createSupabaseAdminClient()
  const { conversationId, action, snoozeDays } = await req.json()
  if (!conversationId || !action) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const update: Record<string, unknown> = {}
  switch (action) {
    case 'star':       update.is_starred = true; break
    case 'unstar':     update.is_starred = false; break
    case 'snooze':     {
      const days = Math.max(1, Math.min(snoozeDays ?? 3, 30))
      update.snoozed_until = new Date(Date.now() + days * 86400000).toISOString()
      break
    }
    case 'unsnooze':   update.snoozed_until = null; break
    case 'awaiting':   update.awaiting_info = true; break
    case 'unawaiting': update.awaiting_info = false; break
    case 'resolve':    update.resolved_at = new Date().toISOString(); update.status = 'closed'; break
    case 'reopen':     update.resolved_at = null; update.status = 'human'; break
    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  }

  const { error } = await supabase
    .from('conversations')
    .update(update)
    .eq('id', conversationId)

  if (error) {
    console.error('[inbox/flag] update failed:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, action, applied: update })
}
