import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Obtener todas las caletas con información de favoritos
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
    const materiaId = searchParams.get('materiaId');
    const carreraId = searchParams.get('carreraId');
    const usuarioId = searchParams.get('usuarioId'); // Para filtrar por usuario específico

    // Construir filtros
    const where: any = {
      isActive: true,
    };

    if (materiaId) {
      where.materiaId = materiaId;
    }

    if (carreraId) {
      where.carreraId = carreraId;
    }

    if (usuarioId) {
      where.usuarioId = usuarioId;
    }

    const caletas = await db.caleta.findMany({
      where,
      include: {
        materia: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            semestre: true,
            carrera: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                universidad: {
                  select: {
                    id: true,
                    nombre: true,
                    siglas: true,
                  }
                }
              }
            }
          }
        },
        usuario: {
          select: {
            id: true,
            name: true,
            image: true,
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
      }
    });

    // Transformar los datos para incluir isFavorita
    const caletasConFavoritos = caletas.map(caleta => ({
      ...caleta,
      isFavorita: caleta.favoritos.length > 0,
      favoritos: undefined // Remover el array de favoritos del response
    }));

    return NextResponse.json(caletasConFavoritos);

  } catch (error) {
    console.error("Error fetching caletas:", error);
    return NextResponse.json(
      { error: "Error al obtener las caletas" },
      { status: 500 }
    );
  }
}

// POST - Crear nueva caleta
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { nombre, tema, urlArchivo, tipoArchivo, tamanio, carreraId, materiaId } = body;

    // Validar campos requeridos
    if (!nombre || !tema || !urlArchivo || !tipoArchivo || !carreraId || !materiaId) {
      return NextResponse.json(
        { error: "Todos los campos son requeridos" },
        { status: 400 }
      );
    }

    // Verificar que la materia pertenece a la carrera
    const materia = await db.materia.findFirst({
      where: {
        id: materiaId,
        carreraId: carreraId,
        isActive: true
      }
    });

    if (!materia) {
      return NextResponse.json(
        { error: "La materia no pertenece a la carrera especificada" },
        { status: 400 }
      );
    }

    // Crear la caleta
    const caleta = await db.caleta.create({
      data: {
        nombre,
        tema,
        urlArchivo,
        tipoArchivo,
        tamanio: tamanio || 0,
        carreraId,
        materiaId,
        usuarioId: session.user.id,
      },
      include: {
        materia: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            semestre: true,
            carrera: {
              select: {
                id: true,
                nombre: true,
                codigo: true,
                universidad: {
                  select: {
                    id: true,
                    nombre: true,
                    siglas: true,
                  }
                }
              }
            }
          }
        },
        usuario: {
          select: {
            id: true,
            name: true,
            image: true,
          }
        }
      }
    });

    // Agregar isFavorita: false para caletas recién creadas
    const caletaConFavorito = {
      ...caleta,
      isFavorita: false
    };

    return NextResponse.json(caletaConFavorito, { status: 201 });

  } catch (error) {
    console.error("Error creating caleta:", error);
    return NextResponse.json(
      { error: "Error al crear la caleta" },
      { status: 500 }
    );
  }
} 