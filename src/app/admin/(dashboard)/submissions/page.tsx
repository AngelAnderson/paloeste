import { getContentSubmissions } from '@/lib/admin-queries'
import { SubmissionsView } from './submissions-view'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function SubmissionsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const filter = (status === 'published' || status === 'rejected' || status === 'archived' || status === 'all') ? status : 'pending'
  const submissions = await getContentSubmissions(filter)
  return <SubmissionsView submissions={submissions} filter={filter} />
}
