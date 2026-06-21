"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Library, PlayCircle, Sparkles } from "lucide-react";

type Pic18ProgressSummary = {
  percent: number;
  lessonsCompleted: number;
  lessonsTracked: number;
  quizzesPassed: number;
  quizzesTracked: number;
  averageScore: number | null;
  checklistDone: number;
  checklistTotal: number;
};

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
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-special text-white">
            <Library className="h-8 w-8 text-[var(--accent-hex)]" />
            Cursos y tutoriales
          </h1>
          <p className="mt-2 max-w-2xl text-white/70">
            Cursos en video y experiencias web conectadas con tu progreso real dentro de CALETAS.
          </p>
        </div>

        {loading ? (
          <div className="rounded-2xl border border-white/10 bg-[#354B3A] p-8 text-white/70">Cargando cursos…</div>
        ) : cursos.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-[#354B3A] p-8 text-center text-white/70">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-[var(--accent-hex)]" />
            Aún no hay cursos publicados.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {cursos.map((curso) => (
              <article key={curso.id} className="overflow-hidden rounded-2xl border border-white/10 bg-[#354B3A]">
                <div className="relative h-32 overflow-hidden bg-gradient-to-br from-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)] to-[#1C2D20]">
                  {curso.tipo === "web" && curso.externalUrl ? (
                    <>
                      <iframe
                        src={curso.externalUrl}
                        title={curso.titulo}
                        className="h-full w-full scale-[1.02] pointer-events-none select-none object-cover"
                        tabIndex={-1}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                    </>
                  ) : curso.imagenUrl ? (
                    <img src={curso.imagenUrl} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--accent-hex)]">
                    {curso.tipo === "web" ? <ExternalLink className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
                    {curso.tipo === "web" ? "Curso web" : "Curso en video"}
                  </div>
                  <div>
                    <h2 className="text-xl font-special text-white">{curso.titulo}</h2>
                    <p className="mt-2 line-clamp-3 text-sm text-white/70">{curso.descripcion}</p>
                  </div>

                  {curso.progress ? (
                    <div className="rounded-xl border border-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)] bg-[#1C2D20] p-3">
                      <div className="mb-2 flex items-center justify-between text-sm text-white/80">
                        <span>Tu avance real</span>
                        <strong className="text-[var(--accent-hex)]">{curso.progress.percent}%</strong>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/10">
                        <div className="h-full rounded-full bg-[var(--accent-hex)]" style={{ width: `${curso.progress.percent}%` }} />
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-white/60">
                        <div>{curso.progress.lessonsCompleted}/{curso.progress.lessonsTracked} lecciones</div>
                        <div>{curso.progress.quizzesPassed}/{curso.progress.quizzesTracked} quizzes</div>
                        <div>{curso.progress.checklistDone}/{curso.progress.checklistTotal} checklist</div>
                      </div>
                    </div>
                  ) : null}

                  <div className="flex items-center justify-between gap-3 text-xs text-white/55">
                    <span>{curso.tema || "Sin categoría"}</span>
                    <span>Orden {curso.orden}</span>
                  </div>

                  <Link
                    href={`/cursos/${curso.id}`}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--accent-hex)] px-4 py-2 text-sm font-medium text-[#1C2D20]"
                  >
                    Ver curso
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
