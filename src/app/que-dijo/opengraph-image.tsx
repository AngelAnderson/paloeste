import { ImageResponse } from "next/og";

// Vista previa del enlace de ¿Qué dijo? (WhatsApp, Facebook). Colores de DESIGN.md: fondo #FAFAF7, texto #1C1917,
// rojo #B91C1C, azul océano #1E3A5F. La firma es la misma de un resultado: fecha y minuto en rojo, la cita debajo.
export const runtime = "edge";
export const alt = "¿Qué dijo? Escribe un nombre o un tema y mira el minuto exacto del video donde lo dijeron";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#FAFAF7",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 148, fontWeight: 900, color: "#1C1917", letterSpacing: -4, lineHeight: 1 }}>¿Qué dijo?</div>
          <div style={{ fontSize: 40, color: "#1C1917", marginTop: 28, lineHeight: 1.25, maxWidth: 980 }}>
            Escribe un nombre o un tema. Te enseñamos el minuto exacto del video donde lo dijeron.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              background: "#FFFFFF",
              border: "3px solid #1E3A5F",
              borderRadius: 16,
              padding: "20px 32px",
              fontSize: 36,
              color: "#57534E",
              width: 560,
            }}
          >
            Un nombre o un tema
          </div>
          <div
            style={{
              display: "flex",
              background: "#B91C1C",
              color: "#FFFFFF",
              borderRadius: 16,
              padding: "23px 44px",
              fontSize: 36,
              fontWeight: 700,
              marginLeft: 20,
            }}
          >
            Buscar
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, color: "#B91C1C", marginLeft: 40, whiteSpace: "nowrap" }}>minuto 00:03:22</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
