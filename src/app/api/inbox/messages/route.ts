import { NextRequest, NextResponse } from 'next/server'
import { getConversationMessages, getInboxContact } from '@/lib/admin-queries'

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId')
  if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

  const contactId = req.nextUrl.searchParams.get('contactId')

  const [messages, contact] = await Promise.all([
    getConversationMessages(conversationId),
    contactId ? getInboxContact(contactId) : Promise.resolve(null),
  ])

  return NextResponse.json({ messages, contact })
}
