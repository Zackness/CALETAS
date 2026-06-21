import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { createNotification } from "@/lib/notifications";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { recursoId } = await request.json();
    if (!recursoId) {
      return NextResponse.json({ error: "ID del recurso es requerido" }, { status: 400 });
    }

    const recurso = await db.recurso.findUnique({ where: { id: recursoId } });
    if (!recurso) {
      return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 });
    }

    const existing = await db.likeRecurso.findUnique({
      where: { usuarioId_recursoId: { usuarioId: session.user.id, recursoId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Ya le diste like a esta caleta" }, { status: 400 });
    }

    const actor = await db.user.findUnique({ where: { id: session.user.id }, select: { name: true } });
    await db.likeRecurso.create({ data: { usuarioId: session.user.id, recursoId } });

    if (recurso.autorId !== session.user.id) {
      await createNotification(recurso.autorId, `${actor?.name || "Alguien"} le dio like a tu caleta "${recurso.titulo}".`);
    }

    return NextResponse.json({ success: true, message: "Like agregado" }, { status: 201 });
  } catch (error) {
    console.error("Error agregando like:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recursoId = searchParams.get("recursoId");
    if (!recursoId) {
      return NextResponse.json({ error: "ID del recurso es requerido" }, { status: 400 });
    }

    await db.likeRecurso.deleteMany({ where: { usuarioId: session.user.id, recursoId } });
    return NextResponse.json({ success: true, message: "Like eliminado" });
  } catch (error) {
    console.error("Error eliminando like:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
