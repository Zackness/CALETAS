import { NextRequest, NextResponse } from "next/server";

import { db } from "@/lib/db";
import { canViewerAccessRecurso } from "@/lib/caletas-visibility";
import { createNotification } from "@/lib/notifications";
import { buildCommentNotification } from "@/lib/notifications/payload";
import { userPublicProfileHref } from "@/lib/profile/public-profile";
import { recursoToExploreHref } from "@/lib/recurso-view-href";
import { resolveAuthenticatedUserId } from "@/lib/resolve-authenticated-user";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

const MAX_LENGTH = 2000;

async function loadRecursoForAccess(id: string) {
  return db.recurso.findUnique({
    where: { id },
    select: {
      id: true,
      titulo: true,
      archivoUrl: true,
      autorId: true,
      universidadId: true,
      materia: {
        select: {
          carrera: { select: { universidadId: true } },
        },
      },
    },
  });
}

async function assertViewerAccess(userId: string, recurso: NonNullable<Awaited<ReturnType<typeof loadRecursoForAccess>>>) {
  const viewer = await db.user.findUnique({
    where: { id: userId },
    select: { universidadId: true },
  });
  const sub = await getActiveSubscriptionForUser(userId);
  return canViewerAccessRecurso(userId, viewer?.universidadId, sub, {
    autorId: recurso.autorId,
    universidadId: recurso.universidadId,
    materia: recurso.materia as { carrera: { universidadId: string } } | null,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const recurso = await loadRecursoForAccess(id);
    if (!recurso) {
      return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 });
    }

    const allowed = await assertViewerAccess(userId, recurso);
    if (!allowed) {
      return NextResponse.json({ error: "No tienes acceso a este recurso" }, { status: 403 });
    }

    const comentarios = await db.comentarioRecurso.findMany({
      where: { recursoId: id, esRespuesta: false },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        contenido: true,
        createdAt: true,
        autor: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json({ comentarios, total: comentarios.length });
  } catch (error) {
    console.error("Error listando comentarios:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { id } = await params;
    const recurso = await loadRecursoForAccess(id);
    if (!recurso) {
      return NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 });
    }

    const allowed = await assertViewerAccess(userId, recurso);
    if (!allowed) {
      return NextResponse.json({ error: "No tienes acceso a este recurso" }, { status: 403 });
    }

    const body = await request.json();
    const contenido = typeof body.contenido === "string" ? body.contenido.trim() : "";
    if (!contenido) {
      return NextResponse.json({ error: "El comentario no puede estar vacío" }, { status: 400 });
    }
    if (contenido.length > MAX_LENGTH) {
      return NextResponse.json({ error: `Máximo ${MAX_LENGTH} caracteres` }, { status: 400 });
    }

    const actor = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, username: true, image: true },
    });

    const comentario = await db.comentarioRecurso.create({
      data: {
        recursoId: id,
        autorId: userId,
        contenido,
      },
      select: {
        id: true,
        contenido: true,
        createdAt: true,
        autor: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    });

    if (recurso.autorId !== userId) {
      await createNotification(
        recurso.autorId,
        buildCommentNotification({
          actor: {
            id: actor?.id,
            name: actor?.name ?? "Alguien",
            image: actor?.image,
            href: userPublicProfileHref(actor?.username),
          },
          target: {
            label: recurso.titulo,
            href: recursoToExploreHref(recurso),
          },
          preview: contenido,
        }),
      );
    }

    return NextResponse.json({ comentario }, { status: 201 });
  } catch (error) {
    console.error("Error creando comentario:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
