"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, GraduationCap, PlayCircle, Sparkles } from "lucide-react";
import { CursoEnrollmentCta } from "@/components/cursos/curso-enrollment-cta";
import { CursoProgressPanel } from "@/components/cursos/curso-progress-panel";
import { CursoWebShowcasePreview } from "@/components/cursos/curso-web-showcase-preview";
import type { CourseEnrollmentState } from "@/lib/cursos/course-enrollment";
import type { Pic18ProgressSummary } from "@/lib/aprende-pic18-progress-summary";
import { youtubeThumbnailUrl } from "@/lib/cursos/youtube";
import { cn } from "@/lib/utils";

type Curso = {
  id: string;
  titulo: string;
  slug: string | null;
  tipo: "video" | "web";
  descripcion: string;
  contenido: string;
  urlVideo: string | null;
  externalUrl: string | null;
  imagenUrl: string | null;
  tema: string | null;
  orden: number;
  progress?: Pic18ProgressSummary | null;
  progressUpdatedAt?: string | null;
  enrollment?: CourseEnrollmentState;
};

export default function CursosPage() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/cursos", { credentials: "same-origin" });
        const data = await res.json();
        if (res.ok) setCursos(Array.isArray(data.cursos) ? data.cursos : []);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  return (
    <div className="px-0 py-4 sm:py-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <span className="aprende-badge mb-3">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Sub-marca CALETAS
          </span>
          <h1 className="flex items-center gap-3 font-special text-3xl text-white sm:text-4xl">
            <GraduationCap className="h-8 w-8 text-[var(--aprende-accent-bright)]" />
            Aprende
          </h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Cursos en video y experiencias web conectadas con tu progreso real dentro de CALETAS.
          </p>
        </div>

        {loading ? (
          <div className="aprende-card p-8 text-white/70">Cargando cursos…</div>
        ) : cursos.length === 0 ? (
          <div className="aprende-card p-8 text-center text-white/70">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-[var(--aprende-accent-bright)]" />
            Aún no hay cursos publicados.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cursos.map((curso) => (
              <article key={curso.id} className="aprende-card overflow-hidden">
                <CursoWebShowcasePreview
                  title={curso.titulo}
                  url={curso.tipo === "web" ? curso.externalUrl : null}
                  imagenUrl={
                    curso.tipo !== "web"
                      ? curso.imagenUrl ?? youtubeThumbnailUrl(curso.urlVideo)
                      : null
                  }
                  className="rounded-none border-0 border-b border-white/10 shadow-none"
                />
                <div className="space-y-4 p-5">
                  <div className="aprende-chip flex w-fit items-center gap-2 text-xs uppercase tracking-[0.2em]">
                    {curso.tipo === "web" ? (
                      <ExternalLink className="h-3.5 w-3.5" />
                    ) : (
                      <PlayCircle className="h-3.5 w-3.5" />
                    )}
                    {curso.tipo === "web" ? "Curso web" : "Curso en video"}
                  </div>
                  <div>
                    <h2 className="font-special text-xl text-white">{curso.titulo}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-white/70">{curso.descripcion}</p>
                  </div>

                  {curso.enrollment && curso.enrollment.status !== "not_started" ? (
                    <CursoProgressPanel
                      summary={curso.progress ?? null}
                      status={curso.enrollment.status}
                      progressUpdatedAt={curso.progressUpdatedAt}
                      compact
                    />
                  ) : null}

                  <div className="flex items-center justify-between gap-3 text-xs text-white/55">
                    <span>{curso.tema || "Sin categoría"}</span>
                    <span>Orden {curso.orden}</span>
                  </div>

                  {curso.enrollment ? (
                    <CursoEnrollmentCta enrollment={curso.enrollment} layout="card" />
                  ) : (
                    <Link
                      href={`/cursos/${curso.id}`}
                      className={cn("aprende-btn aprende-btn-primary inline-flex w-full items-center justify-center gap-2")}
                    >
                      Ver curso
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
