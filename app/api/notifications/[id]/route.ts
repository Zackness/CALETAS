import { NextResponse } from "next/server";
import { markNotificationRead, deleteNotification } from "@/lib/notifications";
import { auth } from "@/lib/auth";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: RouteContext) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  const notification = await markNotificationRead(id);
  return NextResponse.json(notification);
}

export async function DELETE(req: Request, ctx: RouteContext) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await deleteNotification(id);
  return NextResponse.json({ success: true });
}
