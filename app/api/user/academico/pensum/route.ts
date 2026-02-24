import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

    // Obtener el usuario con su carrera
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        carrera: {
          include: {
            materias: {
              include: {
                prerrequisitos: {
                  include: {
                    prerrequisito: {
                      select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                        semestre: true,
                        creditos: true
                      }
                    }
                  }
                }
              },
              orderBy: [
                { semestre: 'asc' },
                { codigo: 'asc' }
              ]
            }
          }
        }
      }
    });

    if (!user?.carrera) {
      return NextResponse.json(
        { error: "Usuario no tiene carrera asignada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      materias: user.carrera.materias,
    });

  } catch (error) {
    console.error("Error fetching pensum:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 