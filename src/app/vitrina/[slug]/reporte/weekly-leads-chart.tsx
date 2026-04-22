'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export function WeeklyLeadsChart({ data }: { data: { week_start: string; lead_count: number }[] }) {
  const formatted = data.map((d) => ({
    week: new Date(d.week_start).toLocaleDateString('es-PR', { month: 'short', day: 'numeric' }),
    leads: d.lead_count,
  }))

  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={formatted}>
          <defs>
            <linearGradient id="leadGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }}
            labelStyle={{ color: '#94a3b8' }}
          />
          <Area type="monotone" dataKey="leads" stroke="#4ade80" fill="url(#leadGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
