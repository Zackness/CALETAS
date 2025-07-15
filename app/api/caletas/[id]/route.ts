import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// PUT - Actualizar caleta
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { nombre, tema, carreraId, materiaId } = body;

    // Verificar que la caleta pertenece al usuario
    const caletaExistente = await db.caleta.findFirst({
      where: {
        id,
        usuarioId: session.user.id,
        isActive: true
      }
    });

    if (!caletaExistente) {
      return NextResponse.json(
        { error: "Caleta no encontrada" },
        { status: 404 }
      );
    }

    // Si se está cambiando la materia, verificar que pertenece a la carrera
    if (materiaId && carreraId) {
      const materia = await db.materia.findFirst({
        where: {
          id: materiaId,
          carreraId: carreraId,
          isActive: true
        }
      });

      if (!materia) {
        return NextResponse.json(
          { error: "La materia no pertenece a la carrera especificada" },
          { status: 400 }
        );
      }
    }

    // Actualizar la caleta
    const caletaActualizada = await db.caleta.update({
      where: { id },
      data: {
        nombre: nombre || caletaExistente.nombre,
        tema: tema || caletaExistente.tema,
        carreraId: carreraId || caletaExistente.carreraId,
        materiaId: materiaId || caletaExistente.materiaId,
      },
      include: {
        materia: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            semestre: true,
          }
        },
        carrera: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            universidad: {
              select: {
                nombre: true,
                siglas: true,
              }
            }
          }
        }
      }
    });

    return NextResponse.json(caletaActualizada);

  } catch (error) {
    console.error("Error updating caleta:", error);
    return NextResponse.json(
      { error: "Error al actualizar la caleta" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar caleta (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Verificar que la caleta pertenece al usuario
    const caleta = await db.caleta.findFirst({
      where: {
        id,
        usuarioId: session.user.id,
        isActive: true
      }
    });

    if (!caleta) {
      return NextResponse.json(
        { error: "Caleta no encontrada" },
        { status: 404 }
      );
    }

    // Soft delete - marcar como inactiva
    await db.caleta.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    return NextResponse.json(
      { message: "Caleta eliminada exitosamente" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error deleting caleta:", error);
    return NextResponse.json(
      { error: "Error al eliminar la caleta" },
      { status: 500 }
    );
  }
} 