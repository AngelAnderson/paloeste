import { NextResponse } from 'next/server'
import {
  getUnbilledLeadsByBusiness,
  getConversionOpportunities,
  getSponsorROI,
  getPlacesMissingPhotos,
  getAdminOverview,
  getProspects,
  getBotIntelligence,
  getOverdueRelationships,
} from '@/lib/admin-queries'
import { getAdminBadges } from '@/lib/admin-badges'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

type Check = { name: string; status: 'ok' | 'fail'; reason?: string; warning?: string }

function isObj(v: unknown): v is Record<string, unknown> {
  return v != null && typeof v === 'object' && !Array.isArray(v)
}

async function run<T>(
  name: string,
  fn: () => Promise<T>,
  validator: (v: T) => string | { warning: string } | null,
): Promise<Check> {
  try {
    const v = await fn()
    const result = validator(v)
    if (result == null) return { name, status: 'ok' }
    if (typeof result === 'string') return { name, status: 'fail', reason: result }
    return { name, status: 'ok', warning: result.warning }
  } catch (e) {
    return { name, status: 'fail', reason: e instanceof Error ? e.message : String(e) }
  }
}

export async function GET(request: Request) {
  const expected = process.env.ADMIN_SMOKE_KEY
  if (!expected) {
    return NextResponse.json({ status: 'fail', reason: 'ADMIN_SMOKE_KEY not configured' }, { status: 500 })
  }

  const url = new URL(request.url)
  const provided = url.searchParams.get('key') ?? request.headers.get('x-smoke-key')
  if (provided !== expected) {
    return NextResponse.json({ status: 'fail', reason: 'unauthorized' }, { status: 401 })
  }

  const checks = await Promise.all([
    run('getUnbilledLeadsByBusiness', getUnbilledLeadsByBusiness, v => Array.isArray(v) ? null : 'expected array'),
    run('getConversionOpportunities', () => getConversionOpportunities(3), v => Array.isArray(v) ? null : 'expected array'),
    run('getSponsorROI', getSponsorROI, v => Array.isArray(v) ? null : 'expected array'),
    run('getPlacesMissingPhotos', getPlacesMissingPhotos, v => Array.isArray(v) ? null : 'expected array'),
    run('getAdminOverview', getAdminOverview, v => isObj(v) ? null : 'expected object'),
    run('getProspects', getProspects, v => Array.isArray(v) ? null : 'expected array'),
    run('getOverdueRelationships', getOverdueRelationships, v => Array.isArray(v) ? null : 'expected array'),
    run('getAdminBadges', getAdminBadges, v => isObj(v) ? null : 'expected object'),
    run('getBotIntelligence', () => getBotIntelligence(7), v => {
      if (v == null) return 'returned null'
      if (!isObj(v)) return 'not an object'
      const intel = v as Record<string, unknown>
      const missing: string[] = []
      if (!Array.isArray(intel.daily_volume)) missing.push('daily_volume')
      if (!Array.isArray(intel.top_queries)) missing.push('top_queries')
      if (!isObj(intel.fail_rate)) missing.push('fail_rate')
      if (missing.length > 0) {
        return { warning: `BotPulseCard hidden — RPC missing: ${missing.join(', ')}` }
      }
      return null
    }),
  ])

  const failed = checks.filter(c => c.status === 'fail')
  const warnings = checks.filter(c => c.warning)
  const status = failed.length > 0 ? 'fail' : warnings.length > 0 ? 'degraded' : 'ok'

  return NextResponse.json(
    { status, failed: failed.length, warnings: warnings.length, checks },
    { status: failed.length > 0 ? 500 : 200 },
  )
}
