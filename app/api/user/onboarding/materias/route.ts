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
        },
        esPrerrequisitoDe: {
          select: {
            tipoPrerrequisito: true,
            materia: {
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

    return NextResponse.json(materias);
  } catch (error) {
    console.error("Error fetching materias:", error);
    return NextResponse.json(
      { error: "Error al obtener las materias" },
      { status: 500 }
    );
  }
} 