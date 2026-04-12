import { NextRequest, NextResponse } from 'next/server'
import { updateConversationStatus } from '@/lib/admin-queries'

export async function PATCH(req: NextRequest) {
  const { conversationId, status } = await req.json()
  if (!conversationId || !status) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  await updateConversationStatus(conversationId, status)
  return NextResponse.json({ success: true })
}
