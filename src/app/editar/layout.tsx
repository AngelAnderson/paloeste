import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Editor de Directorio',
  robots: 'noindex',
}

export default function EditarLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAF7]">
      {children}
    </div>
  )
}
