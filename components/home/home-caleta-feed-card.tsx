"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Eye, Share2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { TipoRecursoIcon, tipoEtiquetaCorta } from "@/components/caletas/recurso-tipo";
import { shareOrCopyUrl } from "@/lib/share";

export type FeedCaleta = {
  id: string;
  titulo: string;
  createdAt: string | Date;
  tipo?: string;
  numVistas: number;
  numDescargas: number;
  autor: { name: string };
  materia: null | { codigo: string; nombre: string };
  isFavorito: boolean;
  favoritosCount: number;
};

export function HomeCaletaFeedCard({
  item,
  showDate,
  layout = "list",
}: {
  item: FeedCaleta;
  showDate?: boolean;
  layout?: "list" | "grid";
}) {
  const [busy, setBusy] = useState(false);
  const [isFavorito, setIsFavorito] = useState(item.isFavorito);
  const [favoritosCount, setFavoritosCount] = useState(item.favoritosCount);

  const href = useMemo(() => `/caletas/${item.id}`, [item.id]);

  const shareUrl = () => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return `${origin}${href}`;
  };

  const toggleFavorito = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !isFavorito;
    setIsFavorito(next); // optimistic
    setFavoritosCount((c) => Math.max(0, c + (next ? 1 : -1))); // optimistic
    try {
      if (next) {
        const res = await fetch("/api/caletas/favoritos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recursoId: item.id }),
        });
        if (!res.ok) throw new Error("No se pudo guardar en favoritos");
        toast.success("Guardado en favoritos");
      } else {
        const res = await fetch(`/api/caletas/favoritos?recursoId=${encodeURIComponent(item.id)}`, {
          method: "DELETE",
        });
        if (!res.ok) throw new Error("No se pudo quitar de favoritos");
        toast.success("Eliminado de favoritos");
      }
    } catch (err) {
      setIsFavorito(!next); // rollback
      setFavoritosCount((c) => Math.max(0, c + (next ? -1 : 1))); // rollback
      toast.error(err instanceof Error ? err.message : "Error actualizando favoritos");
    } finally {
      setBusy(false);
    }
  };

  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = shareUrl();
    try {
      const res = await shareOrCopyUrl({ title: item.titulo, url });
      if (!res.shared) toast.success("Link copiado");
    } catch {
      toast.error("No se pudo compartir/copiar el link");
    }
  };

  if (layout === "grid") {
    return (
      <div className="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-[var(--mygreen-dark)] transition-colors hover:border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] hover:bg-white/[0.04]">
        <Link href={href} className="block min-h-0 flex-1">
          <div className="relative h-[5.25rem] bg-gradient-to-br from-[color-mix(in_oklab,var(--accent-hex)_22%,transparent)] to-[var(--mygreen-dark)]">
            <div className="absolute inset-0 flex items-center justify-center">
              <TipoRecursoIcon tipo={item.tipo ?? ""} className="h-9 w-9 text-white/35" />
            </div>
            <span className="absolute left-2 top-2 max-w-[85%] truncate rounded-full bg-black/30 px-2 py-0.5 text-[10px] font-medium text-white/90 backdrop-blur-sm">
              {tipoEtiquetaCorta(item.tipo ?? "")}
            </span>
            {showDate ? (
              <span className="absolute right-2 top-2 rounded-full bg-black/25 px-2 py-0.5 text-[10px] text-white/75">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
            ) : null}
          </div>
          <div className="p-2.5">
            <div className="line-clamp-2 text-sm font-medium leading-snug text-white">{item.titulo}</div>
            <div className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/55">
              {item.materia ? `${item.materia.codigo}` : "Genérica"} · {item.autor.name}
            </div>
          </div>
        </Link>

        <div className="mt-auto flex items-center justify-between gap-1 border-t border-white/10 px-2 py-1.5">
          <div className="flex min-w-0 flex-1 items-center gap-2 text-[10px] text-white/60">
            <span className="inline-flex items-center gap-0.5">
              <Eye className="h-3 w-3 shrink-0 text-[color-mix(in_oklab,var(--accent-hex)_90%,transparent)]" />
              {item.numVistas}
            </span>
            <span className="inline-flex items-center gap-0.5">
              <Star
                className={cn(
                  "h-3 w-3 shrink-0",
                  isFavorito ? "fill-[var(--accent-hex)] text-[var(--accent-hex)]" : "text-white/55",
                )}
              />
              {favoritosCount}
            </span>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={toggleFavorito}
              disabled={busy}
              className={cn(
                "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
                "border-white/10 bg-white/5 hover:bg-white/10",
                busy && "opacity-70",
              )}
              aria-label={isFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
              title={isFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
            >
              <Star
                className={cn("h-3 w-3", isFavorito ? "fill-[var(--accent-hex)] text-[var(--accent-hex)]" : "text-white/80")}
              />
            </button>
            <button
              type="button"
              onClick={share}
              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Compartir"
              title="Compartir"
            >
              <Share2 className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 bg-[var(--mygreen-dark)] p-3 transition-colors hover:bg-white/5">
      <Link href={href} className="block">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate font-medium text-white">{item.titulo}</div>
            <div className="mt-1 truncate text-xs text-white/60">
              {item.materia ? `${item.materia.codigo} · ${item.materia.nombre}` : "Caleta genérica"} · por{" "}
              {item.autor.name}
            </div>
          </div>
          {showDate ? (
            <div className="shrink-0 text-xs text-white/60">{new Date(item.createdAt).toLocaleDateString()}</div>
          ) : null}
        </div>
      </Link>

      <div className="mt-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 text-[11px] text-white/65">
          <span className="inline-flex items-center gap-0.5">
            <Eye className="h-3 w-3 text-[color-mix(in_oklab,var(--accent-hex)_90%,transparent)]" /> {item.numVistas}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Download className="h-3 w-3 text-[color-mix(in_oklab,var(--accent-hex)_90%,transparent)]" /> {item.numDescargas}
          </span>
          <span className="inline-flex items-center gap-0.5">
            <Star className={cn("h-3 w-3", isFavorito ? "fill-[var(--accent-hex)] text-[var(--accent-hex)]" : "text-white/70")} />
            {favoritosCount}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFavorito}
            disabled={busy}
            className={cn(
              "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
              "border-white/10 bg-white/5 hover:bg-white/10",
              busy && "opacity-70",
            )}
            aria-label={isFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
            title={isFavorito ? "Quitar de favoritos" : "Guardar en favoritos"}
          >
            <Star className={cn("h-3.5 w-3.5", isFavorito ? "fill-[var(--accent-hex)] text-[var(--accent-hex)]" : "text-white/80")} />
          </button>

          <button
            type="button"
            onClick={share}
            className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
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
