import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

const ANON_AUTHOR = {
  id: "anon",
  name: "Anónimo",
  email: null as string | null,
};

const maskAutorIfAnon = <T extends { esAnonimo?: boolean; autorId?: string; autor?: any }>(
  recurso: T,
  viewerUserId: string,
): T => {
  if (!recurso?.esAnonimo) return recurso;
  if (recurso.autorId === viewerUserId) return recurso;
  return {
    ...recurso,
    autor: ANON_AUTHOR,
  };
};

// GET - Obtener recursos de Caletas
export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const { searchParams } = new URL(request.url);
    const misRecursos = searchParams.get('misRecursos') === 'true';

    // Construir filtros según el tipo de consulta
    // Todos los recursos son visibles para todos los estudiantes.
    // `misRecursos=true` se mantiene para filtrar por autor.
    const whereClause: any = misRecursos ? { autorId: session.user.id } : {};

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
        },
        favoritos: {
          where: {
            usuarioId: session.user.id,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
    });

    const recursosConFavorito = recursos.map(({ favoritos, ...r }) => {
      const masked = maskAutorIfAnon(r as any, session.user.id);
      return {
        ...masked,
        isFavorito: favoritos.length > 0,
      };
    });

    return withCors(NextResponse.json({ recursos: recursosConFavorito }), request);
  } catch (error) {
    console.error("Error fetching recursos:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
}

// POST - Crear nuevo recurso
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const body = await request.json();
    const { 
      titulo, 
      descripcion, 
      tipo, 
      contenido, 
      archivoUrl, 
      archivoSizeBytes,
      materiaId, 
      esPublico, 
      esAnonimo,
      tags 
    } = body;

    if (!titulo || !descripcion || !tipo || !contenido || !materiaId) {
      return withCors(NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 }), request);
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
      return withCors(NextResponse.json({ error: "Materia no encontrada en tu carrera" }, { status: 404 }), request);
    }

    // Crear el recurso
    const recurso = await db.recurso.create({
      data: {
        titulo,
        descripcion,
        tipo,
        contenido,
        archivoUrl,
        archivoSizeBytes: typeof archivoSizeBytes === "number" ? archivoSizeBytes : undefined,
        materiaId,
        autorId: session.user.id,
        esPublico: true,
        esAnonimo: !!esAnonimo,
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

    return withCors(NextResponse.json({
      message: "Recurso creado exitosamente",
      recurso: maskAutorIfAnon(recurso as any, session.user.id),
    }), request);
  } catch (error) {
    console.error("Error creating recurso:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
} 