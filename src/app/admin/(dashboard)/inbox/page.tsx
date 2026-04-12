import { getInboxConversations } from '@/lib/admin-queries'
import { InboxView } from '@/components/admin/inbox/inbox-view'

export const dynamic = 'force-dynamic'

export default async function InboxPage() {
  const conversations = await getInboxConversations()

  return (
    <div className="-m-4 lg:-m-6">
      <InboxView initialConversations={conversations} />
    </div>
  )
}
