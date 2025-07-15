import { NextResponse } from "next/server";
import { markNotificationRead, deleteNotification } from "@/lib/notifications";
import { auth } from "@/auth";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Obtener el id de la URL
  const segments = req.url.split("/");
  const id = segments[segments.length - 2];
  const notification = await markNotificationRead(id);
  return NextResponse.json(notification);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Obtener el id de la URL
  const segments = req.url.split("/");
  const id = segments[segments.length - 2];
  await deleteNotification(id);
  return NextResponse.json({ success: true });
} 