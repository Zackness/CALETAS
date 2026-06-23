import { NextRequest, NextResponse } from "next/server";
import { resolveAuthenticatedUserId } from "@/lib/resolve-authenticated-user";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

async function averageRating(recursoId: string) {
  const agg = await db.calificacionRecurso.aggregate({
    where: { recursoId },
    _avg: { calificacion: true },
    _count: { calificacion: true },
  });
  const avg = agg._avg.calificacion ?? 0;
  return agg._count.calificacion > 0 ? Math.round(avg * 10) / 10 : 0;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    if (!userId) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const { id } = await params;
    const existing = await db.calificacionRecurso.findUnique({
      where: { recursoId_usuarioId: { recursoId: id, usuarioId: userId } },
      select: { calificacion: true, comentario: true },
    });

    return withCors(
      NextResponse.json({
        userCalificacion: existing?.calificacion ?? null,
        comentario: existing?.comentario ?? null,
        calificacion: await averageRating(id),
      }),
      request,
    );
  } catch (error) {
    console.error("Error GET calificacion:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    if (!userId) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const { id } = await params;
    const body = await request.json();
    const calificacion = Number(body?.calificacion);
    const comentario = typeof body?.comentario === "string" ? body.comentario.trim() : null;

    if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
      return withCors(
        NextResponse.json({ error: "La calificacion debe ser un entero entre 1 y 5" }, { status: 400 }),
        request,
      );
    }

    const recurso = await db.recurso.findUnique({ where: { id }, select: { id: true } });
    if (!recurso) {
      return withCors(NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 }), request);
    }

    await db.calificacionRecurso.upsert({
      where: { recursoId_usuarioId: { recursoId: id, usuarioId: userId } },
      create: {
        recursoId: id,
        usuarioId: userId,
        calificacion,
        comentario: comentario || null,
      },
      update: {
        calificacion,
        comentario: comentario || null,
      },
    });

    const avg = await averageRating(id);
    await db.recurso.update({ where: { id }, data: { calificacion: avg } });

    return withCors(
      NextResponse.json({
        userCalificacion: calificacion,
        calificacion: avg,
      }),
      request,
    );
  } catch (error) {
    console.error("Error POST calificacion:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
}
