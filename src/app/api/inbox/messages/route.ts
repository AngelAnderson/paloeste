import { NextRequest, NextResponse } from 'next/server'
import { getConversationMessages, getInboxContact } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const conversationId = req.nextUrl.searchParams.get('conversationId')
  if (!conversationId) return NextResponse.json({ error: 'Missing conversationId' }, { status: 400 })

  const contactId = req.nextUrl.searchParams.get('contactId')
  const phone = req.nextUrl.searchParams.get('phone')

  const [messages, contact] = await Promise.all([
    getConversationMessages(conversationId),
    contactId ? getInboxContact(contactId) : Promise.resolve(null),
  ])

  // Fetch demand data for this contact's phone
  let demandData: { total_queries: number; categories: string[]; recent_queries: string[] } | null = null
  if (phone) {
    try {
      const supabase = await createSupabaseAdminClient()
      const { data } = await supabase
        .from('demand_signals')
        .select('query_text, category, created_at')
        .like('user_hash', `%${phone.slice(-4)}%`)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data && data.length > 0) {
        const categories = [...new Set(data.map(d => d.category).filter(Boolean))]
        const recentQueries = [...new Set(data.map(d => d.query_text).filter(Boolean))].slice(0, 5)
        demandData = {
          total_queries: data.length,
          categories,
          recent_queries: recentQueries,
        }
      }
    } catch { /* demand data is optional */ }
  }

  return NextResponse.json({ messages, contact, demandData })
}
