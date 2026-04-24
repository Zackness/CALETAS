"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

type Step = {
  id: string;
  selector: string | null; // null = sin target (mensaje centrado)
  title: string;
  body: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function CaletaTour() {
  const steps: Step[] = useMemo(
    () => [
      {
        id: "welcome",
        selector: null,
        title: "Bienvenido a Caletas",
        body: "Te mostramos en 30 segundos cómo explorar y compartir recursos. Puedes cerrar cuando quieras; este tutorial solo aparece una vez.",
      },
      {
        id: "explorar",
        selector: '[data-tutorial="caletas-explorar"]',
        title: "Explorar Caletas",
        body: "Entra aquí para ver recursos por materia, tipo y popularidad.",
      },
      {
        id: "compartir",
        selector: '[data-tutorial="caletas-compartir"]',
        title: "Compartir un recurso",
        body: "Usa el botón flotante (+) abajo a la derecha para subir tus caletas o apuntes y ayudar a otros.",
      },
      {
        id: "listo",
        selector: null,
        title: "Listo",
        body: "Eso es todo. Puedes volver cuando quieras desde el botón de Caletas.",
      },
    ],
    [],
  );

  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  const current = steps[idx]!;

  const markCompleted = async () => {
    try {
      await fetch("/api/user/tutorials/caleta", { method: "PATCH" });
    } catch {
      // silencioso
    }
  };

  const closeAndComplete = async () => {
    setOpen(false);
    await markCompleted();
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/user/tutorials/caleta");
        if (!res.ok) return;
        const data = (await res.json()) as { completed?: boolean };
        if (cancelled) return;
        if (!data?.completed) setOpen(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const updateRect = () => {
      if (!current.selector) {
        setRect(null);
        return;
      }
      const el = document.querySelector(current.selector) as HTMLElement | null;
      if (!el) {
        setRect(null);
        return;
      }
      setRect(el.getBoundingClientRect());
    };

    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    const t = window.setInterval(updateRect, 350);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      window.clearInterval(t);
    };
  }, [open, current.selector]);

  if (loading || !open) return null;

  const pad = 8;
  const r = rect
    ? {
        top: clamp(rect.top - pad, 0, window.innerHeight),
        left: clamp(rect.left - pad, 0, window.innerWidth),
        width: clamp(rect.width + pad * 2, 0, window.innerWidth),
        height: clamp(rect.height + pad * 2, 0, window.innerHeight),
      }
    : null;

  const bubbleStyle: React.CSSProperties = r
    ? {
        top: clamp(r.top + r.height + 12, 12, window.innerHeight - 180),
        left: clamp(r.left, 12, window.innerWidth - 380),
      }
    : { top: 24, left: "50%", transform: "translateX(-50%)" };

  return (
    <div className="fixed inset-0 z-[100]">
      {/* Overlays alrededor del spotlight */}
      {r ? (
        <>
          <div className="absolute left-0 top-0 w-full bg-black/70" style={{ height: r.top }} />
          <div
            className="absolute left-0 bg-black/70"
            style={{ top: r.top, width: r.left, height: r.height }}
          />
          <div
            className="absolute bg-black/70"
            style={{ top: r.top, left: r.left + r.width, right: 0, height: r.height }}
          />
          <div
            className="absolute left-0 w-full bg-black/70"
            style={{ top: r.top + r.height, bottom: 0 }}
          />
          <div
            className="absolute rounded-xl border border-[color-mix(in_oklab,var(--accent-hex)_60%,transparent)]"
            style={{
              top: r.top,
              left: r.left,
              width: r.width,
              height: r.height,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.0)",
            }}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-black/70" />
      )}

      {/* Bubble */}
      <div
        className="absolute w-[92vw] max-w-[380px] rounded-xl border border-white/10 bg-[var(--mygreen)] p-4 text-white shadow-2xl"
        style={bubbleStyle}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-[var(--accent-hex)]">{current.title}</div>
            <div className="mt-1 text-sm text-white/80">{current.body}</div>
          </div>
          <button
            type="button"
            onClick={() => void closeAndComplete()}
            className="rounded-md p-1 text-white/70 hover:bg-white/10 hover:text-white"
            aria-label="Cerrar tutorial"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="text-xs text-white/50">
            Paso {idx + 1} de {steps.length}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="bg-[var(--mygreen-dark)] border-white/20 text-white hover:bg-white/10"
              onClick={() => void closeAndComplete()}
            >
              Saltar
            </Button>
            <Button
              type="button"
              className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white"
              onClick={async () => {
                if (idx >= steps.length - 1) {
                  await closeAndComplete();
                  return;
                }
                setIdx((v) => v + 1);
              }}
            >
              {idx >= steps.length - 1 ? "Finalizar" : "Siguiente"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

