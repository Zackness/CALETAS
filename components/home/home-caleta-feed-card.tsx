"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Eye, Download, Heart, MessageCircle, Share2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { TipoRecursoIcon, tipoEtiquetaCorta } from "@/components/caletas/recurso-tipo";
import { RecursoFeedFilePreview } from "@/components/home/recurso-feed-file-preview";
import { shareOrCopyUrl } from "@/lib/share";
import { recursoToExploreHref } from "@/lib/recurso-view-href";

export type FeedCaleta = {
  id: string;
  archivoUrl?: string | null;
  titulo: string;
  descripcion?: string | null;
  createdAt: string | Date;
  tipo?: string;
  numVistas: number;
  numDescargas: number;
  numLikes?: number;
  isLiked?: boolean;
  autor: { name: string };
  materia: null | { codigo: string; nombre: string };
  isFavorito: boolean;
  favoritosCount: number;
};

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase() || "?";
}

function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h + s.charCodeAt(i) * 17) % 360;
  return h;
}

function formatRelativeTimeEs(date: Date): string {
  const sec = Math.floor((Date.now() - date.getTime()) / 1000);
  if (sec < 45) return "ahora";
  const min = Math.floor(sec / 60);
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `hace ${day} d`;
  if (day < 30) return `hace ${Math.floor(day / 7)} sem`;
  return date.toLocaleDateString("es", { day: "numeric", month: "short" });
}

