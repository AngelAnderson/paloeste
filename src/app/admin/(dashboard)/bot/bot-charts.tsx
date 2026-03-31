'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts'

export function DailyVolumeChart({ data }: { data: { day: string; inbound: number; outbound: number }[] }) {
  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
      <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">Daily Volume</h2>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="day" tick={{ fill: '#64748b', fontSize: 11 }} tickFormatter={(v) => new Date(v).toLocaleDateString('en', { weekday: 'short' })} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
          <Legend />
          <Bar dataKey="inbound" fill="#38bdf8" name="Inbound" radius={[4, 4, 0, 0]} />
          <Bar dataKey="outbound" fill="#a78bfa" name="Outbound" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function UserGrowthChart({ data }: { data: { month: string; new_users: number }[] }) {
  return (
    <div className="bg-[#1e293b] rounded-xl border border-[#334155] p-5">
      <h2 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">User Growth</h2>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 11 }} />
          <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
          <Line type="monotone" dataKey="new_users" stroke="#4ade80" strokeWidth={2} name="New Users" dot={{ fill: '#4ade80' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
