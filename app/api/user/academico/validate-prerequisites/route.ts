import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// POST - Validar prerrequisitos de una materia
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { materiaId, estado } = body;

    if (!materiaId) {
      return NextResponse.json(
        { error: "ID de materia requerido" },
        { status: 400 }
      );
    }

    // Obtener la materia con sus prerrequisitos
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
                semestre: true,
              },
            },
          },
        },
      },
    });

    if (!materia) {
      return NextResponse.json(
        { error: "Materia no encontrada" },
        { status: 404 }
      );
    }

    // Si la materia no tiene prerrequisitos, no hay problema
    if (materia.prerrequisitos.length === 0) {
      return NextResponse.json({
        esValido: true,
        prerrequisitosFaltantes: [],
        sugerencias: [],
      });
    }

    // Obtener las materias aprobadas del estudiante
    const materiasEstudiante = await db.materiaEstudiante.findMany({
      where: {
        userId: session.user.id,
        estado: "APROBADA",
      },
      select: {
        materiaId: true,
        materia: {
          select: {
            codigo: true,
            nombre: true,
          },
        },
      },
    });

    const materiasAprobadasIds = new Set(materiasEstudiante.map(m => m.materiaId));

    // Verificar prerrequisitos faltantes
    const prerrequisitosFaltantes = materia.prerrequisitos.filter(
      prerreq => !materiasAprobadasIds.has(prerreq.prerrequisito.id)
    );

    // Si no hay prerrequisitos faltantes, todo está bien
    if (prerrequisitosFaltantes.length === 0) {
      return NextResponse.json({
        esValido: true,
        prerrequisitosFaltantes: [],
        sugerencias: [],
      });
    }

    // Generar sugerencias para agregar automáticamente los prerrequisitos
    const sugerencias = prerrequisitosFaltantes.map(prerreq => ({
      materiaId: prerreq.prerrequisito.id,
      codigo: prerreq.prerrequisito.codigo,
      nombre: prerreq.prerrequisito.nombre,
      semestre: prerreq.prerrequisito.semestre,
      mensaje: `Agregar ${prerreq.prerrequisito.codigo} - ${prerreq.prerrequisito.nombre} como aprobada`,
    }));

    return NextResponse.json({
      esValido: false,
      prerrequisitosFaltantes: prerrequisitosFaltantes.map(prerreq => ({
        codigo: prerreq.prerrequisito.codigo,
        nombre: prerreq.prerrequisito.nombre,
        semestre: prerreq.prerrequisito.semestre,
      })),
      sugerencias,
      mensaje: `La materia ${materia.codigo} - ${materia.nombre} requiere ${prerrequisitosFaltantes.length} prerrequisito(s) que no están aprobados.`,
    });

  } catch (error) {
    console.error("Error validating prerequisites:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 