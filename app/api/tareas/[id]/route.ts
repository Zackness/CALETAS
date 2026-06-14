import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CaletaTaskPriority, CaletaTaskStatus } from "@prisma/client";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return unauthorized();

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as {
    title?: string;
    description?: string | null;
    status?: CaletaTaskStatus;
    priority?: CaletaTaskPriority;
    dueAt?: string | null;
    icon?: string | null;
  } | null;

  const existing = await db.caletaTask.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

  const task = await db.caletaTask.update({
    where: { id },
    data: {
      title: body?.title?.trim() || undefined,
      description: body?.description === undefined ? undefined : body.description?.trim() || null,
      status: Object.values(CaletaTaskStatus).includes(body?.status as CaletaTaskStatus)
        ? (body?.status as CaletaTaskStatus)
        : undefined,
      priority: Object.values(CaletaTaskPriority).includes(body?.priority as CaletaTaskPriority)
        ? (body?.priority as CaletaTaskPriority)
        : undefined,
      dueAt: body?.dueAt === undefined ? undefined : body.dueAt ? new Date(body.dueAt) : null,
      icon: body?.icon === undefined ? undefined : body.icon?.trim() || null,
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return unauthorized();

  const { id } = await context.params;
  const existing = await db.caletaTask.findFirst({ where: { id, userId: session.user.id } });
  if (!existing) return NextResponse.json({ error: "Tarea no encontrada" }, { status: 404 });

  await db.caletaTask.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
