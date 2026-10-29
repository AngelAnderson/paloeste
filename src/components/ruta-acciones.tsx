"use client";

import { useState } from "react";

// "Compartir por WhatsApp" es un link normal (server). Aquí solo "Guardar" (localStorage, con try/catch).
export function GuardarOpciones({ clave, resumen }: { clave: string; resumen: string }) {
  const [estado, setEstado] = useState<"idle" | "ok" | "error">("idle");
  const guardar = () => {
    try {
      localStorage.setItem("rj_guardado", JSON.stringify({ clave, resumen, guardado: new Date().toISOString() }));
      setEstado("ok");
    } catch {
      setEstado("error");
    }
  };
  return (
    <button
      type="button"
      onClick={guardar}
      className="inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#1B4B5A] bg-white px-5 text-base font-bold text-[#1B4B5A]"
    >
      {estado === "ok" ? "Guardadas en este teléfono" : estado === "error" ? "No se pudo guardar" : "Guardar estas 3"}
    </button>
  );
}

export function VerGuardado() {
  const [txt, setTxt] = useState<{ clave: string; resumen: string } | null>(null);
  const [visto, setVisto] = useState(false);
  const leer = () => {
    try {
      const raw = localStorage.getItem("rj_guardado");
      setTxt(raw ? JSON.parse(raw) : null);
    } catch {
      setTxt(null);
    }
    setVisto(true);
  };
  return (
    <div>
      <button type="button" onClick={leer} className="min-h-12 text-base font-semibold text-[#1B4B5A] underline">
        Ver lo que guardé
      </button>
      {visto && (
        <p className="mt-1 text-base text-[#3D3528]">
          {txt ? (
            <>
              {txt.resumen}{" "}
              <a className="font-bold text-[#1B4B5A] underline" href={`/ruta-joyuda?${txt.clave}`}>
                Abrir de nuevo
              </a>
            </>
          ) : (
            "No has guardado nada todavía."
          )}
        </p>
      )}
    </div>
  );
}
