import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { materiasSeleccionadas } = await req.json();

    if (!materiasSeleccionadas || !Array.isArray(materiasSeleccionadas)) {
      return NextResponse.json(
        { error: "Lista de materias seleccionadas es requerida" },
        { status: 400 }
      );
    }

    // Obtener todas las materias seleccionadas con sus prerrequisitos
    const materiasConPrerrequisitos = await db.materia.findMany({
      where: {
        id: {
          in: materiasSeleccionadas
        }
      },
      include: {
        prerrequisitos: {
          include: {
            prerrequisito: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                semestre: true
              }
            }
          }
        }
      }
    });

    const errores: string[] = [];
    const materiasFaltantes: string[] = [];

    // Verificar cada materia seleccionada
    for (const materia of materiasConPrerrequisitos) {
      for (const prerreq of materia.prerrequisitos) {
        const prerrequisito = prerreq.prerrequisito;
        
        // Solo validar si el prerrequisito está en un semestre posterior al de la materia actual
        // Esto permite seleccionar materias de semestres avanzados sin forzar prerrequisitos
        const semestreMateria = parseInt(materia.semestre.replace('S', ''));
        const semestrePrerreq = parseInt(prerrequisito.semestre.replace('S', ''));
        
        // Si el prerrequisito está en un semestre posterior, es un error lógico
        if (semestrePrerreq > semestreMateria) {
          const errorMsg = `❌ ${materia.codigo} - ${materia.nombre} (${materia.semestre}) no puede ser prerrequisito de ${prerrequisito.codigo} - ${prerrequisito.nombre} (${prerrequisito.semestre})`;
          errores.push(errorMsg);
        }
        // Si el prerrequisito está en el mismo semestre o anterior, está bien
        // No necesitamos validar que esté en la lista porque se marcará automáticamente como aprobado
      }
    }

    // Obtener información de las materias faltantes para sugerencias
    const materiasFaltantesInfo = materiasFaltantes.length > 0 ? await db.materia.findMany({
      where: {
        id: {
          in: materiasFaltantes
        }
      },
      select: {
        id: true,
        codigo: true,
        nombre: true,
        semestre: true,
        creditos: true
      }
    }) : [];

    const resultado = {
      esValido: errores.length === 0,
      errores,
      materiasFaltantes: materiasFaltantesInfo,
      sugerencias: materiasFaltantesInfo.map(m => ({
        id: m.id,
        codigo: m.codigo,
        nombre: m.nombre,
        semestre: m.semestre,
        creditos: m.creditos,
        mensaje: `Agregar ${m.codigo} - ${m.nombre} (${m.semestre})`
      }))
    };

    return NextResponse.json(resultado);

  } catch (error) {
    console.error("Error validando materias:", error);
    return NextResponse.json(
      { error: "Error al validar las materias" },
      { status: 500 }
    );
  }
} 