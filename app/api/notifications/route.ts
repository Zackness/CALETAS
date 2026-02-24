import { NextResponse } from "next/server";
import { getUserNotifications, createNotification } from "@/lib/notifications";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notifications = await getUserNotifications(session.user.id);
  return NextResponse.json(notifications);
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { message } = await req.json();
  if (!message) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }
  const notification = await createNotification(session.user.id, message);
  return NextResponse.json(notification);
} 