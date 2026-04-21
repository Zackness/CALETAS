import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canViewerAccessRecurso } from "@/lib/caletas-visibility";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

// POST - Registrar una vista y devolver el contador actualizado
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;

    const recurso = await db.recurso.findUnique({
      where: { id },
      select: {
        id: true,
        autorId: true,
        universidadId: true,
        materia: {
          select: {
            id: true,
            carrera: { select: { universidadId: true } },
          },
        },
      },
    });

    if (!recurso) {
      return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 });
    }

    const viewer = await db.user.findUnique({
      where: { id: session.user.id },
      select: { universidadId: true },
    });
    const sub = await getActiveSubscriptionForUser(session.user.id);
    const allowed = canViewerAccessRecurso(
      session.user.id,
      viewer?.universidadId,
      sub,
      {
        autorId: recurso.autorId,
        universidadId: recurso.universidadId,
        materia: recurso.materia as any,
      },
    );
    if (!allowed) {
      return NextResponse.json({ error: "No tienes acceso a este recurso" }, { status: 403 });
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      null;
    const userAgent = request.headers.get("user-agent");

    const [, updated] = await db.$transaction([
      db.vistaRecurso.create({
        data: {
          recursoId: id,
          usuarioId: session.user.id,
          ipAddress,
          userAgent,
        },
      }),
      db.recurso.update({
        where: { id },
        data: { numVistas: { increment: 1 } },
        select: { numVistas: true },
      }),
    ]);

    return NextResponse.json({ success: true, numVistas: updated.numVistas });
  } catch (error) {
    console.error("Error registrando vista:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

