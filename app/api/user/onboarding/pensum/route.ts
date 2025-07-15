import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const carreraId = searchParams.get('carreraId');

    if (!carreraId) {
      return NextResponse.json(
        { error: "ID de carrera es requerido" },
        { status: 400 }
      );
    }

    // Obtener la carrera con información de la universidad
    const carrera = await db.carrera.findUnique({
      where: {
        id: carreraId,
        isActive: true
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        descripcion: true,
        duracion: true,
        creditos: true,
        universidad: {
          select: {
            nombre: true,
            siglas: true
          }
        }
      }
    });

    if (!carrera) {
      return NextResponse.json(
        { error: "Carrera no encontrada" },
        { status: 404 }
      );
    }

    // Obtener todas las materias de la carrera
    const materias = await db.materia.findMany({
      where: {
        carreraId: carreraId,
        isActive: true
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        descripcion: true,
        creditos: true,
        semestre: true,
        horasTeoria: true,
        horasPractica: true,
        prerrequisitos: {
          select: {
            tipoPrerrequisito: true,
            prerrequisito: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                semestre: true
              }
            }
          }
        }
      },
      orderBy: [
        { semestre: 'asc' },
        { nombre: 'asc' }
      ]
    });

    // Organizar materias por semestre
    const pensumPorSemestre: { [key: string]: any[] } = {};
    let totalCreditos = 0;

    materias.forEach(materia => {
      const semestreKey = materia.semestre.toString();
      if (!pensumPorSemestre[semestreKey]) {
        pensumPorSemestre[semestreKey] = [];
      }
      pensumPorSemestre[semestreKey].push(materia);
      totalCreditos += materia.creditos;
    });

    // Convertir a array ordenado
    const semestres = Object.keys(pensumPorSemestre)
      .map(Number)
      .sort((a, b) => a - b)
      .map(semestre => ({
        semestre,
        materias: pensumPorSemestre[semestre],
        creditosSemestre: pensumPorSemestre[semestre].reduce((sum, materia) => sum + materia.creditos, 0)
      }));

    return NextResponse.json({
      carrera,
      semestres,
      totalCreditos,
      totalSemestres: carrera.duracion
    });

  } catch (error) {
    console.error("Error fetching pensum:", error);
    return NextResponse.json(
      { error: "Error al obtener el pensum" },
      { status: 500 }
    );
  }
} 