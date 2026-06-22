"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { RefreshCw, Sparkles } from "lucide-react";

export function CursoDbUnavailable() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-lg px-0 py-8">
      <div className="aprende-card space-y-4 p-8 text-center">
        <Sparkles className="mx-auto h-10 w-10 text-[var(--aprende-accent-bright)]" aria-hidden />
        <h1 className="font-special text-xl text-white">Base de datos no disponible</h1>
        <p className="text-sm leading-relaxed text-white/70">
          No pudimos conectar con Neon. Suele pasar si el proyecto estuvo inactivo: espera unos
          segundos y reintenta. Si persiste, revisa que{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs text-[var(--aprende-accent-bright)]">
            DATABASE_URL
          </code>{" "}
          use la URL con <strong className="text-white/85">-pooler</strong> y{" "}
          <code className="rounded bg-white/10 px-1 py-0.5 text-xs">sslmode=require</code>.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="aprende-btn aprende-btn-primary inline-flex items-center justify-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar
          </button>
          <Link
            href="/cursos"
            className="aprende-btn inline-flex items-center justify-center gap-2 text-sm"
          >
            Volver al catálogo
          </Link>
        </div>
      </div>
    </div>
  );
}
