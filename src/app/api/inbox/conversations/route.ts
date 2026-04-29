import { NextRequest, NextResponse } from 'next/server'
import { getInboxConversations } from '@/lib/admin-queries'

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const conversations = await getInboxConversations({
    needsHuman: params.get('needsHuman') === '1' || undefined,
    channel: params.get('channel') || undefined,
    search: params.get('search') || undefined,
    starred: params.get('starred') === '1' || undefined,
    awaiting: params.get('awaiting') === '1' || undefined,
    resolved: params.get('resolved') === '1' || undefined,
  })

  return NextResponse.json({ conversations })
}
