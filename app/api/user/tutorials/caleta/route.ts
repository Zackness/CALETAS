import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";

export async function GET(req: Request) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      const res = new NextResponse("No tienes autorización", { status: 401 });
      Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { caletaTutorialCompleted: true },
    });

    const res = NextResponse.json(
      { completed: !!user?.caletaTutorialCompleted },
      { status: 200 },
    );
    Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (error) {
    console.error("[tutorial caleta] GET error:", error);
    const res = NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

export async function PATCH(req: Request) {
  const cors = getCorsHeaders(req);
  try {
    const session = await auth.api.getSession({ headers: req.headers });
    if (!session?.user?.id) {
      const res = new NextResponse("No tienes autorización", { status: 401 });
      Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
      return res;
    }

    await db.user.update({
      where: { id: session.user.id },
      data: { caletaTutorialCompleted: true },
    });

    const res = NextResponse.json({ completed: true }, { status: 200 });
    Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  } catch (error) {
    console.error("[tutorial caleta] PATCH error:", error);
    const res = NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    Object.entries(cors).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  }
}

