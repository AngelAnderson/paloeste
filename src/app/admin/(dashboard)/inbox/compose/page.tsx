import { createSupabaseAdminClient } from '@/lib/supabase-server'
import { ComposeForm } from '@/components/admin/inbox/compose-form'

export const dynamic = 'force-dynamic'

type SearchParams = {
  to?: string
  body?: string
  channel?: 'whatsapp' | 'sms'
  context_id?: string
}

async function lookupContact(phoneRaw: string) {
  const supabase = await createSupabaseAdminClient()
  const phone = phoneRaw.replace(/[^+\d]/g, '')
  const phoneE164 = phone.startsWith('+') ? phone : `+1${phone}`
  const phoneDigits = phoneE164.replace(/\D/g, '')

  const [placeRes, relationshipRes, lastMsgRes] = await Promise.all([
    supabase
      .from('places')
      .select('id, name, category, slug')
      .or(`phone.eq.${phoneE164},phone.eq.${phoneDigits}`)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('relationships')
      .select('id, name, type, notes, last_contact_at')
      .or(`contact_phone.eq.${phoneE164},contact_phone.eq.${phoneDigits}`)
      .limit(1)
      .maybeSingle(),
    supabase
      .from('messages')
      .select('body, direction, created_at')
      .or(`from.eq.${phoneE164},to.eq.${phoneE164},from.eq.whatsapp:${phoneE164},to.eq.whatsapp:${phoneE164}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    phoneE164,
    place: placeRes.data,
    relationship: relationshipRes.data,
    lastMessage: lastMsgRes.data,
  }
}

export default async function ComposePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const to = params.to || ''
  const initialBody = params.body || ''
  const channel = params.channel === 'sms' ? 'sms' : 'whatsapp'
  const contextId = params.context_id || null

  const contact = to ? await lookupContact(to) : null

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-1">Compose</h1>
        <p className="text-sm text-[#64748b]">Enviar desde *7711 (787-417-7711)</p>
      </div>

      <ComposeForm
        initialTo={contact?.phoneE164 || to}
        initialBody={initialBody}
        initialChannel={channel}
        contextId={contextId}
        contactName={contact?.relationship?.name || contact?.place?.name || null}
        contactType={contact?.relationship?.type || (contact?.place ? 'business' : null)}
        contactNotes={contact?.relationship?.notes || null}
        lastMessage={contact?.lastMessage || null}
        placeSlug={contact?.place?.slug || null}
      />
    </div>
  )
}
