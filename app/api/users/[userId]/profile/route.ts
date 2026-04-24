import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";
import { parseProfileGalleryUrls } from "@/lib/profile-gallery";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function GET(request: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const { userId } = await ctx.params;
    if (!userId) {
      return withCors(NextResponse.json({ error: "Usuario inválido" }, { status: 400 }), request);
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        image: true,
        profileBio: true,
        profileBannerUrl: true,
        profileGalleryUrls: true,
      },
    });

    if (!user) {
      return withCors(NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 }), request);
    }

    const viewerId = session.user.id;
    const isOwnProfile = viewerId === userId;

    const [followersCount, followingCount, caletasCount, followRow, recursos] = await Promise.all([
      db.userFollow.count({ where: { followingId: userId } }),
      db.userFollow.count({ where: { followerId: userId } }),
      db.recurso.count({
        where: { autorId: userId, esPublico: true, esAnonimo: false },
      }),
      isOwnProfile
        ? Promise.resolve(null)
        : db.userFollow.findUnique({
            where: {
              followerId_followingId: { followerId: viewerId, followingId: userId },
            },
            select: { id: true },
          }),
      db.recurso.findMany({
        where: { autorId: userId, esPublico: true, esAnonimo: false },
        orderBy: { createdAt: "desc" },
        take: 48,
        select: {
          id: true,
          titulo: true,
          tipo: true,
          createdAt: true,
          numVistas: true,
          numDescargas: true,
          materia: { select: { nombre: true } },
        },
      }),
    ]);

    return withCors(
      NextResponse.json({
        user: {
          id: user.id,
          name: user.name,
          image: user.image,
          profileBio: user.profileBio,
          profileBannerUrl: user.profileBannerUrl,
          profileGalleryUrls: parseProfileGalleryUrls(user.profileGalleryUrls),
        },
        counts: {
          followers: followersCount,
          following: followingCount,
          caletas: caletasCount,
        },
        viewer: {
          isOwnProfile,
          isFollowing: !isOwnProfile && !!followRow,
        },
        recursos,
      }),
      request,
    );
  } catch (e) {
    console.error("[users/profile GET]", e);
    return withCors(NextResponse.json({ error: "Error interno" }, { status: 500 }), request);
  }
}
