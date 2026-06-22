import Link from "next/link";
import { ArrowRight, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProfileCompletionBanner() {
  return (
    <div className="chalk-panel-soft relative overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] p-4 sm:p-5">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 80% 120% at 0% 50%, color-mix(in oklab, var(--accent-hex) 22%, transparent), transparent 58%)",
        }}
      />
      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[color-mix(in_oklab,var(--accent-hex)_15%,transparent)] text-[var(--accent-hex)]">
            <UserCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-special text-base text-white sm:text-lg">Completa tu perfil público</p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-white/70">
              Crea tu username para que otros te encuentren, puedas seguir compañeros y recibir seguidores.
              Sin perfil, la comunidad no puede interactuar contigo como en una red social.
            </p>
          </div>
        </div>
        <Button
          asChild
          size="sm"
          className="shrink-0 self-start bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_85%,white)] sm:self-center"
        >
          <Link href="/perfil">
            Crear mi perfil
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
