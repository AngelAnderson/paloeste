'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { RevenueMonth } from '@/lib/types'

export function RevenueCharts({ data }: { data: RevenueMonth[] }) {
  const chartData = [...data].reverse().map(d => ({
    month: d.month,
    billed: d.billed_cents / 100,
    unbilled: d.unbilled_cents / 100,
  }))

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
          <YAxis stroke="#64748b" fontSize={12} tickFormatter={v => `$${v}`} />
          <Tooltip
            contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 13 }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value) => [`$${Number(value).toFixed(0)}`, '']}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
          <Bar dataKey="billed" name="Billed" fill="#4ade80" radius={[4, 4, 0, 0]} />
          <Bar dataKey="unbilled" name="Unbilled" fill="#f87171" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
