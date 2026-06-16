import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { parseProfileGalleryUrls } from "@/lib/profile-gallery";
import { UserFollowButton } from "@/components/perfil/user-follow-button";
import { TipoRecursoIcon } from "@/components/caletas/recurso-tipo";
import { tipoEtiquetaCorta } from "@/components/caletas/recurso-tipo-utils";
import { recursoToExploreHref } from "@/lib/recurso-view-href";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cpu, Eye, Settings2 } from "lucide-react";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function iniciales(nombre: string) {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0] + p[1]![0]).toUpperCase();
}

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

function countDoneDeep(value: unknown): { done: number; total: number } {
  if (typeof value === "boolean") return { done: value ? 1 : 0, total: 1 };
  if (!value || typeof value !== "object") return { done: 0, total: 0 };
  return Object.values(value as Record<string, unknown>).reduce<{ done: number; total: number }>(
    (acc, item) => {
      const next = countDoneDeep(item);
      return { done: acc.done + next.done, total: acc.total + next.total };
    },
    { done: 0, total: 0 },
  );
}

function summarizePic18Progress(payload: unknown): Pic18ProgressSummary | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const studyPath = data.studyPath && typeof data.studyPath === "object" ? data.studyPath as Record<string, unknown> : {};
  const quizzes = data.quizzes && typeof data.quizzes === "object" ? data.quizzes as Record<string, unknown> : {};
  const checklists = data.checklists && typeof data.checklists === "object" ? data.checklists : {};

  const lessons = Object.values(studyPath).filter((v) => typeof v === "boolean");
  const lessonsCompleted = lessons.filter(Boolean).length;
  const quizRows = Object.values(quizzes).filter((v): v is Record<string, unknown> => !!v && typeof v === "object");
  const quizzesPassed = quizRows.filter((q) => q.passed === true).length;
  const scores = quizRows.map((q) => Number(q.score)).filter((n) => Number.isFinite(n));
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const checklist = countDoneDeep(checklists);

  const doneSignals = lessonsCompleted + quizzesPassed + checklist.done;
  const totalSignals = lessons.length + quizRows.length + checklist.total;
  if (totalSignals === 0) return null;

  return {
    percent: Math.round((doneSignals / totalSignals) * 100),
    lessonsCompleted,
    lessonsTracked: lessons.length,
    quizzesPassed,
    quizzesTracked: quizRows.length,
    averageScore,
    checklistDone: checklist.done,
    checklistTotal: checklist.total,
  };
}

