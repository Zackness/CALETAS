"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, CalendarDays, Images, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ActionItem = {
  key: string;
  label: string;
  href: string;
  icon: typeof BookOpen;
  accent: string;
};

const ACTIONS: ActionItem[] = [
  {
    key: "caleta",
    label: "Caleta",
    href: "/caletas/crear",
    icon: BookOpen,
    accent: "from-[#40C9A9]/30 to-[#203324]",
  },
  {
    key: "historias",
    label: "Historias",
    href: "/home#historias",
    icon: Images,
    accent: "from-[#40C9A9]/25 to-[#354B3A]",
  },
  {
    key: "calendario",
    label: "Calendario",
    href: "/academico/calendario?capture=voice",
    icon: CalendarDays,
    accent: "from-[#40C9A9]/35 to-[#1C2D20]",
  },
];

/**
 * Botón flotante estilo “compose” (Twitter): al pulsar despliega acciones circulares.
 * Caleta, Historias (home) y Calendario personal.
 */
export function StudentComposeFab() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    close();
  }, [pathname, close]);

  if (pathname.startsWith("/login")) return null;

  return (
    <>
      {open ? (
        <button
          type="button"
          aria-label="Cerrar menú de acciones"
          className="fixed inset-0 z-[55] bg-black/45 backdrop-blur-[2px] md:bg-black/35"
          onClick={close}
        />
      ) : null}

      <div
        ref={rootRef}
        className={cn(
          "fixed z-[60] flex flex-col items-end gap-3",
          "max-md:right-4 max-md:bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))]",
          "md:bottom-8 md:right-8",
        )}
      >
        <div
          className={cn(
            "flex flex-col-reverse items-end gap-3 transition-all duration-200",
            open ? "pointer-events-auto opacity-100 translate-y-0" : "pointer-events-none opacity-0 translate-y-2",
          )}
          aria-hidden={!open}
        >
          {ACTIONS.map((action, i) => {
            const Icon = action.icon;
            const delay = open ? (ACTIONS.length - 1 - i) * 40 : 0;
            return (
              <div
                key={action.key}
                className="flex items-center gap-3"
                style={{ transitionDelay: `${delay}ms` }}
              >
                <span className="rounded-lg border border-white/10 bg-[#203324]/95 px-2.5 py-1 text-xs font-medium text-white/90 shadow-md max-md:hidden">
                  {action.label}
                </span>
                <Link
                  href={action.href}
                  onClick={close}
                  aria-label={action.label}
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/15 shadow-lg ring-2 ring-[#203324]/80",
                    "bg-gradient-to-br text-white transition-transform hover:scale-105 active:scale-95",
                    action.accent,
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </Link>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          data-tutorial="caletas-compartir"
          aria-label={open ? "Cerrar menú" : "Abrir menú: Caleta, Historias, Calendario"}
          aria-expanded={open}
          title={open ? "Cerrar" : "Crear"}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full",
            "bg-[var(--accent-hex)] text-[#1C2D20] shadow-[0_8px_30px_rgba(0,0,0,0.35)]",
            "ring-2 ring-[color-mix(in_oklab,var(--accent-hex)_55%,#203324)] ring-offset-2 ring-offset-[#203324]",
            "transition-transform hover:scale-105 active:scale-95",
          )}
        >
          {open ? (
            <X className="h-7 w-7 stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" />
          ) : (
            <Plus className="h-7 w-7 stroke-[2.5]" strokeLinecap="round" strokeLinejoin="round" />
          )}
        </button>
      </div>
    </>
  );
}

/** @deprecated Usar StudentComposeFab */
export const CaletaShareFab = StudentComposeFab;
