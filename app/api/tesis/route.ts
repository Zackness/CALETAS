import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const docs = await db.tesisDocumento.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: {
        id: true,
        titulo: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ docs });
  } catch (e) {
    console.error("tesis GET:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const body = (await request.json().catch(() => null)) as { titulo?: string } | null;
    const titulo = (body?.titulo || "Mi tesis").trim().slice(0, 140) || "Mi tesis";

    const doc = await db.tesisDocumento.create({
      data: {
        ownerId: session.user.id,
        titulo,
        cuerpo: "",
      },
      select: { id: true, titulo: true },
    });

    return NextResponse.json({ doc }, { status: 201 });
  } catch (e) {
    console.error("tesis POST:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

