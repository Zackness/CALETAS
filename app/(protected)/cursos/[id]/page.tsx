import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, GraduationCap, PlayCircle, Sparkles } from "lucide-react";

import { CursoDbUnavailable } from "@/components/cursos/curso-db-unavailable";
import { CursoEnrollmentCta } from "@/components/cursos/curso-enrollment-cta";
import { CursoInfoSections } from "@/components/cursos/curso-info-sections";
import { CursoProgressPanel } from "@/components/cursos/curso-progress-panel";
import { CursoWebShowcasePreview } from "@/components/cursos/curso-web-showcase-preview";
import { attachCourseProgressBundle } from "@/lib/cursos/attach-course-progress";
import { getAprendeProgressForUser } from "@/lib/aprende-progress-db";
import { getSession } from "@/lib/auth";
import { youtubeEmbedUrl, youtubeThumbnailUrl } from "@/lib/cursos/youtube";
import { db, isDatabaseUnreachableError } from "@/lib/db";

export default async function CursoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;

  let curso;
  try {
    curso = await db.curso.findUnique({
      where: { id },
      include: { autor: { select: { name: true } } },
    });
  } catch (error) {
    if (isDatabaseUnreachableError(error)) {
      return <CursoDbUnavailable />;
    }
    throw error;
  }

  if (!curso) notFound();

  const { pic18, cpp } = await getAprendeProgressForUser(session.user.id);
  const { progress, progressUpdatedAt, enrollment } = attachCourseProgressBundle(curso, pic18, cpp);

  const embedUrl = youtubeEmbedUrl(curso.urlVideo);

  return (
    <div className="px-0 py-4 sm:py-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link
          href="/cursos"
          className="inline-flex items-center gap-2 text-sm text-white/65 transition-colors hover:text-[var(--aprende-accent-bright)]"
        >
          ← Volver a Aprende
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_280px] lg:items-start">
          <div className="space-y-4">
            <span className="aprende-badge">
              <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Zona Aprende
            </span>
            <div className="aprende-chip flex w-fit items-center gap-2 text-xs uppercase tracking-[0.2em]">
              {curso.tipo === "web" ? <ExternalLink className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
              {curso.tipo === "web" ? "Curso web sincronizado" : "Curso en video"}
            </div>
            <h1 className="flex items-start gap-3 font-special text-3xl text-white sm:text-4xl">
              <GraduationCap className="mt-1 h-8 w-8 shrink-0 text-[var(--aprende-accent-bright)]" />
              {curso.titulo}
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-white/75">{curso.descripcion}</p>
            <CursoEnrollmentCta enrollment={enrollment} layout="detail" showInfoLink={false} />
          </div>

          <div className="overflow-hidden rounded-2xl border border-[var(--aprende-border)] bg-[color-mix(in_srgb,var(--aprende-surface-card)_90%,transparent)]">
            <CursoWebShowcasePreview
              title={curso.titulo}
              url={curso.tipo === "web" ? curso.externalUrl : null}
              imagenUrl={
                curso.tipo !== "web" ? curso.imagenUrl ?? youtubeThumbnailUrl(curso.urlVideo) : null
              }
              className="rounded-2xl border-0 shadow-none"
            />
          </div>
        </div>

        {enrollment.status !== "not_started" || progress ? (
          <CursoProgressPanel
            summary={progress}
            status={enrollment.status}
            progressUpdatedAt={progressUpdatedAt?.toISOString() ?? null}
          />
        ) : null}

        <CursoInfoSections
          descripcion={curso.descripcion}
          contenido={curso.contenido}
          tema={curso.tema}
          autorName={curso.autor.name}
        />

        {embedUrl ? (
          <div
            id="curso-player"
            className="overflow-hidden rounded-2xl border border-[var(--aprende-border)] bg-[color-mix(in_srgb,var(--aprende-surface-card)_92%,transparent)]"
          >
            <div className="border-b border-white/10 px-4 py-3">
              <p className="aprende-section-label text-xs">Clase en video</p>
            </div>
            <iframe
              src={embedUrl}
              title={curso.titulo}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : null}

        <div className="flex justify-end">
          <CursoEnrollmentCta enrollment={enrollment} layout="detail" showInfoLink={false} />
        </div>
      </div>
    </div>
  );
}
