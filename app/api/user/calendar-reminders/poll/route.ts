import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { processCalendarRemindersForUser } from "@/lib/calendar-reminders";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const result = await processCalendarRemindersForUser(session.user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[calendar-reminders:poll]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
