import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Obtener caletas recientes del usuario
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
    const usuarioId = searchParams.get('usuarioId') || session.user.id;

    const caletasRecientes = await db.caleta.findMany({
      where: {
        usuarioId: usuarioId,
        isActive: true
      },
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
        },
        favoritos: {
          where: {
            usuarioId: session.user.id
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit,
      skip: offset
    });

    // Transformar los datos para incluir isFavorita
    const caletasTransformadas = caletasRecientes.map(caleta => ({
      ...caleta,
      isFavorita: caleta.favoritos.length > 0,
      favoritos: undefined // Remover el array de favoritos del response
    }));

    return NextResponse.json(caletasTransformadas);

  } catch (error) {
    console.error("Error fetching caletas recientes:", error);
    return NextResponse.json(
      { error: "Error al obtener las caletas recientes" },
      { status: 500 }
    );
  }
} 