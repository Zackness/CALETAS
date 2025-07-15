import { NextResponse } from "next/server";
import { markNotificationRead, deleteNotification } from "@/lib/notifications";
import { auth } from "@/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const notification = await markNotificationRead(params.id);
  return NextResponse.json(notification);
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await deleteNotification(params.id);
  return NextResponse.json({ success: true });
} 