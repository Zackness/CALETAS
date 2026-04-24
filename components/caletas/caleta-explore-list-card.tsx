"use client";

import Link from "next/link";
import {
  Clock,
  Download,
  Eye,
  Heart,
  Share2,
  Star,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TipoRecursoIcon, tipoBadgeClassName, tipoNombreLargo } from "@/components/caletas/recurso-tipo";

export type CaletaListRecurso = {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  tags: string;
  createdAt: string;
  numVistas: number;
  numDescargas: number;
  numFavoritos?: number;
  isFavorito?: boolean;
  materia: { id: string; codigo: string; nombre: string } | null;
  autor: { id: string; username?: string | null; name: string };
};

function inicialesAutor(nombre: string) {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0]!.slice(0, 2).toUpperCase();
  return `${partes[0]![0] ?? ""}${partes[partes.length - 1]![0] ?? ""}`.toUpperCase() || "?";
}

type Props = {
  recurso: CaletaListRecurso;
  href: string;
  onOpen: () => void;
  onToggleFavorito: () => void;
  onShare: () => void;
};

/**
 * Lista estilo “feed social”: cabecera visual alineada al grid (gradiente + icono de tipo),
 * contenido legible y misma barra de acciones que antes.
 */
export function CaletaExploreListCard({ recurso, href, onOpen, onToggleFavorito, onShare }: Props) {
  const tags = (recurso.tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <article className="overflow-hidden rounded-2xl border border-white/10 bg-[var(--mygreen-light)] shadow-sm transition-colors hover:border-[color-mix(in_oklab,var(--accent-hex)_28%,transparent)]">
      <div className="relative h-24 bg-gradient-to-br from-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)] via-[var(--mygreen-dark)] to-[var(--mygreen)] sm:h-28">
        <div className="absolute inset-0 flex items-center justify-center">
          <TipoRecursoIcon tipo={recurso.tipo} className="h-14 w-14 text-white/25 sm:h-16 sm:w-16" />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--mygreen-light)] to-transparent px-4 pb-3 pt-10 sm:px-5">
          <h3 className="font-special text-lg leading-tight text-white drop-shadow-sm sm:text-xl">
            {recurso.titulo}
          </h3>
        </div>
      </div>

      <div className="space-y-3 border-t border-white/10 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
          <span className={cn("inline-flex items-center gap-1.5", tipoBadgeClassName(recurso.tipo))}>
            <TipoRecursoIcon tipo={recurso.tipo} className="h-3.5 w-3.5" />
            {tipoNombreLargo(recurso.tipo)}
          </span>
          <Badge
            variant="outline"
            className="rounded-full border-white/15 bg-[var(--mygreen-dark)] px-2.5 py-1 text-xs font-normal text-white/80"
          >
            {recurso.materia ? `${recurso.materia.codigo} · ${recurso.materia.nombre}` : "Caleta genérica"}
          </Badge>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 text-sm",
              recurso.isFavorito ? "text-white/85" : "text-white/55",
            )}
          >
            <Star
              className={cn(
                "h-4 w-4 shrink-0",
                recurso.isFavorito ? "fill-[var(--accent-hex)] text-[var(--accent-hex)]" : "text-white/45",
              )}
            />
            <span className="font-medium text-white/85">{recurso.numFavoritos ?? 0}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-white/65">
            <Eye className="h-4 w-4 shrink-0 text-[var(--accent-hex)]" />
            {recurso.numVistas}
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm text-white/55">
            <Download className="h-3.5 w-3.5 shrink-0 text-[color-mix(in_oklab,var(--accent-hex)_85%,transparent)]" />
            {recurso.numDescargas}
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {tags.length === 0 ? (
            <span className="text-xs text-white/40">Sin etiquetas</span>
          ) : (
            tags.slice(0, 8).map((tag, index) => (
              <span
                key={`${recurso.id}-tag-${index}`}
                className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-[var(--mygreen-dark)] px-2.5 py-0.5 text-xs leading-5 text-white/80"
              >
                <span className="truncate">{tag}</span>
              </span>
            ))
          )}
          {tags.length > 8 ? (
            <span className="self-center text-xs text-white/45">+{tags.length - 8}</span>
          ) : null}
        </div>

        <p className="line-clamp-3 text-sm leading-relaxed text-white/70">{recurso.descripcion}</p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 pt-3 text-xs text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 shrink-0 text-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]" />
            {new Date(recurso.createdAt).toLocaleDateString()}
          </span>
          <span className="inline-flex min-w-0 items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/10 text-[11px] font-semibold text-white/90"
              title={recurso.autor.name}
              aria-hidden
            >
              {inicialesAutor(recurso.autor.name)}
            </span>
            <span className="inline-flex min-w-0 items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]" />
              {recurso.autor.username ? (
                <Link
                  href={`/u/${recurso.autor.username}`}
                  className="truncate font-medium text-[var(--accent-hex)] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {recurso.autor.name}
                </Link>
              ) : (
                <span className="truncate font-medium text-white/80">{recurso.autor.name}</span>
              )}
            </span>
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-1 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
          <Button asChild variant="outline" className="h-9 w-full border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] bg-[var(--mygreen-dark)] text-sm font-medium text-[var(--accent-hex)] shadow-none hover:bg-white/10 sm:w-auto">
            <Link href={href} onClick={() => onOpen()}>
              Ver caleta
            </Link>
          </Button>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={onToggleFavorito}
              className={cn(
                "h-9 flex-1 text-sm font-medium shadow-none sm:flex-none sm:min-w-[9.5rem]",
                recurso.isFavorito
                  ? "border-[color-mix(in_oklab,var(--accent-hex)_50%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)] text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)] hover:text-white"
                  : "border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] bg-[var(--mygreen-dark)] text-[var(--accent-hex)] hover:bg-white/10 hover:text-[var(--accent-hex)]",
              )}
            >
              {recurso.isFavorito ? (
                <Heart className="mr-1.5 h-3.5 w-3.5 shrink-0 fill-[var(--accent-hex)] text-[var(--accent-hex)] sm:h-4 sm:w-4" />
              ) : (
                <Star className="mr-1.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
              )}
              <span className="sm:hidden">{recurso.isFavorito ? "Guardado" : "Favorito"}</span>
              <span className="hidden sm:inline">{recurso.isFavorito ? "En favoritos" : "Añadir a favoritos"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-9 flex-1 border-white/15 bg-[var(--mygreen-dark)] text-white/85 shadow-none hover:bg-white/10 hover:text-white sm:flex-none sm:px-3"
              onClick={() => void onShare()}
              title="Compartir enlace"
              aria-label="Compartir caleta"
            >
              <Share2 className="mx-auto h-4 w-4 sm:mx-0 sm:mr-1.5" />
              <span className="hidden sm:inline">Compartir</span>
            </Button>
          </div>
        </div>
      </div>
    </article>
  );
}
