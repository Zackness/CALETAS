import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { EstadoMateria } from "@prisma/client";

// GET - Obtener historial académico
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    // Obtener todas las materias del estudiante
    const materiasEstudiante = await db.materiaEstudiante.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        materia: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            creditos: true,
            semestre: true,
            horasTeoria: true,
            horasPractica: true,
          },
        },
      },
      orderBy: [
        { materia: { semestre: 'asc' } },
        { materia: { codigo: 'asc' } }
      ],
    });

    // Obtener todas las materias de la carrera para mostrar las disponibles
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        carrera: {
          include: {
            materias: true,
          },
        },
      },
    });

    const materiasCarrera = user?.carrera?.materias || [];
    const materiasCursadas = new Set(materiasEstudiante.map(m => m.materiaId));

    // Filtrar materias no cursadas
    const materiasDisponibles = materiasCarrera.filter(
      materia => !materiasCursadas.has(materia.id)
    );

    return NextResponse.json({
      materiasEstudiante,
      materiasDisponibles,
    });

  } catch (error) {
    console.error("Error fetching academic history:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Agregar materia al historial
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
    const { 
      materiaId, 
      estado, 
      nota, 
      semestreCursado, 
      fechaInicio, 
      fechaFin, 
      observaciones,
      agregadoAutomatico = false
    } = body;

    if (!materiaId || !estado) {
      return NextResponse.json(
        { error: "Materia y estado son requeridos" },
        { status: 400 }
      );
    }

    // Validar que la materia pertenece a la carrera del usuario
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        carrera: {
          include: {
            materias: {
              where: { id: materiaId }
            }
          }
        }
      }
    });

    if (!user?.carrera?.materias.length) {
      return NextResponse.json(
        { error: "Materia no encontrada en tu carrera" },
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

    // Validar estado
    if (!Object.values(EstadoMateria).includes(estado)) {
      return NextResponse.json(
        { error: "Estado de materia inválido" },
        { status: 400 }
      );
    }

    // Si la materia se está marcando como aprobada, validar prerrequisitos (excepto si se está agregando automáticamente)
    if (estado === "APROBADA" && !agregadoAutomatico) {
      const materia = await db.materia.findUnique({
        where: { id: materiaId },
        include: {
          prerrequisitos: {
            include: {
              prerrequisito: {
                select: {
                  id: true,
                  codigo: true,
                  nombre: true,
                },
              },
            },
          },
        },
      });

      if (materia && materia.prerrequisitos.length > 0) {
        // Obtener las materias aprobadas del estudiante
        const materiasAprobadas = await db.materiaEstudiante.findMany({
          where: {
            userId: session.user.id,
            estado: "APROBADA",
          },
          select: {
            materiaId: true,
          },
        });

        const materiasAprobadasIds = new Set(materiasAprobadas.map(m => m.materiaId));

        // Verificar prerrequisitos faltantes
        const prerrequisitosFaltantes = materia.prerrequisitos.filter(
          prerreq => !materiasAprobadasIds.has(prerreq.prerrequisito.id)
        );

        if (prerrequisitosFaltantes.length > 0) {
          return NextResponse.json({
            error: "Prerrequisitos faltantes",
            prerrequisitosFaltantes: prerrequisitosFaltantes.map(prerreq => ({
              codigo: prerreq.prerrequisito.codigo,
              nombre: prerreq.prerrequisito.nombre,
            })),
            mensaje: `No puedes marcar ${materia.codigo} - ${materia.nombre} como aprobada sin haber aprobado sus prerrequisitos.`,
          }, { status: 400 });
        }
      }
    }

    // Crear o actualizar la materia del estudiante
    const materiaEstudiante = await db.materiaEstudiante.upsert({
      where: {
        userId_materiaId: {
          userId: session.user.id,
          materiaId: materiaId
        }
      },
      update: {
        estado,
        nota: nota !== undefined ? nota : undefined,
        semestreCursado,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        observaciones,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        materiaId,
        estado,
        nota: nota !== undefined ? nota : undefined,
        semestreCursado,
        fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
        fechaFin: fechaFin ? new Date(fechaFin) : undefined,
        observaciones,
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
      message: "Materia agregada al historial exitosamente",
      materiaEstudiante,
    });

  } catch (error) {
    console.error("Error adding academic history:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar materia del historial
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      materiaEstudianteId,
      estado, 
      nota, 
      semestreCursado, 
      fechaInicio, 
      fechaFin, 
      observaciones 
    } = body;

    if (!materiaEstudianteId) {
      return NextResponse.json(
        { error: "ID de materia estudiante requerido" },
        { status: 400 }
      );
    }

    // Verificar que la materia pertenece al usuario
    const materiaExistente = await db.materiaEstudiante.findUnique({
      where: {
        id: materiaEstudianteId,
        userId: session.user.id,
      },
    });

    if (!materiaExistente) {
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
    const materiaEstudiante = await db.materiaEstudiante.update({
      where: {
        id: materiaEstudianteId,
      },
      data: {
        ...(estado && { estado }),
        ...(nota !== undefined && { nota }),
        ...(semestreCursado && { semestreCursado }),
        ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
        ...(fechaFin && { fechaFin: new Date(fechaFin) }),
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
      message: "Historial actualizado exitosamente",
      materiaEstudiante,
    });

  } catch (error) {
    console.error("Error updating academic history:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Eliminar materia del historial
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const materiaEstudianteId = searchParams.get('id');

    if (!materiaEstudianteId) {
      return NextResponse.json(
        { error: "ID de materia estudiante requerido" },
        { status: 400 }
      );
    }

    // Verificar que la materia pertenece al usuario
    const materiaExistente = await db.materiaEstudiante.findUnique({
      where: {
        id: materiaEstudianteId,
        userId: session.user.id,
      },
    });

    if (!materiaExistente) {
      return NextResponse.json(
        { error: "Materia no encontrada o no autorizada" },
        { status: 404 }
      );
    }

    // Eliminar la materia del estudiante
    await db.materiaEstudiante.delete({
      where: {
        id: materiaEstudianteId,
      },
    });

    return NextResponse.json({
      message: "Materia eliminada del historial exitosamente",
    });

  } catch (error) {
    console.error("Error deleting academic history:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 