import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Obtener todas las universidades con carreras y materias
export async function GET(req: NextRequest) {
  try {
    const universidades = await db.universidad.findMany({
      where: {
        isActive: true
      },
      include: {
        carreras: {
          where: {
            isActive: true
          },
          include: {
            materias: {
              where: {
                isActive: true
              },
              select: {
                id: true,
                nombre: true,
                codigo: true,
                semestre: true
              },
              orderBy: [
                { semestre: 'asc' },
                { nombre: 'asc' }
              ]
            }
          },
          orderBy: {
            nombre: 'asc'
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(universidades);

  } catch (error) {
    console.error("Error fetching universidades:", error);
    return NextResponse.json(
      { error: "Error al obtener las universidades" },
      { status: 500 }
    );
  }
} 