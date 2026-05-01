#!/usr/bin/env node
// Hits /api/admin/_smoke on a deployed paloeste and exits non-zero on failure.
// Usage:
//   ADMIN_SMOKE_KEY=xxx npm run smoke
//   SMOKE_URL=https://preview.vercel.app ADMIN_SMOKE_KEY=xxx npm run smoke

const baseUrl = process.env.SMOKE_URL ?? 'https://www.paloeste.com'
const key = process.env.ADMIN_SMOKE_KEY

if (!key) {
  console.error('ADMIN_SMOKE_KEY env var is required')
  process.exit(2)
}

const url = `${baseUrl.replace(/\/$/, '')}/api/admin/smoke?key=${encodeURIComponent(key)}`
console.log(`GET ${baseUrl}/api/admin/smoke`)

const res = await fetch(url, { headers: { 'cache-control': 'no-store' } })
const body = await res.json().catch(() => ({ status: 'fail', reason: 'non-json response' }))

console.log(JSON.stringify(body, null, 2))

if (!res.ok) {
  console.error(`\n✗ smoke failed (HTTP ${res.status})`)
  process.exit(1)
}

if (body.status === 'degraded') {
  console.warn(`\n⚠ smoke degraded — ${body.warnings} warning(s)`)
  process.exit(0)
}

console.log('\n✓ smoke ok')
