"use client";

import { useEffect, useRef, useState } from "react";

/** Viewport de escritorio: el iframe se escala para parecer captura (patrón StartupVen). */
const VIEWPORT_W = 1440;
const VIEWPORT_H = 900;

type Props = {
  title: string;
  url?: string | null;
  imagenUrl?: string | null;
  className?: string;
  /** Marco tipo navegador con barra de URL */
  showChrome?: boolean;
  aspectClass?: string;
};

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`;
}

/**
 * Vista previa tipo screenshot: sitio web escalado dentro de un marco,
 * no un iframe que se estira al tamaño del contenedor.
 */
export function CursoWebShowcasePreview({
  title,
  url,
  imagenUrl,
  className = "",
  showChrome = true,
  aspectClass = "aspect-[16/10]",
}: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.25);

  const src = url?.trim() ? normalizeUrl(url) : null;
  const imagen = imagenUrl?.trim() || null;

  useEffect(() => {
    if (imagen) return;
    const el = frameRef.current;
    if (!el || !src) return;

    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setScale(w / VIEWPORT_W);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [imagen, src]);

  const hostLabel = src?.replace(/^https?:\/\//, "").replace(/\/$/, "") ?? "";

  return (
    <div
      className={`flex w-full flex-col overflow-hidden rounded-lg border border-white/10 bg-[#0f1419] shadow-sm ${className}`}
    >
      {showChrome ? (
        <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-white/10 bg-[color-mix(in_srgb,var(--aprende-surface-card)_88%,black)] px-2.5">
          <span className="h-2 w-2 rounded-full bg-red-400/90" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-amber-400/90" aria-hidden />
          <span className="h-2 w-2 rounded-full bg-emerald-400/90" aria-hidden />
          {hostLabel ? (
            <span className="ml-1 min-w-0 flex-1 truncate rounded-md bg-[#1C2D20] px-2 py-0.5 text-[10px] text-white/55">
              {hostLabel}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        ref={frameRef}
        className={`relative w-full overflow-hidden bg-[color-mix(in_srgb,var(--aprende-surface-card)_70%,#1C2D20)] ${aspectClass}`}
      >
        {imagen ? (
          <img src={imagen} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
        ) : src ? (
          <iframe
            src={src}
            title={title}
            className="pointer-events-none absolute left-0 top-0 select-none border-0"
            style={{
              width: VIEWPORT_W,
              height: VIEWPORT_H,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            sandbox="allow-scripts allow-same-origin"
            loading="lazy"
            referrerPolicy="no-referrer"
            tabIndex={-1}
          />
        ) : (
          <div
            className="absolute inset-0 bg-gradient-to-br from-[var(--aprende-surface-card)] via-[#1a2433] to-[#0d1218]"
            aria-hidden
          />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />
      </div>
    </div>
  );
}
