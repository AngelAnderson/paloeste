import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { OpsCard } from './ops-card'

export const dynamic = 'force-dynamic'

export default async function OpsPage() {
  const supabase = await createSupabaseAdminClient()

  const [{ data: pending }, { data: recent }] = await Promise.all([
    supabase.from('ops_queue').select('*').eq('status', 'pending').order('created_at', { ascending: true }),
    supabase.from('ops_queue').select('*').in('status', ['approved', 'reverted', 'dismissed', 'failed']).order('resolved_at', { ascending: false }).limit(10),
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Ops caborojo.com</h1>
        <p className="text-sm text-gray-500">
          Drafts que el executor nocturno dejó listos. Apruebas viendo el cambio, se publica al momento, y todo es revertible.
        </p>
      </div>

      {pending && pending.length > 0 ? (
        <div className="space-y-4">{pending.map((item) => <OpsCard key={item.id} item={item} />)}</div>
      ) : (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
          Nada esperando tu dale. El executor corre todas las noches a las 6:30am.
        </div>
      )}

      {recent && recent.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold uppercase text-gray-500">Últimos resueltos</h2>
          <div className="space-y-2">
            {recent.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm">
                <span className="text-gray-700">{item.title}</span>
                <span className={item.status === 'approved' ? 'text-green-700' : item.status === 'failed' ? 'text-red-700' : 'text-gray-500'}>
                  {item.status === 'approved' ? '✅ publicado' : item.status === 'reverted' ? '↩️ revertido' : item.status === 'failed' ? '⚠️ falló' : '— descartado'}
                </span>
              </div>
            ))}
          </div>
          {recent.some((i) => i.status === 'approved') && <RevertList items={recent.filter((i) => i.status === 'approved')} />}
        </div>
      )}
    </div>
  )
}

function RevertList({ items }: { items: any[] }) {
  return (
    <div className="mt-3 space-y-3">
      <h3 className="text-xs font-semibold uppercase text-gray-400">Publicados (revertibles)</h3>
      {items.map((item) => <OpsCard key={`r-${item.id}`} item={item} />)}
    </div>
  )
}
