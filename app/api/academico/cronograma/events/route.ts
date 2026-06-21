import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function parseDate(v: string | null) {
  if (!v) return null;
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d;
}

function parseReminderMinutes(v: unknown) {
  if (v === null) return null;
  if (v === undefined) return 30;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const start = parseDate(request.nextUrl.searchParams.get("start"));
    const end = parseDate(request.nextUrl.searchParams.get("end"));

    const events = await db.calendarEvent.findMany({
      where: {
        userId: session.user.id,
        ...(start && end
          ? {
              OR: [
                // Intersección de intervalos [startAt,endAt] con [start,end]
                { startAt: { lte: end }, endAt: { gte: start } },
              ],
            }
          : {}),
      },
      orderBy: { startAt: "asc" },
      select: {
        id: true,
        title: true,
        activityType: true,
        description: true,
        location: true,
        startAt: true,
        endAt: true,
        allDay: true,
        reminderMinutes: true,
        reminderSentAt: true,
        color: true,
      },
    });

    return NextResponse.json({ events });
  } catch (e) {
    console.error("[cronograma-events:get]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = (await request.json().catch(() => null)) as
      | {
          title?: string;
          activityType?: string | null;
          description?: string | null;
          location?: string | null;
          startAt?: string;
          endAt?: string;
          allDay?: boolean;
          reminderMinutes?: number | null;
          color?: string | null;
        }
      | null;

    const title = (body?.title || "").trim();
    if (!title) return NextResponse.json({ error: "Título requerido" }, { status: 400 });

    const startAt = parseDate(body?.startAt ?? null);
    const endAt = parseDate(body?.endAt ?? null);
    const reminderMinutes = parseReminderMinutes(body?.reminderMinutes);
    if (!startAt || !endAt) return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
    if (endAt.getTime() < startAt.getTime()) {
      return NextResponse.json({ error: "La fecha fin no puede ser menor a la de inicio" }, { status: 400 });
    }
    if (body?.reminderMinutes !== undefined && reminderMinutes === null) {
      return NextResponse.json({ error: "Recordatorio inválido" }, { status: 400 });
    }

    const created = await db.calendarEvent.create({
      data: {
        userId: session.user.id,
        title,
        activityType: body?.activityType?.trim() || null,
        description: body?.description?.trim() || null,
        location: body?.location?.trim() || null,
        startAt,
        endAt,
        allDay: !!body?.allDay,
        reminderMinutes,
        color: body?.color?.trim() || null,
      },
      select: {
        id: true,
        title: true,
        activityType: true,
        description: true,
        location: true,
        startAt: true,
        endAt: true,
        allDay: true,
        reminderMinutes: true,
        reminderSentAt: true,
        color: true,
      },
    });

    return NextResponse.json({ event: created }, { status: 201 });
  } catch (e) {
    console.error("[cronograma-events:post]", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
