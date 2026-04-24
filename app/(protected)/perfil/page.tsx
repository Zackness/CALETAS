import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { parseProfileGalleryUrls } from "@/lib/profile-gallery";
import { SocialProfileEditor } from "@/components/perfil/social-profile-editor";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BookOpen, GraduationCap, Target, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await getSession();
  if (!session?.user?.id) return redirect("/login");

  // Datos académicos resumidos (lo que antes saturaba /home).
  const materiasEstudiante = await db.materiaEstudiante.findMany({
    where: { userId: session.user.id },
    include: { materia: { select: { creditos: true } } },
  });

  const userWithCarreraMaterias = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      profileBio: true,
      profileBannerUrl: true,
      profileGalleryUrls: true,
      carrera: {
        select: {
          nombre: true,
          universidad: { select: { siglas: true, nombre: true } },
          materias: { select: { id: true } },
        },
      },
    },
  });

  const totalMateriasCarrera = userWithCarreraMaterias?.carrera?.materias?.length ?? 0;
  const materiasCursadas = materiasEstudiante.filter(
    (m) => m.estado === "APROBADA" || m.estado === "EN_CURSO",
  ).length;
  const progresoCarrera = totalMateriasCarrera > 0 ? (materiasCursadas / totalMateriasCarrera) * 100 : 0;

  const materiasAprobadas = materiasEstudiante.filter((m) => m.estado === "APROBADA");
  const creditosAprobados = materiasAprobadas.reduce((sum, m) => sum + (m.materia?.creditos ?? 0), 0);

  const promedioGeneral =
    materiasAprobadas.filter((m) => m.nota).reduce((sum, m) => sum + (m.nota || 0), 0) /
      (materiasAprobadas.filter((m) => m.nota).length || 1);

  const gallery = userWithCarreraMaterias
    ? parseProfileGalleryUrls(userWithCarreraMaterias.profileGalleryUrls)
    : [];

  return (
    <div className="min-h-[calc(100dvh-6rem)]">
      <div className="mb-6">
        <h1 className="text-3xl font-special text-white">Perfil</h1>
        <p className="text-white/70">
          Tu resumen académico. La Home queda como feed.
        </p>
      </div>

      {userWithCarreraMaterias?.id ? (
        <SocialProfileEditor
          publicProfileHref={`/u/${userWithCarreraMaterias.id}`}
          initialBio={userWithCarreraMaterias.profileBio ?? null}
          initialBanner={userWithCarreraMaterias.profileBannerUrl ?? null}
          initialGallery={gallery}
        />
      ) : null}

      <Card className="bg-[var(--mygreen-light)] border-white/10 mb-6">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-[var(--accent-hex)]" />
            Carrera
          </CardTitle>
          <CardDescription className="text-white/70">
            {userWithCarreraMaterias?.carrera
              ? `${userWithCarreraMaterias.carrera.universidad.siglas} - ${userWithCarreraMaterias.carrera.nombre}`
              : "Sin carrera asignada"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-white/80 text-sm">Progreso</span>
            <Badge className="bg-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)] text-[var(--accent-hex)] border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)]">
              {progresoCarrera.toFixed(1)}%
            </Badge>
          </div>
          <Progress value={progresoCarrera} className="h-2" />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border border-white/10 bg-[var(--mygreen-dark)] p-3">
              <div className="text-xs text-white/60">Créditos aprobados</div>
              <div className="text-white text-xl font-semibold">{creditosAprobados}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[var(--mygreen-dark)] p-3">
              <div className="text-xs text-white/60">Promedio</div>
              <div className="text-white text-xl font-semibold">{Number.isFinite(promedioGeneral) ? promedioGeneral.toFixed(2) : "0.00"}</div>
            </div>
            <div className="rounded-xl border border-white/10 bg-[var(--mygreen-dark)] p-3">
              <div className="text-xs text-white/60">Materias registradas</div>
              <div className="text-white text-xl font-semibold">{materiasEstudiante.length}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[var(--accent-hex)]" />
              Materias
            </CardTitle>
            <CardDescription className="text-white/70">Gestiona tu historial.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--accent-hex)]" />
              Metas
            </CardTitle>
            <CardDescription className="text-white/70">Objetivos y constancia.</CardDescription>
          </CardHeader>
        </Card>
        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-[var(--accent-hex)]" />
              Estadísticas
            </CardTitle>
            <CardDescription className="text-white/70">Análisis detallado.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}

