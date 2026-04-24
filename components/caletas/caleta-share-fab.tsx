"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Botón flotante global (estilo widget) para ir a compartir una caleta.
 * Oculto en la propia pantalla de creación.
 */
export function CaletaShareFab() {
  const pathname = usePathname() ?? "";
  if (pathname.startsWith("/caletas/crear")) return null;

  return (
    <Link
      href="/caletas/crear"
      data-tutorial="caletas-compartir"
      aria-label="Compartir caleta"
      title="Compartir caleta"
      className={cn(
        "fixed z-[60] flex h-14 w-14 items-center justify-center rounded-full",
        "bg-[var(--accent-hex)] text-[#1C2D20] shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
        "ring-2 ring-[color-mix(in_oklab,var(--accent-hex)_55%,#203324)] ring-offset-2 ring-offset-[#203324]",
        "transition-transform hover:scale-105 active:scale-95",
        "max-md:right-4 max-md:bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]",
        "md:bottom-8 md:right-8",
      )}
    >
      <Plus className="h-7 w-7 stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" />
    </Link>
  );
}
