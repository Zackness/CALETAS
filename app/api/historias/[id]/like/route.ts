import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await context.params;
    const historia = await db.historia.findUnique({ where: { id }, select: { id: true } });
    if (!historia) return NextResponse.json({ error: "Historia no encontrada" }, { status: 404 });

    await db.historiaLike.upsert({
      where: { historiaId_userId: { historiaId: id, userId: session.user.id } },
      update: {},
      create: { historiaId: id, userId: session.user.id },
    });
    const count = await db.historiaLike.count({ where: { historiaId: id } });
    return NextResponse.json({ ok: true, isLiked: true, likesCount: count });
  } catch (error) {
    console.error("[historias like POST]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await context.params;
    await db.historiaLike.deleteMany({ where: { historiaId: id, userId: session.user.id } });
    const count = await db.historiaLike.count({ where: { historiaId: id } });
    return NextResponse.json({ ok: true, isLiked: false, likesCount: count });
  } catch (error) {
    console.error("[historias like DELETE]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
