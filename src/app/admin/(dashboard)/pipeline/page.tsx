import { getProspects } from '@/lib/admin-queries'
import { PipelineBoard } from './pipeline-board'

export const dynamic = 'force-dynamic'

export default async function PipelinePage() {
  const prospects = await getProspects()
  return <PipelineBoard initialProspects={prospects} />
}
