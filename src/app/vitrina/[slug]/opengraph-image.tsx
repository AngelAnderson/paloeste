import { ImageResponse } from "next/og"
import { getVitrinaData } from "@/lib/vitrina-queries"
import { CATEGORIES } from "@/lib/constants"

export const revalidate = 3600
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const CAT_LABEL: Record<string, string> = {}
CATEGORIES.forEach((c) => { CAT_LABEL[c.id] = c.label_es })

export default async function OGImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const data = await getVitrinaData(slug)

  if (!data) {
    return new ImageResponse(
      (
        <div style={{ display: "flex", width: "100%", height: "100%", background: "#0d6e77", alignItems: "center", justifyContent: "center", color: "white", fontSize: 48 }}>
          CaboRojo.com
        </div>
      ),
      size
    )
  }

  const { place, totalSearches, sponsorsInCategory } = data
  const catLabel = CAT_LABEL[place.category] || place.category

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #0a5560 0%, #0d6e77 60%, #1a9e8e 100%)",
          padding: "60px",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 2, opacity: 0.8 }}>
            CABOROJO.COM
          </div>
          <div style={{ background: "#e8674a", padding: "8px 20px", borderRadius: 20, fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
            LA VITRINA
          </div>
        </div>

        {/* Business name */}
        <div style={{ marginTop: 40, fontSize: 52, fontWeight: 800, lineHeight: 1.1 }}>
          {place.name}
        </div>
        <div style={{ marginTop: 8, fontSize: 24, opacity: 0.7 }}>
          {catLabel}{place.google_rating ? ` — ★ ${place.google_rating}` : ""}
        </div>

        {/* Big stat */}
        <div style={{ display: "flex", marginTop: "auto", gap: 60, alignItems: "flex-end" }}>
          <div>
            <div style={{ fontSize: 120, fontWeight: 900, color: "#f9c88a", lineHeight: 1 }}>
              {totalSearches.toLocaleString()}
            </div>
            <div style={{ fontSize: 22, opacity: 0.8, marginTop: 4 }}>
              búsquedas este mes en {catLabel}
            </div>
          </div>
          {sponsorsInCategory === 0 && (
            <div style={{ background: "rgba(232,103,74,0.3)", padding: "12px 24px", borderRadius: 12, fontSize: 18, fontWeight: 700, border: "2px solid rgba(232,103,74,0.6)" }}>
              0 sponsors — posición #1 disponible
            </div>
          )}
        </div>
      </div>
    ),
    size
  )
}
