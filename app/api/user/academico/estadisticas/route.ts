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

    // Calcular estadísticas básicas
    const totalMaterias = materiasEstudiante.length;
    const materiasAprobadas = materiasEstudiante.filter(m => m.estado === EstadoMateria.APROBADA).length;
    const materiasEnCurso = materiasEstudiante.filter(m => m.estado === EstadoMateria.EN_CURSO).length;
    const materiasAplazadas = materiasEstudiante.filter(m => m.estado === EstadoMateria.APLAZADA).length;
    const materiasRetiradas = materiasEstudiante.filter(m => m.estado === EstadoMateria.RETIRADA).length;

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

    // Calcular materias por estado
    const materiasPorEstado = {
      [EstadoMateria.APROBADA]: materiasAprobadas,
      [EstadoMateria.EN_CURSO]: materiasEnCurso,
      [EstadoMateria.APLAZADA]: materiasAplazadas,
      [EstadoMateria.RETIRADA]: materiasRetiradas,
      [EstadoMateria.NO_CURSADA]: totalMaterias - materiasAprobadas - materiasEnCurso - materiasAplazadas - materiasRetiradas,
    };

    // Calcular promedio por semestre
    const promedioPorSemestre: Record<string, number> = {};
    const creditosPorSemestre: Record<string, number> = {};
    const materiasPorSemestre: Record<string, any[]> = {};

    materiasEstudiante.forEach(materia => {
      const semestre = materia.materia.semestre;
      
      if (!materiasPorSemestre[semestre]) {
        materiasPorSemestre[semestre] = [];
      }
      materiasPorSemestre[semestre].push(materia);

      if (!creditosPorSemestre[semestre]) {
        creditosPorSemestre[semestre] = 0;
      }
      creditosPorSemestre[semestre] += materia.materia.creditos;
    });

    // Calcular promedio por semestre
    Object.keys(materiasPorSemestre).forEach(semestre => {
      const materiasConNotaEnSemestre = materiasPorSemestre[semestre].filter(
        m => m.nota && m.estado === EstadoMateria.APROBADA
      );
      
      if (materiasConNotaEnSemestre.length > 0) {
        promedioPorSemestre[semestre] = materiasConNotaEnSemestre.reduce(
          (sum, m) => sum + (m.nota || 0), 0
        ) / materiasConNotaEnSemestre.length;
      } else {
        promedioPorSemestre[semestre] = 0;
      }
    });

    // Crear array de rendimiento por semestre
    const rendimientoPorSemestre = Object.keys(materiasPorSemestre).map(semestre => ({
      semestre,
      promedio: promedioPorSemestre[semestre] || 0,
      materias: materiasPorSemestre[semestre].length,
      creditos: creditosPorSemestre[semestre] || 0,
    })).sort((a, b) => {
      const semA = parseInt(a.semestre.replace('S', ''));
      const semB = parseInt(b.semestre.replace('S', ''));
      return semA - semB;
    });

    const estadisticasDetalladas = {
      totalMaterias,
      materiasAprobadas,
      materiasEnCurso,
      materiasAplazadas,
      materiasRetiradas,
      creditosAprobados,
      creditosEnCurso,
      promedioGeneral,
      progresoCarrera,
      promedioPorSemestre,
      materiasPorEstado,
      creditosPorSemestre,
      rendimientoPorSemestre,
    };

    return NextResponse.json(estadisticasDetalladas);

  } catch (error) {
    console.error("Error fetching detailed statistics:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 