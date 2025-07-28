import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EstadoMateria } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { materiaEstudianteId, nota, estado, observaciones } = body;

    if (!materiaEstudianteId) {
      return NextResponse.json(
        { error: "ID de materia estudiante requerido" },
        { status: 400 }
      );
    }

    // Validar que la materia pertenece al usuario
    const materiaEstudiante = await db.materiaEstudiante.findUnique({
      where: {
        id: materiaEstudianteId,
        userId: session.user.id,
      },
    });

    if (!materiaEstudiante) {
      return NextResponse.json(
        { error: "Materia no encontrada o no autorizada" },
        { status: 404 }
      );
    }

    // Validar nota si se proporciona
    if (nota !== undefined && (nota < 0 || nota > 20)) {
      return NextResponse.json(
        { error: "La nota debe estar entre 0 y 20" },
        { status: 400 }
      );
    }

    // Validar estado si se proporciona
    if (estado && !Object.values(EstadoMateria).includes(estado)) {
      return NextResponse.json(
        { error: "Estado de materia inválido" },
        { status: 400 }
      );
    }

    // Actualizar la materia del estudiante
    const updatedMateriaEstudiante = await db.materiaEstudiante.update({
      where: {
        id: materiaEstudianteId,
      },
      data: {
        ...(nota !== undefined && { nota }),
        ...(estado && { estado }),
        ...(observaciones !== undefined && { observaciones }),
        updatedAt: new Date(),
      },
      include: {
        materia: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            creditos: true,
            semestre: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Nota actualizada exitosamente",
      materiaEstudiante: updatedMateriaEstudiante,
    });

  } catch (error) {
    console.error("Error updating grade:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 