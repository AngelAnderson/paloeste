import { getBusinessEdits } from '@/lib/admin-queries'
import { EditsView } from './edits-view'

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{ status?: string }>
}

export default async function EditsPage({ searchParams }: Props) {
  const { status } = await searchParams
  const filter = (status === 'applied' || status === 'rejected' || status === 'all') ? status : 'pending'
  const edits = await getBusinessEdits(filter)
  return <EditsView edits={edits} filter={filter} />
}
