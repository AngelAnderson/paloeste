import { Suspense } from 'react'
import Worker from './Worker'

export const metadata = {
  title: 'Tareas — PalOeste',
  robots: { index: false, follow: false },
  referrer: 'no-referrer' as const,
}

export default function TareasPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, fontFamily: 'sans-serif' }}>Cargando…</div>}>
      <Worker />
    </Suspense>
  )
}
