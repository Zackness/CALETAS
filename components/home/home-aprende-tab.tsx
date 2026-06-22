import Link from "next/link";
import { ExternalLink, GraduationCap, PlayCircle, Sparkles } from "lucide-react";
import { db } from "@/lib/db";
import { CursoWebShowcasePreview } from "@/components/cursos/curso-web-showcase-preview";
import { youtubeThumbnailUrl } from "@/lib/cursos/youtube";
import { getAprendeProgressForUser } from "@/lib/aprende-progress-db";
import { attachCourseProgressBundle } from "@/lib/cursos/attach-course-progress";
import { dedupeCursosByPlatform } from "@/lib/cursos/dedupe-cursos";
import { CursoEnrollmentCta } from "@/components/cursos/curso-enrollment-cta";
import { CursoProgressPanel } from "@/components/cursos/curso-progress-panel";
import { Button } from "@/components/ui/button";

type CursoRow = {
  id: string;
  titulo: string;
  slug: string | null;
  tipo: string;
  descripcion: string;
  externalUrl: string | null;
  imagenUrl: string | null;
  urlVideo: string | null;
  tema: string | null;
  orden: number;
};

function courseProgress(
  curso: CursoRow,
  pic18: Awaited<ReturnType<typeof getAprendeProgressForUser>>["pic18"],
  cpp: Awaited<ReturnType<typeof getAprendeProgressForUser>>["cpp"],
) {
  return attachCourseProgressBundle(curso, pic18, cpp);
}

export async function HomeAprendeTab({ userId }: { userId: string }) {
  const [cursos, { pic18, cpp }] = await Promise.all([
    db.curso.findMany({
      orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
      take: 6,
      select: {
        id: true,
        titulo: true,
        slug: true,
        tipo: true,
        descripcion: true,
        externalUrl: true,
        imagenUrl: true,
        urlVideo: true,
        tema: true,
        orden: true,
      },
    }),
    getAprendeProgressForUser(userId),
  ]);

  const uniqueCursos = dedupeCursosByPlatform(cursos);

  return (
    <div className="aprende-zone-inset">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="aprende-badge mb-3">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              Sub-marca Aprende
            </span>
            <h2 className="mt-1 flex items-center gap-2 font-special text-xl text-white sm:text-2xl">
              <GraduationCap className="h-6 w-6 text-[var(--aprende-accent-bright)]" />
              Aprende
            </h2>
            <p className="mt-1 max-w-xl text-sm text-white/70">
              Cursos en video y experiencias web conectadas con tu progreso real.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="aprende-btn shrink-0 border-0 bg-[var(--aprende-accent)] text-white hover:bg-[var(--aprende-accent-bright)]"
          >
            <Link href="/cursos">Ver todos los cursos</Link>
          </Button>
        </div>

        {uniqueCursos.length === 0 ? (
          <div className="aprende-card p-8 text-center text-white/70">
            <Sparkles className="mx-auto mb-3 h-10 w-10 text-[var(--aprende-accent-bright)]" />
            Aún no hay cursos publicados.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {uniqueCursos.map((curso) => {
              const { progress, progressUpdatedAt, enrollment } = courseProgress(curso, pic18, cpp);
              return (
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
                  <div className="space-y-3 p-4">
                    <div className="aprende-chip flex w-fit items-center gap-2 text-[10px] uppercase tracking-[0.18em]">
                      {curso.tipo === "web" ? (
                        <ExternalLink className="h-3 w-3" />
                      ) : (
                        <PlayCircle className="h-3 w-3" />
                      )}
                      {curso.tipo === "web" ? "Curso web" : "Video"}
                    </div>
                    <div>
                      <h3 className="font-special text-lg text-white">{curso.titulo}</h3>
                      <p className="mt-1 line-clamp-2 text-sm text-white/65">{curso.descripcion}</p>
                    </div>
                    {enrollment.status !== "not_started" ? (
                      <CursoProgressPanel
                        summary={progress}
                        status={enrollment.status}
                        progressUpdatedAt={progressUpdatedAt?.toISOString() ?? null}
                        compact
                      />
                    ) : null}
                    <CursoEnrollmentCta enrollment={enrollment} layout="card" />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
