"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { TipoRecursoIcon } from "@/components/caletas/recurso-tipo";

function extFromArchivoUrl(url: string): string {
  const noQuery = url.split("?")[0] ?? url;
  const seg = noQuery.split("/").pop() ?? "";
  const i = seg.lastIndexOf(".");
  if (i === -1) return "";
  return seg.slice(i + 1).toLowerCase();
}

const IMAGE_EXTS = new Set(["jpg", "jpeg", "png", "gif", "webp", "bmp", "avif"]);
const VIDEO_EXTS = new Set(["mp4", "webm", "mov", "m4v"]);

type Props = {
  archivoUrl?: string | null;
  tipo: string;
  className?: string;
};

/**
 * Miniatura tipo “explorador de Windows”: imagen a pantalla completa del recorte,
 * PDF vía visor embebido (misma origen que `/api/proxy-pdf`), video primer fotograma.
 */
export function RecursoFeedFilePreview({ archivoUrl, tipo, className }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [pdfReady, setPdfReady] = useState(false);
  const [pdfTimedOut, setPdfTimedOut] = useState(false);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin: "120px", threshold: 0.02 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const ext = useMemo(() => (archivoUrl ? extFromArchivoUrl(archivoUrl) : ""), [archivoUrl]);
  const isImage = !!archivoUrl && IMAGE_EXTS.has(ext);
  const isPdf = !!archivoUrl && ext === "pdf";
  const isVideo = !!archivoUrl && VIDEO_EXTS.has(ext);

  useEffect(() => {
    if (!inView || !isPdf || !archivoUrl) return;
    const t = window.setTimeout(() => setPdfTimedOut(true), 16_000);
    return () => window.clearTimeout(t);
  }, [inView, isPdf, archivoUrl]);

  const showTipoPlaceholder =
    !inView ||
    !archivoUrl ||
    (inView && !!archivoUrl && !isImage && !isPdf && !isVideo) ||
    (isImage && imgError) ||
    (isPdf && pdfTimedOut && !pdfReady);

  const pdfSrc =
    archivoUrl && isPdf
      ? `/api/proxy-pdf?url=${encodeURIComponent(archivoUrl)}#toolbar=0&navpanes=0&scrollbar=0`
      : null;

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative overflow-hidden bg-gradient-to-br from-[color-mix(in_oklab,var(--accent-hex)_16%,transparent)] via-[var(--mygreen-dark)] to-black/35",
        className,
      )}
    >
      {showTipoPlaceholder ? (
        <div className="absolute inset-0 z-[3] flex items-center justify-center bg-black/15">
          <TipoRecursoIcon tipo={tipo} className="h-10 w-10 text-white/35 sm:h-11 sm:w-11" />
        </div>
      ) : null}

      {inView && isImage && archivoUrl && !imgError ? (
        <img
          src={archivoUrl}
          alt=""
          className="absolute inset-0 z-[1] h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImgError(true)}
        />
      ) : null}

      {inView && isVideo && archivoUrl ? (
        <video
          src={archivoUrl}
          muted
          playsInline
          preload="metadata"
          className="absolute inset-0 z-[1] h-full w-full object-cover"
          aria-hidden
        />
      ) : null}

      {inView && isPdf && archivoUrl && pdfSrc ? (
        <>
          <iframe
            title="Vista previa del PDF"
            src={pdfSrc}
            className={cn(
              "pointer-events-none absolute left-1/2 top-0 z-[1] h-[280%] w-[128%] max-w-none -translate-x-1/2 border-0 bg-[#f5f5f5]",
              pdfReady ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setPdfReady(true)}
          />
          {inView && !pdfReady && !pdfTimedOut ? (
            <div className="absolute inset-0 z-[2] flex items-center justify-center bg-black/25 backdrop-blur-[1px]">
              <div
                className="h-7 w-7 animate-spin rounded-full border-2 border-white/25 border-t-[var(--accent-hex)]"
                aria-hidden
              />
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