export default async function PerfilPublicoPage({ params }: { params: Promise<{ username: string }> }) {
  const session = await getSession();
  const viewerId = session?.user?.id ?? null;

  const { username } = await params;
  const u = (username || "").toLowerCase();

  const user = await db.user.findUnique({
    where: { username: u },
    select: {
      id: true,
      username: true,
      name: true,
      image: true,
      profileBio: true,
      profileBannerUrl: true,
      profileGalleryUrls: true,
    },
  });

  if (!user) notFound();

  const isOwnProfile = !!viewerId && viewerId === user.id;

  const [followersCount, followingCount, caletasCount, followRow, recursos, pic18Progress] = await Promise.all([
    db.userFollow.count({ where: { followingId: user.id } }),
    db.userFollow.count({ where: { followerId: user.id } }),
    db.recurso.count({
      where: { autorId: user.id, esPublico: true, esAnonimo: false },
    }),
    !viewerId || isOwnProfile
      ? Promise.resolve(null)
      : db.userFollow.findUnique({
          where: {
            followerId_followingId: { followerId: viewerId, followingId: user.id },
          },
          select: { id: true },
        }),
    db.recurso.findMany({
      where: { autorId: user.id, esPublico: true, esAnonimo: false },
      orderBy: { createdAt: "desc" },
      take: 48,
      select: {
        id: true,
        titulo: true,
        tipo: true,
        archivoUrl: true,
        createdAt: true,
        numVistas: true,
        materia: { select: { nombre: true } },
      },
    }),
    db.aprendePic18Progress.findUnique({
      where: { userId: user.id },
      select: { payload: true, updatedAt: true },
    }),
  ]);

  const gallery = parseProfileGalleryUrls(user.profileGalleryUrls);
  const isFollowing = !!viewerId && !isOwnProfile && !!followRow;
  const pic18Summary = summarizePic18Progress(pic18Progress?.payload);

  return (
    <div className="min-h-[calc(100dvh-6rem)] p-4 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#354B3A] shadow-lg">
        <div className="relative h-36 sm:h-44">
          {user.profileBannerUrl ? (
            <img src={user.profileBannerUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-gradient-to-r from-[#1C2D20] via-[#2a3d32] to-[color-mix(in_oklab,var(--accent-hex)_25%,#1C2D20)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#354B3A]/90 to-transparent" />
        </div>

        <div className="relative px-4 pb-6 pt-0 sm:px-6">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-end">
              <Avatar className="h-28 w-28 border-4 border-[#354B3A] shadow-md sm:h-32 sm:w-32">
                <AvatarImage src={user.image ?? "/globe.svg"} alt={user.name} />
                <AvatarFallback className="bg-[#1C2D20] text-lg text-white">{iniciales(user.name)}</AvatarFallback>
              </Avatar>
              <div className="text-center sm:mb-1 sm:text-left">
                <h1 className="font-special text-2xl text-white sm:text-3xl">{user.name}</h1>
                <div className="mt-1 text-sm text-white/60">@{user.username}</div>
                <div className="mt-2 flex flex-wrap justify-center gap-4 text-sm text-white/70 sm:justify-start">
                  <span>
                    <strong className="text-white">{caletasCount}</strong> caletas
                  </span>
                  <span>
                    <strong className="text-white">{followersCount}</strong> seguidores
                  </span>
                  <span>
                    <strong className="text-white">{followingCount}</strong> siguiendo
                  </span>
                </div>
              </div>
            </div>

            {!isOwnProfile && viewerId ? (
              <div className="flex justify-center sm:justify-end">
                <UserFollowButton userId={user.id} initialFollowing={isFollowing} />
              </div>
            ) : isOwnProfile ? (
              <Link
                href="/perfil/configuracion"
                className="inline-flex items-center justify-center gap-2 self-center rounded-lg border border-[color-mix(in_oklab,var(--accent-hex)_45%,transparent)] bg-[#1C2D20] px-4 py-2 text-sm text-[var(--accent-hex)] hover:bg-white/10 sm:self-end"
              >
                <Settings2 className="h-4 w-4" />
                Configuración
              </Link>
            ) : null}
          </div>

          {user.profileBio ? (
            <p className="mt-5 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-white/80">{user.profileBio}</p>
          ) : (
            <p className="mt-5 text-sm text-white/50">{isOwnProfile ? "Añade una bio desde Configuración." : "Sin biografía aún."}</p>
          )}
        </div>
      </div>

      {gallery.length > 0 ? (
        <section className="mt-8">
          <h2 className="mb-3 font-special text-lg text-white">Fotos</h2>
          <div className="grid grid-cols-3 gap-1 sm:grid-cols-4 sm:gap-2 md:gap-3">
            {gallery.map((src, i) => (
              <div key={`${src}-${i}`} className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#1C2D20]">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {pic18Summary ? (
        <section className="mt-8 overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] bg-[#1C2D20] shadow-lg">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)] p-3 text-[var(--accent-hex)]">
                <Cpu className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-hex)]">Curso activo</p>
                <h2 className="mt-1 font-special text-xl text-white">Aprende PIC18</h2>
                <p className="mt-1 text-sm text-white/60">Microcontroladores PIC18F4550 · progreso sincronizado con CALETAS</p>
              </div>
            </div>
            <Link
              href="https://pic18.caleta.top"
              className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
            >
              Ver curso
            </Link>
          </div>
          <div className="border-t border-white/10 p-4 sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <div className="text-3xl font-bold text-white">{pic18Summary.percent}%</div>
                <div className="text-xs text-white/55">avance estimado</div>
              </div>
              {pic18Progress?.updatedAt ? (
                <div className="text-right text-xs text-white/45">
                  Actualizado {pic18Progress.updatedAt.toLocaleDateString("es-VE")}
                </div>
              ) : null}
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-[var(--accent-hex)]" style={{ width: `${Math.min(100, Math.max(0, pic18Summary.percent))}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
              <div className="rounded-xl bg-white/5 p-3">
                <div className="font-semibold text-white">{pic18Summary.lessonsCompleted}/{pic18Summary.lessonsTracked}</div>
                <div className="text-xs text-white/55">lecciones</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="font-semibold text-white">{pic18Summary.quizzesPassed}/{pic18Summary.quizzesTracked}</div>
                <div className="text-xs text-white/55">quizzes aprobados</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="font-semibold text-white">{pic18Summary.averageScore ?? "--"}{pic18Summary.averageScore === null ? "" : "%"}</div>
                <div className="text-xs text-white/55">promedio</div>
              </div>
              <div className="rounded-xl bg-white/5 p-3">
                <div className="font-semibold text-white">{pic18Summary.checklistDone}/{pic18Summary.checklistTotal}</div>
                <div className="text-xs text-white/55">checklist</div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="mt-10">
        <h2 className="mb-4 font-special text-xl text-white">Caletas públicas</h2>
        {recursos.length === 0 ? (
          <p className="rounded-xl border border-white/10 bg-[#354B3A] px-4 py-8 text-center text-white/60">
            {isOwnProfile
              ? "Cuando publiques caletas sin modo anónimo, aparecerán aquí."
              : "Este usuario aún no tiene caletas públicas visibles."}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 md:grid-cols-4">
            {recursos.map((r) => (
              <Link
                key={r.id}
                href={recursoToExploreHref(r)}
                className="group flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#354B3A] transition hover:border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] hover:bg-[#3d5649]"
              >
                <div className="relative flex aspect-[4/3] items-center justify-center bg-gradient-to-br from-[#1C2D20] to-[#2a3d32]">
                  <TipoRecursoIcon tipo={r.tipo} className="h-12 w-12 opacity-90 group-hover:scale-105 transition-transform" />
                  <span className="absolute left-2 top-2 rounded-md bg-black/45 px-2 py-0.5 text-[10px] font-medium text-white/90">
                    {tipoEtiquetaCorta(r.tipo)}
                  </span>
                </div>
                <div className="min-w-0 p-3">
                  <p className="line-clamp-2 text-sm font-medium text-white">{r.titulo}</p>
                  <div className="mt-2 flex items-center gap-2 text-[11px] text-white/55">
                    <Eye className="h-3.5 w-3.5" />
                    {r.numVistas}
                    {r.materia?.nombre ? <span className="truncate">· {r.materia.nombre}</span> : null}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
