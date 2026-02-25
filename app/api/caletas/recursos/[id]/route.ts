import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "Recurso no encontrado" },
        { status: 404 }
      );
    }

    const masked =
      recurso.esAnonimo && recurso.autorId !== session.user.id
        ? { ...recurso, autor: ANON_AUTHOR }
        : recurso;

    return NextResponse.json(masked);

  } catch (error) {
    console.error("Error fetching recurso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "Recurso no encontrado" },
        { status: 404 }
      );
    }

    if (recurso.autorId !== session.user.id) {
      return NextResponse.json(
        { error: "No tienes permisos para eliminar este recurso" },
        { status: 403 }
      );
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

    return NextResponse.json(
      { message: "Recurso eliminado exitosamente" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting recurso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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

    // Validar campos requeridos
    if (!titulo || !descripcion || !tipo || !materiaId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la materia existe
    const materia = await db.materia.findUnique({
      where: { id: materiaId },
    });

    if (!materia) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 400 }
      );
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
        materiaId,
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