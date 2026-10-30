import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { getInboxConversations } from '@/lib/admin-queries'
import { InboxView } from '@/components/admin/inbox/inbox-view'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Inbox 7711',
  manifest: '/inbox.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'Inbox 7711', statusBarStyle: 'black' },
  icons: { apple: '/inbox-icon-180.png' },
}

export const viewport: Viewport = {
  themeColor: '#0f172a',
  viewportFit: 'cover',
}

export default async function InboxPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams
  const requestHeaders = await headers()
  const standalone = requestHeaders.get('x-inbox-host') === '1'

  const [conversations, abierta] = await Promise.all([
    getInboxConversations({ attention: true }),
    c ? getInboxConversations({ id: c }) : Promise.resolve([]),
  ])

  return (
    <div className={standalone ? '' : '-m-4 lg:-m-6'}>
      <InboxView
        initialConversations={conversations}
        initialSelected={abierta[0] ?? null}
        standalone={standalone}
      />
    </div>
  )
}
