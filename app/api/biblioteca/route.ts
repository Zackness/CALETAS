import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBiblioteca, getActiveSubscriptionForUser } from "@/lib/subscription";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const sub = await getActiveSubscriptionForUser(session.user.id);
    if (!canAccessBiblioteca(sub)) {
      return NextResponse.json(
        { error: "La biblioteca está disponible en planes de $3/mes o superiores" },
        { status: 403 },
      );
    }

    const obras = await db.bibliotecaObra.findMany({
      where: { isPublished: true },
      orderBy: [{ orden: "asc" }, { titulo: "asc" }],
      select: {
        id: true,
        titulo: true,
        slug: true,
        descripcion: true,
        orden: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ obras });
  } catch (e) {
    console.error("GET /api/biblioteca:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
