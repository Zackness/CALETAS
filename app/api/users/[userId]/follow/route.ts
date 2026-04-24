import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const { userId: followingId } = await ctx.params;
    const followerId = session.user.id;

    if (!followingId || followingId === followerId) {
      return withCors(NextResponse.json({ error: "No puedes seguirte a ti mismo" }, { status: 400 }), request);
    }

    const [target, follower] = await Promise.all([
      db.user.findUnique({
        where: { id: followingId },
        select: { id: true },
      }),
      db.user.findUnique({
        where: { id: followerId },
        select: { id: true, name: true },
      }),
    ]);
    if (!follower) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }
    if (!target) {
      return withCors(NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 }), request);
    }

    const existing = await db.userFollow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
      select: { id: true },
    });

    if (!existing) {
      await db.$transaction(async (tx) => {
        await tx.userFollow.create({ data: { followerId, followingId } });
        await tx.notification.create({
          data: { userId: followingId, message: `${follower.name} empezó a seguirte.` },
        });
      });
    }

    return withCors(NextResponse.json({ ok: true, following: true }), request);
  } catch (e) {
    console.error("[users/follow POST]", e);
    return withCors(NextResponse.json({ error: "Error interno" }, { status: 500 }), request);
  }
}

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ userId: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const { userId: followingId } = await ctx.params;
    const followerId = session.user.id;

    if (!followingId) {
      return withCors(NextResponse.json({ error: "Usuario inválido" }, { status: 400 }), request);
    }

    await db.userFollow.deleteMany({
      where: { followerId, followingId },
    });

    return withCors(NextResponse.json({ ok: true, following: false }), request);
  } catch (e) {
    console.error("[users/follow DELETE]", e);
    return withCors(NextResponse.json({ error: "Error interno" }, { status: 500 }), request);
  }
}
