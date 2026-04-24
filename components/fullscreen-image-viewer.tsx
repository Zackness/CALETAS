"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Minus, Plus, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  url: string;
  fileName: string;
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export default function FullscreenImageViewer({ url, fileName }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [scale, setScale] = useState(1);
  const [tx, setTx] = useState(0);
  const [ty, setTy] = useState(0);

  const reset = useCallback(() => {
    setScale(1);
    setTx(0);
    setTy(0);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    reset();
  }, [url, reset]);

  const zoom = useCallback((delta: number) => {
    setScale((s) => clamp(Number((s + delta).toFixed(2)), 0.5, 4));
  }, []);

  const transform = useMemo(() => {
    return `translate(${tx}px, ${ty}px) scale(${scale})`;
  }, [tx, ty, scale]);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    draggingRef.current = true;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const last = lastPointRef.current;
    if (!last) return;
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    lastPointRef.current = { x: e.clientX, y: e.clientY };
    setTx((v) => v + dx);
    setTy((v) => v + dy);
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    draggingRef.current = false;
    lastPointRef.current = null;
    (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
  }, []);

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      if (!containerRef.current) return;
      // Ctrl+wheel = zoom más agresivo (trackpads)
      const step = e.ctrlKey ? 0.25 : 0.15;
      const dir = e.deltaY > 0 ? -1 : 1;
      zoom(step * dir);
    },
    [zoom],
  );

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0b0f0c]">
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2 rounded-xl border border-white/10 bg-black/35 p-2 backdrop-blur">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/10"
          onClick={() => zoom(-0.2)}
          aria-label="Alejar"
          title="Alejar"
        >
          <Minus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/10"
          onClick={() => zoom(0.2)}
          aria-label="Acercar"
          title="Acercar"
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-white hover:bg-white/10"
          onClick={reset}
          aria-label="Reiniciar zoom"
          title="Reiniciar"
        >
          <RefreshCcw className="h-4 w-4" />
        </Button>
        <div className="ml-1 hidden text-xs text-white/70 sm:block">{Math.round(scale * 100)}%</div>
      </div>

      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--accent-hex)]" />
            <div className="text-sm text-white/80">Cargando imagen…</div>
            <div className="mt-1 max-w-[85vw] truncate text-xs text-white/50">{fileName}</div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="max-w-xl px-4 text-center">
            <div className="mb-2 text-5xl">🖼️</div>
            <div className="text-base font-semibold text-white">Error al cargar la imagen</div>
            <div className="mt-1 break-all text-xs text-white/60">{fileName}</div>
            <div className="mt-2 text-sm text-red-300">{error}</div>
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={cn(
          "h-full w-full touch-none",
          error ? "pointer-events-none opacity-40" : "cursor-grab active:cursor-grabbing",
        )}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onContextMenu={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <img
          src={url}
          alt={fileName}
          className="absolute left-1/2 top-1/2 max-h-[92vh] max-w-[92vw] -translate-x-1/2 -translate-y-1/2 select-none"
          style={{ transform, transformOrigin: "center", userSelect: "none" }}
          onLoad={() => setLoading(false)}
          onError={() => {
            setLoading(false);
            setError("No se pudo cargar la imagen.");
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

