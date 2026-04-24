'use client'

export default function VitrinaError({
  error,
}: {
  error: Error & { digest?: string }
}) {
  console.error('VitrinaError boundary caught:', error.message, error.digest)
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold">Error loading vitrina</h1>
        <p className="text-stone-500">{error.message}</p>
        {error.digest && <p className="text-xs text-stone-400">Digest: {error.digest}</p>}
      </div>
    </div>
  )
}
