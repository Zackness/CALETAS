import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { EstadoMateria } from "@prisma/client";

export async function GET(request: NextRequest) {
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

    // Obtener todas las materias del estudiante con información de la materia
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

    // Calcular estadísticas
    const totalMaterias = materiasEstudiante.length;
    const materiasAprobadas = materiasEstudiante.filter(m => m.estado === EstadoMateria.APROBADA).length;
    const materiasEnCurso = materiasEstudiante.filter(m => m.estado === EstadoMateria.EN_CURSO).length;
    const materiasAplazadas = materiasEstudiante.filter(m => m.estado === EstadoMateria.APLAZADA).length;

    // Calcular créditos
    const creditosAprobados = materiasEstudiante
      .filter(m => m.estado === EstadoMateria.APROBADA)
      .reduce((sum, m) => sum + m.materia.creditos, 0);

    const creditosEnCurso = materiasEstudiante
      .filter(m => m.estado === EstadoMateria.EN_CURSO)
      .reduce((sum, m) => sum + m.materia.creditos, 0);

    // Calcular promedio general
    const materiasConNota = materiasEstudiante.filter(m => m.nota && m.estado === EstadoMateria.APROBADA);
    const promedioGeneral = materiasConNota.length > 0
      ? materiasConNota.reduce((sum, m) => sum + (m.nota || 0), 0) / materiasConNota.length
      : 0;

    // Obtener información de la carrera para calcular progreso
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

    // Calcular progreso de la carrera
    let progresoCarrera = 0;
    if (user?.carrera?.materias) {
      const totalMateriasCarrera = user.carrera.materias.length;
      const materiasCursadas = materiasEstudiante.filter(m => 
        m.estado === EstadoMateria.APROBADA || m.estado === EstadoMateria.EN_CURSO
      ).length;
      
      progresoCarrera = totalMateriasCarrera > 0 
        ? (materiasCursadas / totalMateriasCarrera) * 100 
        : 0;
    }

    const estadisticas = {
      totalMaterias,
      materiasAprobadas,
      materiasEnCurso,
      materiasAplazadas,
      creditosAprobados,
      creditosEnCurso,
      promedioGeneral,
      progresoCarrera,
    };

    return NextResponse.json({
      materiasEstudiante,
      estadisticas,
    });

  } catch (error) {
    console.error("Error fetching academic dashboard:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 