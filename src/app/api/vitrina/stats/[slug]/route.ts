import { NextResponse } from 'next/server'

export const revalidate = 300 // 5 minutes
export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.json({ error: 'not configured' }, { status: 503 })
  }

  const { getVitrinaStats } = await import('@/lib/vitrina-queries')
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
