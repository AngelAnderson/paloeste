'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'

const PlacesAuditView = dynamic(() => import('./places-audit'), { loading: () => <Loading /> })
const EditarView = dynamic(() => import('../editar/page').then(m => ({ default: m.default })), { loading: () => <Loading /> })

const TABS = [
  { key: 'audit', label: 'Auditoría', icon: '📊' },
  { key: 'editar', label: 'Editar', icon: '✏️' },
] as const

type Tab = typeof TABS[number]['key']

export default function DirectorioPage() {
  const [tab, setTab] = useState<Tab>('audit')

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Directorio</h1>
          <p className="text-[#64748b] text-sm">Auditoría, edición, y gaps del directorio</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 bg-[#1e293b] rounded-lg p-1 w-fit">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-[#38bdf8]/10 text-[#38bdf8]'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 'audit' && <PlacesAuditView />}
      {tab === 'editar' && <EditarView />}
    </div>
  )
}

function Loading() {
  return <div className="text-[#64748b] text-sm py-12 text-center">Cargando...</div>
}
