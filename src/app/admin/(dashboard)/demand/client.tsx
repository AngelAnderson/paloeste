"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { UserPlus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface BizInsight {
  name: string;
  id: string;
  times_recommended: number;
  unique_users: number;
  category: string;
  plan: string;
  phone: string;
  is_featured: boolean;
  is_free: boolean;
  estimated_value_usd: number;
}

interface Insights {
  summary: {
    total_signals: number;
    unique_queries: number;
    unique_users: number;
    total_businesses: number;
    paying_sponsors: number;
    date_range: { first: string; last: string };
  };
  money_on_table: BizInsight[];
  unmet_categories: {
    category: string;
    demand: number;
    unique_terms: number;
    supply: number;
    paying: number;
  }[];
  top_queries: {
    query: string;
    count: number;
    users: number;
    category: string;
    top_result: string;
  }[];
  heatmap: { day: number; hour: number; count: number }[];
  weekly_trend: { week: string; queries: number; users: number }[];
}

const DAYS = ["Dom", "Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];
const CAT_ES: Record<string, string> = {
  SERVICE: "Servicios",
  FOOD: "Comida",
  HEALTH: "Salud",
  SHOPPING: "Tiendas",
  LOGISTICS: "Transporte",
  BEACH: "Playas",
};

export function DemandDashboardClient({
  insights,
  csvString,
}: {
  insights: Insights;
  csvString: string;
}) {
  const [tab, setTab] = useState<"money" | "queries" | "timing">("money");
  const [addedToPipeline, setAddedToPipeline] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState<string | null>(null);
  const data = insights;
  const s = data.summary;

  const handleAddToPipeline = useCallback(async (biz: BizInsight) => {
    setAdding(biz.id);
    try {
      const res = await fetch("/api/admin/prospects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          place_id: biz.id,
          business_name: biz.name,
          contact_phone: biz.phone || null,
          stage: "lead",
          proposed_plan: "Vitrina Básica",
          proposed_amount_cents: 79900,
          notes: `Added from demand tab. ${biz.times_recommended} recommendations, ${biz.unique_users} unique users, category ${biz.category}.`,
          next_action: `Contactar. Data: ${biz.times_recommended} recomendaciones, $${biz.estimated_value_usd} valor estimado.`,
        }),
      });
      if (res.ok) {
        setAddedToPipeline(prev => new Set([...prev, biz.id]));
      }
    } catch { /* ignore */ }
    setAdding(null);
  }, []);

  const freeBiz = (data.money_on_table || []).filter((b) => b.is_free);
  const freeRevenue = freeBiz.reduce(
    (sum, b) => sum + b.estimated_value_usd,
    0
  );

  function downloadCSV() {
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `demand-signals-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Demand Intelligence</h1>
          <p className="text-[#64748b] text-sm">
            {new Date(s.date_range.first).toLocaleDateString("es-PR")} —{" "}
            {new Date(s.date_range.last).toLocaleDateString("es-PR")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadCSV}
            className="px-3 py-1.5 bg-[#1e293b] hover:bg-[#334155] rounded-lg text-sm transition-colors"
          >
            Exportar CSV
          </button>
          <Link
            href="/anuncia"
            target="_blank"
            className="px-3 py-1.5 bg-red-600 hover:bg-red-500 rounded-lg text-sm transition-colors"
          >
            Vista Prospecto
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <Kpi label="Signals" value={s.total_signals.toLocaleString()} />
        <Kpi label="Queries" value={String(s.unique_queries)} />
        <Kpi label="Users" value={String(s.unique_users)} />
        <Kpi label="Businesses" value={`${s.total_businesses}+`} />
        <Kpi
          label="Revenue perdido"
          value={`$${freeRevenue.toLocaleString()}`}
          alert
        />
      </div>

      {/* Alert banner */}
      <div className="bg-red-950/50 border border-red-800/50 rounded-xl p-4 mb-6">
        <p className="text-red-400 font-semibold text-sm">
          HAZ ESTO: {freeBiz.length} negocios reciben recomendaciones gratis. Si
          cada uno pagara $799/año, serían{" "}
          <span className="text-white">
            ${(freeBiz.length * 799).toLocaleString()}/año
          </span>
          . Top 5 para llamar hoy:
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          {freeBiz.slice(0, 5).map((b) => (
            <span
              key={b.name}
              className="px-2 py-1 bg-red-900/50 rounded text-xs text-red-300"
            >
              {b.name} ({b.times_recommended}x)
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#1e293b] rounded-lg p-1 w-fit">
        {(
          [
            ["money", "Dinero en la Mesa"],
            ["queries", "Top Queries"],
            ["timing", "Timing"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-md text-sm transition-colors ${tab === key ? "bg-[#334155] text-white" : "text-[#64748b] hover:text-[#94a3b8]"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "money" && (
        <div className="space-y-4">
          <div className="bg-[#1e293b] rounded-xl p-5">
            <h2 className="text-lg font-bold mb-1">
              Negocios que reciben recomendaciones gratis
            </h2>
            <p className="text-[#64748b] text-sm mb-4">
              Estimated value = recomendaciones x $3.50 (valor de un lead).
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[#64748b] border-b border-[#334155]">
                    <th className="pb-2 pr-3">Negocio</th>
                    <th className="pb-2 pr-3">Recs</th>
                    <th className="pb-2 pr-3">Users</th>
                    <th className="pb-2 pr-3">Cat</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3">Valor</th>
                    <th className="pb-2">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.money_on_table || []).map((biz) => (
                    <tr
                      key={biz.name}
                      className={`border-b border-[#334155]/50 ${biz.is_free ? "hover:bg-red-950/20" : "hover:bg-green-950/20"}`}
                    >
                      <td className="py-2.5 pr-3 font-medium">{biz.name}</td>
                      <td className="py-2.5 pr-3 text-[#38bdf8] font-bold">
                        {biz.times_recommended}
                      </td>
                      <td className="py-2.5 pr-3">{biz.unique_users}</td>
                      <td className="py-2.5 pr-3">
                        <span className="text-xs px-2 py-0.5 rounded bg-[#0f172a]">
                          {CAT_ES[biz.category] || biz.category}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3">
                        {biz.is_free ? (
                          <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-400">
                            FREE
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded bg-green-900/50 text-green-400">
                            PAYING
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-[#fbbf24]">
                        ${biz.estimated_value_usd}
                      </td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-1.5">
                          {biz.is_free && biz.phone ? (
                            <a
                              href={`https://wa.me/${biz.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola, soy Angel de *7711. Tu negocio fue recomendado ${biz.times_recommended} veces este mes. ¿Te interesa saber más?`)}`}
                              target="_blank"
                              className="text-xs px-2 py-1 rounded bg-green-800 hover:bg-green-700 text-white transition-colors"
                            >
                              WA
                            </a>
                          ) : biz.is_free ? (
                            <span className="text-xs text-[#64748b]">
                              Sin tel
                            </span>
                          ) : (
                            <span className="text-xs text-green-600">
                              Activo
                            </span>
                          )}
                          {biz.is_free && !addedToPipeline.has(biz.id) && (
                            <button
                              onClick={() => handleAddToPipeline(biz)}
                              disabled={adding === biz.id}
                              className="text-xs px-2 py-1 rounded bg-[#38bdf8]/20 text-[#38bdf8] hover:bg-[#38bdf8]/30 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1"
                              title="Add to pipeline"
                            >
                              <UserPlus size={10} />
                              Pipeline
                            </button>
                          )}
                          {addedToPipeline.has(biz.id) && (
                            <span className="text-xs text-[#4ade80]">✓ Added</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl p-5">
            <h2 className="text-lg font-bold mb-1">
              Oportunidad por categoría
            </h2>
            <p className="text-[#64748b] text-sm mb-4">
              Categorías con alta demanda y cero sponsors = low hanging fruit.
            </p>
            <div className="space-y-2">
              {(data.unmet_categories || []).map((cat) => {
                const ratio = cat.demand > 0 ? cat.supply / cat.demand : 0;
                return (
                  <div
                    key={cat.category}
                    className="flex items-center gap-3 p-3 rounded-lg bg-[#0f172a]"
                  >
                    <span className="w-24 font-medium text-sm">
                      {CAT_ES[cat.category] || cat.category}
                    </span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs text-[#64748b] mb-1">
                        <span>{cat.demand} búsquedas</span>
                        <span>
                          {cat.supply} negocios / {cat.paying} pagando
                        </span>
                      </div>
                      <div className="w-full bg-[#334155] rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${cat.paying === 0 ? "bg-red-500" : "bg-green-500"}`}
                          style={{
                            width: `${Math.min(ratio * 100, 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                    {cat.paying === 0 && (
                      <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-red-400 whitespace-nowrap">
                        0 sponsors
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "queries" && (
        <div className="bg-[#1e293b] rounded-xl p-5">
          <h2 className="text-lg font-bold mb-4">Top 25 Queries</h2>
          <ResponsiveContainer width="100%" height={550}>
            <BarChart
              data={(data.top_queries || []).slice(0, 25)}
              layout="vertical"
              margin={{ left: 200 }}
            >
              <XAxis type="number" stroke="#64748b" />
              <YAxis
                type="category"
                dataKey="query"
                stroke="#94a3b8"
                width={190}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  borderRadius: 8,
                }}
              />
              <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {tab === "timing" && (
        <div className="space-y-4">
          <div className="bg-[#1e293b] rounded-xl p-5">
            <h2 className="text-lg font-bold mb-1">¿Cuándo buscan?</h2>
            <p className="text-[#64748b] text-sm mb-4">
              Dile al sponsor: &ldquo;Tus clientes te buscan los sábados a las
              11am.&rdquo;
            </p>
            <div className="overflow-x-auto">
              <Heatmap data={data.heatmap || []} />
            </div>
          </div>

          <div className="bg-[#1e293b] rounded-xl p-5">
            <h2 className="text-lg font-bold mb-4">Tendencia semanal</h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={data.weekly_trend || []}>
                <XAxis
                  dataKey="week"
                  stroke="#64748b"
                  tickFormatter={(v) =>
                    new Date(v).toLocaleDateString("es-PR", {
                      month: "short",
                      day: "numeric",
                    })
                  }
                />
                <YAxis stroke="#64748b" />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: 8,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="queries"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  name="Queries"
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#4ade80"
                  strokeWidth={2}
                  name="Users"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  value,
  alert,
}: {
  label: string;
  value: string;
  alert?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-3 ${alert ? "bg-red-950/30 border border-red-800/30" : "bg-[#1e293b]"}`}
    >
      <p className="text-[#64748b] text-xs">{label}</p>
      <p
        className={`text-xl font-bold mt-0.5 ${alert ? "text-red-400" : "text-white"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Heatmap({
  data,
}: {
  data: { day: number; hour: number; count: number }[];
}) {
  const max = Math.max(...data.map((d) => d.count), 1);
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
  data.forEach((d) => {
    if (d.day >= 0 && d.day < 7 && d.hour >= 0 && d.hour < 24)
      grid[d.day][d.hour] = d.count;
  });

  return (
    <div className="inline-block">
      <div className="flex gap-0.5 mb-1 ml-10">
        {Array.from({ length: 24 }, (_, h) => (
          <div key={h} className="w-6 text-center text-[10px] text-[#64748b]">
            {h}
          </div>
        ))}
      </div>
      {grid.map((row, dayIdx) => (
        <div key={dayIdx} className="flex items-center gap-0.5 mb-0.5">
          <span className="w-9 text-xs text-[#64748b] text-right pr-1">
            {DAYS[dayIdx]}
          </span>
          {row.map((count, hourIdx) => (
            <div
              key={hourIdx}
              className="w-6 h-6 rounded-sm"
              style={{
                background:
                  count === 0
                    ? "#1e293b"
                    : `rgba(56, 189, 248, ${0.2 + (count / max) * 0.8})`,
              }}
              title={`${DAYS[dayIdx]} ${hourIdx}:00 — ${count} queries`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
