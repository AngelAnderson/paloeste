import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ ok: false, error: 'Supabase env vars missing' }, { status: 500 })
  }

  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/admin-fix?action=embeddings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Fetch failed' },
      { status: 500 }
    )
  }
}
