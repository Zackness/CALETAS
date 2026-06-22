"use client";

import Image from "next/image";
import { ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

export function BlogFeaturedImagePanel({
  coverImage,
  onOpenGallery,
  onClear,
}: {
  coverImage: string;
  onOpenGallery: () => void;
  onClear?: () => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        Imagen destacada
      </p>
      <button
        type="button"
        onClick={onOpenGallery}
        className={cn(
          "group relative aspect-video w-full overflow-hidden rounded-lg border text-left transition-colors",
          coverImage
            ? "border-[var(--border)]"
            : "border-dashed border-[var(--border)] bg-[var(--muted)]/30 hover:border-[#40C9A9]/50 hover:bg-[var(--muted)]/50"
        )}
      >
        {coverImage ? (
          <>
            <Image src={coverImage} alt="" fill className="object-cover" sizes="280px" />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 text-xs font-medium text-white opacity-0 transition-all group-hover:bg-black/45 group-hover:opacity-100">
              Cambiar imagen
            </span>
          </>
        ) : (
          <span className="flex h-full min-h-[120px] flex-col items-center justify-center gap-2 px-3 text-center text-xs text-[var(--muted-foreground)]">
            <ImagePlus className="h-7 w-7 text-[#40C9A9]/80" />
            <span>Haz clic para elegir de la galería</span>
          </span>
        )}
      </button>
      {coverImage && onClear ? (
        <button
          type="button"
          className="text-[11px] text-[var(--muted-foreground)] hover:text-red-600"
          onClick={onClear}
        >
          Quitar imagen
        </button>
      ) : null}
    </div>
  );
}
