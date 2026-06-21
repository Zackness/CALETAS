import { format } from "date-fns";
import { es } from "date-fns/locale";
import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { sendCalendarReminderEmail } from "@/lib/mail";

function reminderLabel(minutes: number) {
  if (minutes === 0) return "ahora mismo";
  if (minutes < 60) return `en ${minutes} minuto${minutes === 1 ? "" : "s"}`;
  if (minutes % 1440 === 0) {
    const days = minutes / 1440;
    return `en ${days} día${days === 1 ? "" : "s"}`;
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `en ${hours} hora${hours === 1 ? "" : "s"}`;
  }
  return `en ${minutes} minutos`;
}

export async function GET(request: NextRequest) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }

  const header = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const q = request.nextUrl.searchParams.get("secret") ?? "";
  if (header !== expected && q !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const now = new Date();
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const events = await db.calendarEvent.findMany({
    where: {
      reminderMinutes: { not: null },
      reminderSentAt: null,
      startAt: { gt: now, lte: horizon },
      user: { email: { not: "" } },
    },
    select: {
      id: true,
      title: true,
      description: true,
      location: true,
      startAt: true,
      allDay: true,
      reminderMinutes: true,
      user: { select: { email: true, name: true } },
    },
    orderBy: { startAt: "asc" },
    take: 200,
  });

  let sent = 0;
  const errors: string[] = [];
  for (const event of events) {
    const reminderMinutes = event.reminderMinutes ?? 0;
    const remindAt = new Date(event.startAt.getTime() - reminderMinutes * 60 * 1000);
    const due = remindAt.getTime() <= now.getTime();
    if (!due) continue;

    try {
      await sendCalendarReminderEmail({
        email: event.user.email,
        userName: event.user.name,
        title: event.title,
        description: event.description,
        location: event.location,
        startLabel: event.allDay
          ? format(event.startAt, "PP", { locale: es })
          : format(event.startAt, "PPp", { locale: es }),
        reminderLabel: reminderLabel(reminderMinutes),
      });

      await db.calendarEvent.update({
        where: { id: event.id },
        data: { reminderSentAt: now },
      });
      sent += 1;
    } catch (error) {
      console.error("[calendar-reminders:send]", event.id, error);
      errors.push(event.id);
    }
  }

  return NextResponse.json({ ok: true, scanned: events.length, sent, errors });
}
