import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const ANON_AUTHOR = {
  id: "anon",
  name: "Anónimo",
  email: null as string | null,
};

const maskFavorito = (favorito: any, viewerUserId: string) => {
  const recurso = favorito?.recurso;
  if (!recurso?.esAnonimo) return favorito;
  if (recurso.autorId === viewerUserId) return favorito;
  return {
    ...favorito,
    recurso: {
      ...recurso,
      autor: ANON_AUTHOR,
    },
  };
};

// POST: Agregar a favoritos
export async function POST(request: NextRequest) {
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

    const { recursoId } = await request.json();

    if (!recursoId) {
      return NextResponse.json(
        { error: "ID del recurso es requerido" },
        { status: 400 }
      );
    }

    // Verificar que el recurso existe
    const recurso = await db.recurso.findUnique({
      where: { id: recursoId }
    });

    if (!recurso) {
      return NextResponse.json(
        { error: "Recurso no encontrado" },
        { status: 404 }
      );
    }

    // Verificar si ya está en favoritos
    const favoritoExistente = await db.favorito.findUnique({
      where: {
        usuarioId_recursoId: {
          usuarioId: session.user.id,
          recursoId: recursoId
        }
      }
    });

    if (favoritoExistente) {
      return NextResponse.json(
        { error: "El recurso ya está en favoritos" },
        { status: 400 }
      );
    }

    // Agregar a favoritos
    const favorito = await db.favorito.create({
      data: {
        usuarioId: session.user.id,
        recursoId: recursoId
      },
      include: {
        recurso: {
          include: {
            materia: true,
            autor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      favorito: maskFavorito(favorito, session.user.id),
      message: "Recurso agregado a favoritos"
    }, { status: 201 });

  } catch (error) {
    console.error("Error agregando a favoritos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// DELETE: Quitar de favoritos
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const recursoId = searchParams.get('recursoId');

    if (!recursoId) {
      return NextResponse.json(
        { error: "ID del recurso es requerido" },
        { status: 400 }
      );
    }

    // Eliminar de favoritos
    const favorito = await db.favorito.deleteMany({
      where: {
        usuarioId: session.user.id,
        recursoId: recursoId
      }
    });

    return NextResponse.json({
      success: true,
      message: "Recurso eliminado de favoritos"
    });

  } catch (error) {
    console.error("Error eliminando de favoritos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

// GET: Obtener favoritos del usuario
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

    const favoritos = await db.favorito.findMany({
      where: {
        usuarioId: session.user.id
      },
      include: {
        recurso: {
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
            autor: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({
      success: true,
      favoritos: favoritos.map((f) => maskFavorito(f, session.user.id)),
    });

  } catch (error) {
    console.error("Error obteniendo favoritos:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
