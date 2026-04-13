import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canAccessBiblioteca, getActiveSubscriptionForUser } from "@/lib/subscription";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
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

    const { slug } = await context.params;
    const obra = await db.bibliotecaObra.findFirst({
      where: { slug, isPublished: true },
    });

    if (!obra) {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }

    return NextResponse.json({ obra });
  } catch (e) {
    console.error("GET /api/biblioteca/[slug]:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
