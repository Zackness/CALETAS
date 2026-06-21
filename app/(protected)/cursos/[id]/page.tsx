import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, PlayCircle, Sparkles } from "lucide-react";

import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";

function youtubeEmbed(url: string | null) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  return match ? `https://www.youtube.com/embed/${match[1]}` : null;
}

export default async function CursoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session?.user?.id) redirect("/login");

  const { id } = await params;
  const curso = await db.curso.findUnique({ where: { id } });
  if (!curso) notFound();

  const embedUrl = youtubeEmbed(curso.urlVideo);

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <Link href="/cursos" className="inline-flex items-center gap-2 text-sm text-white/70 hover:text-white">
          Volver a cursos
        </Link>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[var(--accent-hex)]">
            {curso.tipo === "web" ? <Sparkles className="h-3.5 w-3.5" /> : <PlayCircle className="h-3.5 w-3.5" />}
            {curso.tipo === "web" ? "Curso web" : "Curso en video"}
          </div>
          <h1 className="text-4xl font-special text-white">{curso.titulo}</h1>
          <p className="text-white/70">{curso.descripcion}</p>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#354B3A]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-white/10 bg-[#1C2D20] px-3 py-1 text-xs text-white/65">
                {curso.tema || "Sin categoría"}
              </div>
              <div className="space-y-3 text-sm leading-relaxed text-white/75">
                <p>
                  {curso.tipo === "web"
                    ? "Este curso vive en una web interactiva aparte. Primero revisa la información y luego entra cuando quieras comenzar."
                    : "Este curso está disponible como clase en video con contenido complementario dentro de CALETAS."}
                </p>
                {curso.contenido ? <p className="whitespace-pre-wrap">{curso.contenido}</p> : null}
              </div>
              {curso.tipo === "web" && curso.externalUrl ? (
                <a
                  href={curso.externalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-hex)] px-4 py-2 text-sm font-medium text-[#1C2D20]"
                >
                  Comenzar curso
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : embedUrl ? (
                <a
                  href="#curso-player"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-hex)] px-4 py-2 text-sm font-medium text-[#1C2D20]"
                >
                  Comenzar curso
                  <PlayCircle className="h-4 w-4" />
                </a>
              ) : curso.urlVideo ? (
                <a
                  href={curso.urlVideo}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-hex)] px-4 py-2 text-sm font-medium text-[#1C2D20]"
                >
                  Comenzar curso
                  <ExternalLink className="h-4 w-4" />
                </a>
              ) : null}
            </div>

            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1C2D20]">
              {curso.tipo === "web" && curso.externalUrl ? (
                <>
                  <iframe
                    src={curso.externalUrl}
                    title={curso.titulo}
                    className="aspect-video w-full scale-[1.02] pointer-events-none select-none"
                    tabIndex={-1}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10" />
                </>
              ) : curso.imagenUrl ? (
                <img src={curso.imagenUrl} alt="" className="aspect-video w-full object-cover" />
              ) : embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={curso.titulo}
                  className="aspect-video w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="flex aspect-video items-center justify-center text-sm text-white/45">Sin vista previa</div>
              )}
            </div>
          </div>
        </section>

        {embedUrl ? (
          <div id="curso-player" className="overflow-hidden rounded-2xl border border-white/10 bg-[#1C2D20]">
            <iframe
              src={embedUrl}
              title={curso.titulo}
              className="aspect-video w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : curso.urlVideo ? (
          <a
            href={curso.urlVideo}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--accent-hex)] px-4 py-2 text-sm font-medium text-[#1C2D20]"
          >
            Abrir video
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}

        <article className="rounded-2xl border border-white/10 bg-[#354B3A] p-6 text-white/80">
          <div className="prose prose-invert max-w-none whitespace-pre-wrap">{curso.contenido}</div>
        </article>
      </div>
    </div>
  );
}
