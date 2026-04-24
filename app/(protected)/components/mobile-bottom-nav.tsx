"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { BookOpen, GraduationCap, Home, MessageCircle, User } from "lucide-react";

const items = [
  { href: "/home", label: "Home", icon: Home, match: (p: string) => p === "/home" },
  {
    href: "/caletas",
    label: "Caletas",
    icon: BookOpen,
    match: (p: string) => p === "/caletas" || p.startsWith("/caletas/"),
  },
  {
    href: "/academico",
    label: "Académico",
    icon: GraduationCap,
    match: (p: string) => p === "/academico" || p.startsWith("/academico/"),
  },
  { href: "/perfil", label: "Perfil", icon: User, match: (p: string) => p === "/perfil" || p.startsWith("/perfil/") },
  { href: "/ia/chat", label: "IA", icon: MessageCircle, match: (p: string) => p.startsWith("/ia/") },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[color:var(--mygreen)]/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-7xl items-stretch justify-between px-2 pb-[max(env(safe-area-inset-bottom),0px)]">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 px-2 py-2 text-xs transition-colors",
                active ? "text-white" : "text-white/65 hover:text-white",
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl border transition-colors",
                  active
                    ? "border-[color-mix(in_oklab,var(--accent-hex)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)]"
                    : "border-transparent bg-transparent hover:bg-white/5",
                )}
              >
                <Icon className={cn("h-5 w-5", active ? "text-[var(--accent-hex)]" : "text-white/80")} />
              </span>
              <span className="truncate">{it.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

