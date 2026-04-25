import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { parseProfileGalleryUrls } from "@/lib/profile-gallery";
import { UserFollowButton } from "@/components/perfil/user-follow-button";
import { TipoRecursoIcon } from "@/components/caletas/recurso-tipo";
import { tipoEtiquetaCorta } from "@/components/caletas/recurso-tipo-utils";
import { recursoToExploreHref } from "@/lib/recurso-view-href";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, Settings2 } from "lucide-react";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

function iniciales(nombre: string) {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0] + p[1]![0]).toUpperCase();
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

  const [followersCount, followingCount, caletasCount, followRow, recursos] = await Promise.all([
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
  ]);

  const gallery = parseProfileGalleryUrls(user.profileGalleryUrls);
  const isFollowing = !!viewerId && !isOwnProfile && !!followRow;

  return (
    <div className="min-h-[calc(100dvh-6rem)] p-4 sm:p-6">
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#354B3A] shadow-lg">
        <div className="relative h-36 sm:h-44">
          {user.profileBannerUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
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
              // eslint-disable-next-line @next/next/no-img-element
              <div key={`${src}-${i}`} className="aspect-square overflow-hidden rounded-xl border border-white/10 bg-[#1C2D20]">
                <img src={src} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
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

