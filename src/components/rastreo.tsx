"use client";

import { useEffect } from "react";

// Medición de clics (29 oct 2026). Cualquier <a data-ev="click_to_call" data-target="..."> manda 1 evento
// a /api/log. Sin nombre ni teléfono de la persona; vid = id anónimo al azar para contar personas.
// Nunca rompe la página: todo en try/catch.
function vid(): string {
  try {
    let v = localStorage.getItem("rg_vid") || "";
    if (!v) {
      v = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
      localStorage.setItem("rg_vid", v);
    }
    return v;
  } catch {
    return "";
  }
}

function enviar(event: string, record: string, target: string) {
  try {
    const body = JSON.stringify({ event, record, target, referrer: document.referrer || "", vid: vid() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/log", new Blob([body], { type: "text/plain" }));
    } else {
      fetch("/api/log", { method: "POST", keepalive: true, headers: { "Content-Type": "text/plain" }, body });
    }
  } catch {
    /* la medición nunca rompe la página */
  }
}

export function Rastreo({ record, vista }: { record: string; vista?: string }) {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[data-ev]") as HTMLElement | null;
      if (!a) return;
      enviar(a.getAttribute("data-ev") || "", a.getAttribute("data-record") || record, a.getAttribute("data-target") || "");
    };
    document.addEventListener("click", onClick, true);
    if (vista) enviar("recommendation_view", record, vista);
    return () => document.removeEventListener("click", onClick, true);
  }, [record, vista]);
  return null;
}
