"use client";

import Link from "next/link";
import { Eye, Share2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { TipoRecursoIcon, tipoEtiquetaCorta } from "@/components/caletas/recurso-tipo";

/** Subconjunto del recurso de la API para la tarjeta grid (mismo look que home). */
export type CaletaExploreRecurso = {
  id: string;
  titulo: string;
  tipo: string;
  createdAt: string;
  numVistas: number;
  numDescargas: number;
  numFavoritos?: number;
  isFavorito?: boolean;
  materia: { codigo: string; nombre: string } | null;
  autor: { id?: string; username?: string | null; name: string };
};

type Props = {
  recurso: CaletaExploreRecurso;
  href: string;
  onRegistrarVista?: () => void;
  onToggleFavorito: () => void;
  onShare: () => void;
};

/**
 * Tarjeta grid alineada con `HomeCaletaFeedCard` (layout grid) para el feed de /caletas.
 */
export function CaletaExploreGridCard({
  recurso,
  href,
  onRegistrarVista,
  onToggleFavorito,
  onShare,
}: Props) {
  const favoritosCount = recurso.numFavoritos ?? 0;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[var(--mygreen-dark)] transition-colors hover:border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] hover:bg-white/[0.04]">
      <Link
        href={href}
        className="block min-h-0 flex-1"
        onClick={() => {
          onRegistrarVista?.();
        }}
      >
        <div className="relative h-[5.25rem] bg-gradient-to-br from-[color-mix(in_oklab,var(--accent-hex)_22%,transparent)] to-[var(--mygreen-dark)]">
          <div className="absolute inset-0 flex items-center justify-center">
            <TipoRecursoIcon tipo={recurso.tipo} className="h-9 w-9 text-white/35" />
          </div>
          <span className="absolute left-2 top-2 max-w-[85%] truncate rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
            {tipoEtiquetaCorta(recurso.tipo)}
          </span>
          <span className="absolute right-2 top-2 rounded-full bg-black/25 px-2 py-0.5 text-[10px] text-white/75">
            {new Date(recurso.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="p-2.5">
          <div className="line-clamp-2 text-sm font-medium leading-snug text-white">{recurso.titulo}</div>
          <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/55">
            {recurso.materia ? recurso.materia.codigo : "Genérica"} ·{" "}
            {recurso.autor.username ? (
              <Link
                href={`/u/${recurso.autor.username}`}
                className="text-[color-mix(in_oklab,var(--accent-hex)_92%,transparent)] hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {recurso.autor.name}
              </Link>
            ) : (
              recurso.autor.name
            )}
          </div>
        </div>
      </Link>

      <div className="mt-auto flex items-center justify-between gap-1 border-t border-white/10 px-2 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-white/60">
          <span className="inline-flex items-center gap-0.5">
            <Eye className="h-3 w-3 shrink-0 text-[color-mix(in_oklab,var(--accent-hex)_90%,transparent)]" />
            {recurso.numVistas}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Star
              className={cn(
                "h-3 w-3 shrink-0",
                recurso.isFavorito ? "fill-[var(--accent-hex)] text-[var(--accent-hex)]" : "text-white/55",
              )}
            />
            {favoritosCount}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorito();
            }}
            className={cn(
              "inline-flex h-8 w-8 items-center justify-center rounded-lg border transition-colors",
              "border-white/10 bg-white/5 hover:bg-white/10",
            )}
            aria-label={recurso.isFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
            title={recurso.isFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            <Star
              className={cn(
                "h-3.5 w-3.5",
                recurso.isFavorito ? "fill-[var(--accent-hex)] text-[var(--accent-hex)]" : "text-white/80",
              )}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShare();
            }}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Compartir"
            title="Compartir"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export { recursoToExploreHref } from "@/lib/recurso-view-href";
