import { RelationshipsList } from './relationships-list'
import { getRelationships, getOverdueRelationships } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

export default async function RelationshipsPage() {
  const [all, overdue] = await Promise.all([
    getRelationships({ activeOnly: true }),
    getOverdueRelationships(),
  ])
  return <RelationshipsList initial={all} initialOverdue={overdue} />
}
