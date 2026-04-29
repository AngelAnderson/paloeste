import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const since = req.nextUrl.searchParams.get('since')
  if (!since || isNaN(new Date(since).getTime())) {
    return NextResponse.json({ error: 'invalid since' }, { status: 400 })
  }

  const supabase = await createSupabaseAdminClient()

  const [leads, inbound, prospects, events] = await Promise.allSettled([
    supabase
      .from('bot_leads')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', since),
    supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('line', '7711')
      .gt('last_message_at', since)
      .not('last_inbound_body', 'is', null),
    supabase
      .from('prospects')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', since),
    supabase
      .from('events')
      .select('id', { count: 'exact', head: true })
      .gt('created_at', since),
  ])

  const pickCount = (r: typeof leads): number => {
    if (r.status !== 'fulfilled') return 0
    return r.value.count ?? 0
  }

  return NextResponse.json({
    leads: pickCount(leads),
    inbound: pickCount(inbound),
    prospects: pickCount(prospects),
    events: pickCount(events),
    since,
  })
}
