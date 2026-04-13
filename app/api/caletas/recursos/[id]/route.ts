import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";
import { deleteFromBunny } from "@/lib/bunny";
import { canViewerAccessRecurso } from "@/lib/caletas-visibility";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

const ANON_AUTHOR = {
  id: "anon",
  name: "Anónimo",
  email: null as string | null,
};

// GET - Obtener un recurso específico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }
    const { id } = await params;
    const recurso = await db.recurso.findUnique({
      where: { id },
      include: {
        materia: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            carrera: { select: { universidadId: true } },
          },
        },
        autor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!recurso) {
      return withCors(NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 }), request);
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
        materia: recurso.materia,
      },
    );
    if (!allowed) {
      return withCors(NextResponse.json({ error: "No tienes acceso a este recurso" }, { status: 403 }), request);
    }
    const masked =
      recurso.esAnonimo && recurso.autorId !== session.user.id
        ? { ...recurso, autor: ANON_AUTHOR }
        : recurso;
    return withCors(NextResponse.json(masked), request);
  } catch (error) {
    console.error("Error fetching recurso:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
}

// DELETE - Eliminar un recurso específico
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }
    const { id } = await params;
    // Verificar que el recurso existe y pertenece al usuario
    const recurso = await db.recurso.findUnique({
      where: { id },
      select: {
        id: true,
        autorId: true,
        archivoUrl: true,
      },
    });

    if (!recurso) {
      return withCors(NextResponse.json({ error: "Recurso no encontrado" }, { status: 404 }), request);
    }
    if (recurso.autorId !== session.user.id) {
      return withCors(NextResponse.json({ error: "No tienes permisos para eliminar este recurso" }, { status: 403 }), request);
    }

    // Si tiene archivo en Bunny, intentamos eliminarlo también.
    if (recurso.archivoUrl) {
      const deletedFromBunny = await deleteFromBunny(recurso.archivoUrl);
      if (!deletedFromBunny) {
        return withCors(
          NextResponse.json(
            { error: "No se pudo eliminar el archivo en Bunny.net" },
            { status: 500 },
          ),
          request,
        );
      }
    }

    // Eliminar el recurso y todas sus relaciones
    await db.$transaction([
      // Eliminar calificaciones
      db.calificacionRecurso.deleteMany({
        where: { recursoId: id },
      }),
      // Eliminar comentarios
      db.comentarioRecurso.deleteMany({
        where: { recursoId: id },
      }),
      // Eliminar vistas
      db.vistaRecurso.deleteMany({
        where: { recursoId: id },
      }),
      // Eliminar descargas
      db.descargaRecurso.deleteMany({
        where: { recursoId: id },
      }),
      // Eliminar el recurso
      db.recurso.delete({
        where: { id },
      }),
    ]);

    return withCors(NextResponse.json({ message: "Recurso eliminado exitosamente" }, { status: 200 }), request);
  } catch (error) {
    console.error("Error deleting recurso:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
}

// PUT - Actualizar un recurso específico
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { 
      titulo, 
      descripcion, 
      tipo, 
      contenido, 
      archivoUrl, 
      archivoSizeBytes,
      materiaId, 
      esPublico, 
      esAnonimo,
      tags 
    } = body;

    // Verificar que el recurso existe y pertenece al usuario
    const recursoExistente = await db.recurso.findUnique({
      where: { id },
      select: {
        id: true,
        autorId: true,
      },
    });

    if (!recursoExistente) {
      return NextResponse.json(
        { error: "Recurso no encontrado" },
        { status: 404 }
      );
    }

    if (recursoExistente.autorId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para editar este recurso" },
        { status: 403 }
      );
    }

    if (!titulo || !descripcion || !tipo) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { universidadId: true, carreraId: true },
    });

    let finalMateriaId: string | null =
      typeof materiaId === "string" && materiaId.trim() ? materiaId.trim() : null;
    let finalUniversidadId: string | null = null;

    if (user?.universidadId) {
      if (!finalMateriaId || !user.carreraId) {
        return NextResponse.json(
          { error: "Debes seleccionar una materia de tu carrera" },
          { status: 400 },
        );
      }
      const ok = await db.materia.findFirst({
        where: {
          id: finalMateriaId,
          carreraId: user.carreraId,
          carrera: { universidadId: user.universidadId },
        },
        select: { id: true },
      });
      if (!ok) {
        return NextResponse.json({ error: "Materia no válida para tu carrera" }, { status: 400 });
      }
      finalUniversidadId = user.universidadId;
    } else {
      finalMateriaId = null;
      finalUniversidadId = null;
    }

    // Actualizar el recurso
    const recursoActualizado = await db.recurso.update({
      where: { id },
      data: {
        titulo,
        descripcion,
        tipo,
        contenido: contenido || descripcion,
        archivoUrl,
        archivoSizeBytes: typeof archivoSizeBytes === "number" ? archivoSizeBytes : archivoSizeBytes === null ? null : undefined,
        materiaId: finalMateriaId,
        universidadId: finalUniversidadId,
        esPublico: true,
        esAnonimo: typeof esAnonimo === "boolean" ? esAnonimo : undefined,
        tags: tags || null,
        updatedAt: new Date(),
      },
      include: {
        materia: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        autor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Recurso actualizado exitosamente",
      recurso: recursoActualizado,
    });

  } catch (error) {
    console.error("Error updating recurso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 