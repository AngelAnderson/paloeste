import { getDemandInsights, exportDemandCSV } from "@/lib/admin-queries";
import { DemandDashboardClient } from "./client";

export const dynamic = "force-dynamic";

export default async function DemandPage() {
  const [insights, csvData] = await Promise.all([
    getDemandInsights(),
    exportDemandCSV(),
  ]);

  // Build CSV string server-side
  const headers = [
    "query",
    "normalized",
    "category",
    "matched",
    "business",
    "alternatives",
    "town",
    "channel",
    "date",
  ];
  const csvString = [
    headers.join(","),
    ...csvData.map((r) =>
      [
        `"${(r.query_text || "").replace(/"/g, '""')}"`,
        `"${r.query_normalized || ""}"`,
        r.category || "",
        r.matched,
        `"${(r.matched_business_name || "").replace(/"/g, '""')}"`,
        r.total_alternatives,
        r.town,
        r.channel,
        r.created_at,
      ].join(",")
    ),
  ].join("\n");

  return <DemandDashboardClient insights={insights} csvString={csvString} />;
}
