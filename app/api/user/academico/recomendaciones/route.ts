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

    // Obtener información del usuario y su carrera
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        carrera: {
          include: {
            materias: {
              include: {
                prerrequisitos: {
                  include: {
                    prerrequisito: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user?.carrera) {
      return NextResponse.json(
        { error: "Usuario no tiene carrera asignada" },
        { status: 400 }
      );
    }

    // Obtener materias del estudiante
    const materiasEstudiante = await db.materiaEstudiante.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        materia: true,
      },
    });

    // Crear un mapa de materias aprobadas para fácil acceso
    const materiasAprobadas = new Set(
      materiasEstudiante
        .filter(m => m.estado === EstadoMateria.APROBADA)
        .map(m => m.materiaId)
    );

    const materiasEnCurso = new Set(
      materiasEstudiante
        .filter(m => m.estado === EstadoMateria.EN_CURSO)
        .map(m => m.materiaId)
    );

    // Función para verificar si una materia puede ser cursada
    const puedeCursar = (materia: any) => {
      // Si ya está aprobada o en curso, no puede ser recomendada
      if (materiasAprobadas.has(materia.id) || materiasEnCurso.has(materia.id)) {
        return false;
      }

      // Verificar prerrequisitos
      for (const prerreq of materia.prerrequisitos) {
        if (!materiasAprobadas.has(prerreq.prerrequisitoId)) {
          return false;
        }
      }

      return true;
    };

    // Obtener materias recomendadas
    const materiasRecomendadas = user.carrera.materias
      .filter(puedeCursar)
      .sort((a, b) => {
        // Ordenar por semestre
        const semA = parseInt(a.semestre.replace('S', ''));
        const semB = parseInt(b.semestre.replace('S', ''));
        return semA - semB;
      });

    // Agrupar por semestre
    const materiasPorSemestre = materiasRecomendadas.reduce((acc, materia) => {
      const semestre = materia.semestre;
      if (!acc[semestre]) {
        acc[semestre] = [];
      }
      acc[semestre].push(materia);
      return acc;
    }, {} as Record<string, any[]>);

    // Obtener el próximo semestre recomendado
    const proximoSemestre = Object.keys(materiasPorSemestre)[0] || null;
    const materiasProximoSemestre = proximoSemestre ? materiasPorSemestre[proximoSemestre] || [] : [];

    // Calcular estadísticas
    const totalMateriasCarrera = user.carrera.materias.length;
    const materiasCursadas = materiasAprobadas.size + materiasEnCurso.size;
    const progreso = totalMateriasCarrera > 0 ? (materiasCursadas / totalMateriasCarrera) * 100 : 0;

    // Generar recomendaciones personalizadas
    const recomendaciones = [];

    if (materiasProximoSemestre.length > 0) {
      recomendaciones.push({
        tipo: "proximo_semestre",
        titulo: `Materias recomendadas para ${proximoSemestre}`,
        descripcion: `Basado en tu progreso actual, estas son las materias que puedes cursar en ${proximoSemestre}`,
        materias: materiasProximoSemestre.slice(0, 6), // Máximo 6 materias
        prioridad: "alta"
      });
    }

    // Recomendación de materias electivas si aplica
    const materiasElectivas = materiasRecomendadas.filter(m => 
      m.nombre.toLowerCase().includes('electiva') || 
      m.nombre.toLowerCase().includes('optativa')
    );

    if (materiasElectivas.length > 0) {
      recomendaciones.push({
        tipo: "electivas",
        titulo: "Materias Electivas Disponibles",
        descripcion: "Considera estas materias electivas para complementar tu formación",
        materias: materiasElectivas.slice(0, 4),
        prioridad: "media"
      });
    }

    // Recomendación de materias de semestres avanzados
    const materiasAvanzadas = materiasRecomendadas.filter(m => {
      const semestre = parseInt(m.semestre.replace('S', ''));
      return semestre > 6; // Semestres 7 en adelante
    });

    if (materiasAvanzadas.length > 0) {
      recomendaciones.push({
        tipo: "avanzadas",
        titulo: "Materias de Semestres Avanzados",
        descripcion: "Estas materias están disponibles para tu nivel actual",
        materias: materiasAvanzadas.slice(0, 4),
        prioridad: "baja"
      });
    }

    return NextResponse.json({
      proximoSemestre,
      materiasProximoSemestre,
      materiasPorSemestre,
      recomendaciones,
      estadisticas: {
        totalMateriasCarrera,
        materiasCursadas,
        materiasAprobadas: materiasAprobadas.size,
        materiasEnCurso: materiasEnCurso.size,
        progreso,
        materiasDisponibles: materiasRecomendadas.length,
      },
    });

  } catch (error) {
    console.error("Error generating recommendations:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 