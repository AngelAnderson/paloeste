import { getOverdueRelationships, getUnbilledLeadsByBusiness, getConversionOpportunities, getProspects, getPlacesMissingPhotos } from '@/lib/admin-queries'
import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { clasificarBandejas } from '@/lib/bandejas'
import { BandejasView } from './bandejas-view'
import { Termometro, type Termo } from './termometro'
import { DecisionesHoy } from './decisiones-hoy'

// Ventana de envío de DMs: Lun-Vie 9am a antes de 5pm AT (regla Angel 2026-06-21).
function ventanaEnvio(): { open: boolean; reason: string } {
  const at = new Date(Date.now() - 4 * 3600 * 1000) // AT = UTC-4 (sin DST en PR)
  const dow = at.getUTCDay() // 0=dom .. 6=sáb
  const hour = at.getUTCHours()
  const weekday = dow >= 1 && dow <= 5
  if (!weekday) return { open: false, reason: 'Fin de semana — los DMs se mandan Lun-Vie 9am a 5pm.' }
  if (hour < 9) return { open: false, reason: 'Muy temprano — la ventana abre a las 9am (Lun-Vie).' }
  if (hour >= 17) return { open: false, reason: 'Pasó la ventana — los DMs se mandan antes de las 5pm.' }
  return { open: true, reason: '' }
}

export const dynamic = 'force-dynamic'

export default async function HoyPage() {
  const supabase = await createSupabaseAdminClient()

  const [overdueRels, unbilled, opportunities, prospects, missingPhotos, counts, noeliaTasks, relsSinPhone, prospectsSinFecha] = await Promise.all([
    getOverdueRelationships().catch(() => []),
    getUnbilledLeadsByBusiness().catch(() => []),
    getConversionOpportunities(3).catch(() => []),
    getProspects().catch(() => []),
    getPlacesMissingPhotos().catch(() => []),
    Promise.resolve(supabase.rpc('get_admin_badge_counts')).then(r => (r.data || {}) as Record<string, number>).catch(() => ({} as Record<string, number>)),
    Promise.resolve(supabase.from('noelia_tasks').select('id', { count: 'exact', head: true }).not('status', 'in', '("done","archived")')).then(r => r.count || 0).catch(() => 0),
    Promise.resolve(supabase.from('relationships').select('id', { count: 'exact', head: true }).eq('active', true).or('contact_phone.is.null,contact_phone.eq.')).then(r => r.count || 0).catch(() => 0),
    Promise.resolve(supabase.from('prospects').select('id', { count: 'exact', head: true }).in('stage', ['lead', 'contacted', 'pitched', 'negotiating']).is('next_action_date', null)).then(r => r.count || 0).catch(() => 0),
  ])

  const bandejas = clasificarBandejas({
    overdueRels,
    unbilled,
    opportunities,
    prospects,
    needsHumanCount: counts.inbox || 0,
    pendingSubmissions: counts.submissions || 0,
    pendingEdits: counts.edits || 0,
    pendingDecisions: counts.decisiones || 0,
    missingPhotos,
    noeliaTasksOpen: noeliaTasks,
    relsSinPhone,
    prospectsSinFecha,
  })

  const termo = await Promise.resolve(supabase.rpc('get_cockpit_termometro'))
    .then(r => r.data as Termo | null)
    .catch(() => null)

  const ventana = ventanaEnvio()

  return (
    <>
      {termo && <Termometro t={termo} />}
      <DecisionesHoy windowOpen={ventana.open} reason={ventana.reason} />
      <BandejasView bandejas={bandejas} />
    </>
  )
}
