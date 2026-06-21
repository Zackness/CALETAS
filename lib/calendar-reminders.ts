import { format } from "date-fns";
import { es } from "date-fns/locale";

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

export async function processCalendarRemindersForUser(userId: string) {
  const now = new Date();
  const horizon = new Date(now.getTime() + 48 * 60 * 60 * 1000);

  const events = await db.calendarEvent.findMany({
    where: {
      userId,
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
    take: 40,
  });

  let sent = 0;
  const errors: string[] = [];

  for (const event of events) {
    const minutes = event.reminderMinutes ?? 0;
    const remindAt = new Date(event.startAt.getTime() - minutes * 60 * 1000);
    if (remindAt.getTime() > now.getTime()) continue;

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
        reminderLabel: reminderLabel(minutes),
      });

      await db.calendarEvent.update({
        where: { id: event.id },
        data: { reminderSentAt: now },
      });
      sent += 1;
    } catch (error) {
      console.error("[calendar-reminders:user-send]", event.id, error);
      errors.push(event.id);
    }
  }

  return { scanned: events.length, sent, errors };
}
