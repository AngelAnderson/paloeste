import { getMessageFeedback } from '@/lib/admin-queries'

export const dynamic = 'force-dynamic'

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('es-PR', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default async function FeedbackPage() {
  const feedback = await getMessageFeedback('pending')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white">Respuestas marcadas</h1>
        <p className="text-[#94a3b8] text-sm mt-1">
          {feedback.length} respuesta{feedback.length === 1 ? '' : 's'} del bot pendiente{feedback.length === 1 ? '' : 's'} de revision
        </p>
      </div>

      {feedback.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-8 text-center">
          <p className="text-[#64748b] text-sm">No hay respuestas marcadas</p>
          <p className="text-[#64748b] text-xs mt-1">
            Marca respuestas malas del bot con el boton 🚩 en el inbox
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map(f => (
            <div key={f.id} className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#64748b]">
                <span>{formatDate(f.created_at)}</span>
                <span>{f.flagged_by || 'desconocido'}</span>
              </div>

              {f.original_body && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#64748b] mb-1">Respuesta original del bot</p>
                  <div className="bg-[#0f172a] border border-[#334155] rounded-lg p-2 text-xs text-[#94a3b8] whitespace-pre-wrap">
                    {f.original_body}
                  </div>
                </div>
              )}

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#f87171] mb-1">Por que estuvo mal</p>
                <p className="text-sm text-white">{f.reason}</p>
              </div>

              <div>
                <p className="text-[10px] uppercase tracking-wider text-[#4ade80] mb-1">Que deberia haber contestado</p>
                <p className="text-sm text-white whitespace-pre-wrap">{f.suggested_response}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
