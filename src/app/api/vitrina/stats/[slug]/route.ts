import { NextResponse } from 'next/server'
import { getVitrinaStats } from '@/lib/vitrina-queries'

export const revalidate = 300 // 5 minutes

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const stats = await getVitrinaStats(slug)

  if (!stats) {
    return NextResponse.json({ error: 'not found' }, { status: 404 })
  }

  return NextResponse.json(stats, {
    headers: {
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
    },
  })
}
