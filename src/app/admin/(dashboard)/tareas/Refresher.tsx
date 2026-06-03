'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// Light live-refresh: re-fetch the server component every N seconds.
export default function Refresher({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter()
  useEffect(() => {
    const i = setInterval(() => router.refresh(), seconds * 1000)
    return () => clearInterval(i)
  }, [router, seconds])
  return null
}