function snippetFromDescription(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return null;
  return t.length > 180 ? `${t.slice(0, 177)}…` : t;
}

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
  const [isLiked, setIsLiked] = useState(!!item.isLiked);
  const [likesCount, setLikesCount] = useState(item.numLikes ?? 0);

  const href = useMemo(
    () => recursoToExploreHref({ id: item.id, archivoUrl: item.archivoUrl }),
    [item.id, item.archivoUrl],
  );

  const created = useMemo(() => new Date(item.createdAt), [item.createdAt]);
  const relativeTime = useMemo(() => formatRelativeTimeEs(created), [created]);
  const snippet = useMemo(() => snippetFromDescription(item.descripcion), [item.descripcion]);
  const initials = useMemo(() => initialsFromName(item.autor.name), [item.autor.name]);
  const avatarHue = useMemo(() => hueFromString(item.autor.name + item.id), [item.autor.name, item.id]);

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
    setIsFavorito(next);
    setFavoritosCount((c) => Math.max(0, c + (next ? 1 : -1)));
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
      setIsFavorito(!next);
      setFavoritosCount((c) => Math.max(0, c + (next ? -1 : 1)));
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

  const toggleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    const next = !isLiked;
    setIsLiked(next);
    setLikesCount((c) => Math.max(0, c + (next ? 1 : -1)));
    try {
      if (next) {
        const res = await fetch("/api/caletas/likes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ recursoId: item.id }),
        });
        if (!res.ok) throw new Error("No se pudo dar like");
      } else {
        const res = await fetch(`/api/caletas/likes?recursoId=${encodeURIComponent(item.id)}`, { method: "DELETE" });
        if (!res.ok) throw new Error("No se pudo quitar el like");
      }
    } catch (err) {
      setIsLiked(!next);
      setLikesCount((c) => Math.max(0, c + (next ? -1 : 1)));
      toast.error(err instanceof Error ? err.message : "Error actualizando likes");
    } finally {
      setBusy(false);
    }
  };

  const avatarStyle = {
    background: `linear-gradient(135deg, hsl(${avatarHue}, 52%, 42%), hsl(${(avatarHue + 48) % 360}, 48%, 30%))`,
  };

  if (layout === "grid") {
    return (
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/12 bg-[color-mix(in_oklab,var(--mygreen-dark)_92%,black)] shadow-[0_4px_24px_-8px_rgba(0,0,0,0.45)] transition-all duration-200 hover:border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] hover:shadow-[0_8px_28px_-10px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-2.5 border-b border-white/8 px-3 pt-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-inner ring-2 ring-white/10"
            style={avatarStyle}
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{item.autor.name}</div>
            <div className="truncate text-[11px] text-white/50">
              {relativeTime} · {item.materia ? item.materia.codigo : "Genérica"}
            </div>
          </div>
        </div>

        <Link href={href} className="relative block min-h-0 flex-1">
          <div className="relative h-[6.75rem] w-full overflow-hidden">
            <RecursoFeedFilePreview
              archivoUrl={item.archivoUrl}
              tipo={item.tipo ?? ""}
              className="absolute inset-0 h-full w-full"
            />
            <span className="pointer-events-none absolute left-2.5 top-2.5 z-20 max-w-[88%] truncate rounded-full bg-black/45 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/95 backdrop-blur-sm ring-1 ring-white/15">
              {tipoEtiquetaCorta(item.tipo ?? "")}
            </span>
          </div>
          <div className="px-3 pb-2 pt-2.5">
            <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-white">{item.titulo}</h3>
            {snippet ? (
              <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-white/55">{snippet}</p>
            ) : null}
          </div>
        </Link>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-2.5 py-2">
          <div className="flex min-w-0 flex-1 items-center gap-3 text-[11px] tabular-nums text-white/55">
            <span className="inline-flex items-center gap-1" title="Vistas">
              <Eye className="h-3.5 w-3.5 shrink-0 text-[var(--accent-hex)]/90" />
              {item.numVistas}
            </span>
            <span className="inline-flex items-center gap-1" title="Descargas en la App de CALETA">
              <Download className="h-3.5 w-3.5 shrink-0 text-[var(--accent-hex)]/90" />
              {item.numDescargas}
            </span>
            <span className="inline-flex items-center gap-1" title="Likes">
              <Heart className={cn("h-3.5 w-3.5 shrink-0", isLiked ? "fill-rose-400 text-rose-400" : "text-white/45")} />
              {likesCount}
            </span>
            <span className="inline-flex items-center gap-1" title="Guardados">
              <Star
                className={cn(
                  "h-3.5 w-3.5 shrink-0",
                  isFavorito ? "fill-[var(--accent-hex)] text-[var(--accent-hex)]" : "text-white/45",
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
                "inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-white/5 text-white/85 transition-colors hover:bg-white/12",
                isFavorito && "bg-[color-mix(in_oklab,var(--accent-hex)_22%,transparent)] text-[var(--accent-hex)]",
                busy && "opacity-60",
              )}
              aria-label={isFavorito ? "Quitar de favoritos" : "Guardar"}
              title={isFavorito ? "Quitar de favoritos" : "Guardar"}
            >
              <Star className={cn("h-4 w-4", isFavorito ? "fill-current" : "")} />
            </button>
            <button
              type="button"
              onClick={toggleLike}
              disabled={busy}
              className={cn(
                "inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-white/5 text-white/85 transition-colors hover:bg-white/12",
                isLiked && "bg-rose-400/15 text-rose-400",
                busy && "opacity-60",
              )}
              aria-label={isLiked ? "Quitar like" : "Dar like"}
              title={isLiked ? "Quitar like" : "Dar like"}
            >
              <Heart className={cn("h-4 w-4", isLiked ? "fill-current" : "")} />
            </button>
            <button
              type="button"
              onClick={share}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/80 transition-colors hover:bg-white/12 hover:text-white"
              aria-label="Compartir"
              title="Compartir"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </footer>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-white/12 bg-[color-mix(in_oklab,var(--mygreen-dark)_90%,black)] shadow-[0_4px_28px_-12px_rgba(0,0,0,0.5)] transition-all duration-200 hover:border-[color-mix(in_oklab,var(--accent-hex)_38%,transparent)] hover:shadow-[0_12px_36px_-16px_rgba(0,0,0,0.55)]">
      <div className="p-3.5 sm:p-4">
        <header className="flex gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white shadow-inner ring-2 ring-white/10"
            style={avatarStyle}
            aria-hidden
          >
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-semibold text-white">{item.autor.name}</span>
              <span className="text-xs text-white/45">· {relativeTime}</span>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-white/8 px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent-hex)] ring-1 ring-[var(--accent-hex)]/25">
                {tipoEtiquetaCorta(item.tipo ?? "")}
              </span>
              {item.materia ? (
                <span className="inline-flex max-w-full items-center truncate rounded-full bg-black/25 px-2.5 py-0.5 text-[11px] text-white/70 ring-1 ring-white/10">
                  {item.materia.codigo} · {item.materia.nombre}
                </span>
              ) : (
                <span className="inline-flex rounded-full bg-black/20 px-2.5 py-0.5 text-[11px] text-white/55 ring-1 ring-white/10">
                  Caleta general
                </span>
              )}
            </div>
          </div>
        </header>

        {item.archivoUrl ? (
          <Link href={href} className="mt-3 block overflow-hidden rounded-xl border border-white/10 ring-1 ring-white/5">
            <RecursoFeedFilePreview archivoUrl={item.archivoUrl} tipo={item.tipo ?? ""} className="h-36 w-full sm:h-40" />
          </Link>
        ) : null}

        <Link href={href} className="group mt-3 block rounded-xl outline-none ring-offset-2 ring-offset-[var(--mygreen-dark)] focus-visible:ring-2 focus-visible:ring-[var(--accent-hex)]">
          <h3 className="text-[15px] font-semibold leading-snug text-white transition-colors group-hover:text-[color-mix(in_oklab,white_92%,var(--accent-hex))] sm:text-base">
            {item.titulo}
          </h3>
          {snippet ? (
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-white/60">{snippet}</p>
          ) : (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-white/40">
              <MessageCircle className="h-3.5 w-3.5 shrink-0 opacity-70" />
              Toca para ver el recurso
            </p>
          )}
        </Link>

        <footer className="mt-3.5 flex flex-col gap-2 border-t border-white/10 pt-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs tabular-nums text-white/55">
            <span className="inline-flex items-center gap-1.5" title="Personas que lo vieron">
              <Eye className="h-4 w-4 text-[var(--accent-hex)]/90" />
              <span className="text-white/80">{item.numVistas}</span> vistas
            </span>
            <span className="inline-flex items-center gap-1.5" title="Descargas en la App de CALETA">
              <Download className="h-4 w-4 text-[var(--accent-hex)]/90" />
              <span className="text-white/80">{item.numDescargas}</span> descargas
            </span>
            <span className="inline-flex items-center gap-1.5" title="Likes">
              <Heart className={cn("h-4 w-4", isLiked ? "fill-rose-400 text-rose-400" : "text-white/45")} />
              <span className="text-white/80">{likesCount}</span> likes
            </span>
            <span className="inline-flex items-center gap-1.5" title="Guardados por la comunidad">
              <Star className={cn("h-4 w-4", isFavorito ? "fill-[var(--accent-hex)] text-[var(--accent-hex)]" : "text-white/45")} />
              <span className="text-white/80">{favoritosCount}</span> guardados
            </span>
          </div>
          <div className="flex items-center justify-end gap-1.5 sm:shrink-0">
            <button
              type="button"
              onClick={toggleLike}
              disabled={busy}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/10",
                isLiked && "border-rose-400/35 bg-rose-400/15 text-rose-300",
                busy && "opacity-60",
              )}
            >
              <Heart className={cn("h-3.5 w-3.5", isLiked ? "fill-current" : "")} />
              {isLiked ? "Te gusta" : "Me gusta"}
            </button>
            <button
              type="button"
              onClick={toggleFavorito}
              disabled={busy}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/10",
                isFavorito && "border-[var(--accent-hex)]/35 bg-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)] text-[var(--accent-hex)]",
                busy && "opacity-60",
              )}
            >
              <Star className={cn("h-3.5 w-3.5", isFavorito ? "fill-current" : "")} />
              {isFavorito ? "Guardado" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={share}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/10"
            >
              <Share2 className="h-3.5 w-3.5" />
              Compartir
            </button>
            <Link
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-hex)] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[color-mix(in_oklab,var(--accent-hex)_82%,transparent)]"
            >
              Abrir
            </Link>
          </div>
        </footer>
      </div>
    </article>
  );
}
