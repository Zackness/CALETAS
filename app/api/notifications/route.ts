import { NextResponse } from "next/server";
import { getUserNotifications, createNotification } from "@/lib/notifications";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notifications = await getUserNotifications(session.user.id);
  return NextResponse.json(notifications);
}

export async function POST(req: Request) {
  const session = await auth();
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