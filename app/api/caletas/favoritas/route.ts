import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Obtener caletas favoritas del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const caletasFavoritas = await db.caletaFavorita.findMany({
      where: {
        usuarioId: session.user.id
      },
      include: {
        caleta: {
          include: {
            materia: {
              include: {
                carrera: {
                  include: {
                    universidad: true
                  }
                }
              }
            },
            usuario: {
              select: {
                id: true,
                name: true,
                image: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Transformar los datos para incluir isFavorita: true
    const caletasTransformadas = caletasFavoritas.map(favorita => ({
      ...favorita.caleta,
      isFavorita: true,
      fechaFavorito: favorita.createdAt
    }));

    return NextResponse.json(caletasTransformadas);

  } catch (error) {
    console.error("Error fetching favoritas:", error);
    return NextResponse.json(
      { error: "Error al obtener las caletas favoritas" },
      { status: 500 }
    );
  }
} 