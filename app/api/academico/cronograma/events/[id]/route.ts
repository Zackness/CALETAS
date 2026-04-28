import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function parseDate(v: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const body = (await request.json().catch(() => null)) as
      | {
          title?: string;
          description?: string | null;
          location?: string | null;
          startAt?: string;
          endAt?: string;
          allDay?: boolean;
          color?: string | null;
        }
      | null;

    const existing = await db.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    const data: any = {};
    if (typeof body?.title === "string") {
      const t = body.title.trim();
      if (!t) return NextResponse.json({ error: "Título requerido" }, { status: 400 });
      data.title = t;
    }
    if (body?.description !== undefined) data.description = body.description?.trim() || null;
    if (body?.location !== undefined) data.location = body.location?.trim() || null;
    if (body?.color !== undefined) data.color = body.color?.trim() || null;
    if (body?.allDay !== undefined) data.allDay = !!body.allDay;

    if (body?.startAt !== undefined) {
      const d = parseDate(body.startAt ?? null);
      if (!d) return NextResponse.json({ error: "Fecha inicio inválida" }, { status: 400 });
      data.startAt = d;
    }
    if (body?.endAt !== undefined) {
      const d = parseDate(body.endAt ?? null);
      if (!d) return NextResponse.json({ error: "Fecha fin inválida" }, { status: 400 });
      data.endAt = d;
    }
    if (data.startAt && data.endAt && data.endAt.getTime() < data.startAt.getTime()) {
      return NextResponse.json({ error: "La fecha fin no puede ser menor a la de inicio" }, { status: 400 });
    }

    // Si actualizan solo una fecha, validamos contra el valor actual
    if ((data.startAt && !data.endAt) || (!data.startAt && data.endAt)) {
      const current = await db.calendarEvent.findUnique({
        where: { id },
        select: { startAt: true, endAt: true },
      });
      const s = data.startAt ?? current?.startAt;
      const e = data.endAt ?? current?.endAt;
      if (s && e && e.getTime() < s.getTime()) {
        return NextResponse.json({ error: "La fecha fin no puede ser menor a la de inicio" }, { status: 400 });
      }
    }

    const updated = await db.calendarEvent.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startAt: true,
        endAt: true,
        allDay: true,
        color: true,
      },
    });

    return NextResponse.json({ event: updated });
  } catch (e) {
    console.error("[cronograma-events:patch]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const { id } = await params;
    const existing = await db.calendarEvent.findFirst({
      where: { id, userId: session.user.id },
      select: { id: true },
    });
    if (!existing) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

    await db.calendarEvent.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[cronograma-events:delete]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

