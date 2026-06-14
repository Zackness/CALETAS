import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CaletaTaskPriority, CaletaTaskStatus } from "@prisma/client";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return unauthorized();

  const tasks = await db.caletaTask.findMany({
    where: { userId: session.user.id },
    orderBy: [{ createdAt: "desc" }],
  });

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    title?: string;
    description?: string;
    status?: CaletaTaskStatus;
    priority?: CaletaTaskPriority;
    dueAt?: string | null;
    icon?: string | null;
  } | null;

  const title = body?.title?.trim() || "";
  if (!title) {
    return NextResponse.json({ error: "El titulo es obligatorio." }, { status: 400 });
  }

  const status = Object.values(CaletaTaskStatus).includes(body?.status as CaletaTaskStatus)
    ? (body?.status as CaletaTaskStatus)
    : CaletaTaskStatus.PENDIENTE;
  const priority = Object.values(CaletaTaskPriority).includes(body?.priority as CaletaTaskPriority)
    ? (body?.priority as CaletaTaskPriority)
    : CaletaTaskPriority.MEDIA;

  const task = await db.caletaTask.create({
    data: {
      userId: session.user.id,
      title,
      description: body?.description?.trim() || null,
      status,
      priority,
      dueAt: body?.dueAt ? new Date(body.dueAt) : null,
      icon: body?.icon?.trim() || null,
    },
  });

  return NextResponse.json({ task }, { status: 201 });
}
