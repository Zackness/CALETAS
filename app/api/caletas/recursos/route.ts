import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Obtener recursos de Caletas
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const misRecursos = searchParams.get('misRecursos') === 'true';

    // Construir filtros según el tipo de consulta
    const whereClause: any = {};

    if (misRecursos) {
      // Solo recursos del usuario actual
      whereClause.autorId = session.user.id;
    } else {
      // Recursos públicos, del usuario y favoritos
      whereClause.OR = [
        { esPublico: true },
        { autorId: session.user.id },
        {
          calificaciones: {
            some: {
              usuarioId: session.user.id,
              calificacion: { gte: 4 }
            }
          }
        }
      ];
    }

    // Obtener recursos según los filtros
    const recursos = await db.recurso.findMany({
      where: whereClause,
      include: {
        materia: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            semestre: true,
          },
        },
        autor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        calificaciones: {
          where: {
            usuarioId: session.user.id
          },
          select: {
            calificacion: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json({
      recursos,
    });

  } catch (error) {
    console.error("Error fetching recursos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// POST - Crear nuevo recurso
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      titulo, 
      descripcion, 
      tipo, 
      contenido, 
      archivoUrl, 
      materiaId, 
      esPublico, 
      tags 
    } = body;

    if (!titulo || !descripcion || !tipo || !contenido || !materiaId) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Validar que la materia pertenece a la carrera del usuario
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        carrera: {
          include: {
            materias: {
              where: { id: materiaId }
            }
          }
        }
      }
    });

    if (!user?.carrera?.materias.length) {
      return NextResponse.json(
        { error: "Materia no encontrada en tu carrera" },
        { status: 404 }
      );
    }

    // Crear el recurso
    const recurso = await db.recurso.create({
      data: {
        titulo,
        descripcion,
        tipo,
        contenido,
        archivoUrl,
        materiaId,
        autorId: session.user.id,
        esPublico: esPublico ?? true,
        tags: tags || "",
      },
      include: {
        materia: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            semestre: true,
          },
        },
        autor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Recurso creado exitosamente",
      recurso,
    });

  } catch (error) {
    console.error("Error creating recurso:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 