import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";
import { canAccessFullCaletasPlan, getActiveSubscriptionForUser } from "@/lib/subscription";

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
    const misRecursos = searchParams.get("misRecursos") === "true";

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { universidadId: true },
    });
    const subscription = await getActiveSubscriptionForUser(session.user.id);
    const hasFullCaletasPlan = canAccessFullCaletasPlan(subscription);

    let whereClause: object;
    if (misRecursos) {
      whereClause = { autorId: session.user.id };
    } else if (hasFullCaletasPlan) {
      whereClause = {};
    } else if (!user?.universidadId) {
      whereClause = {
        OR: [{ universidadId: null }, { autorId: session.user.id }],
      };
    } else {
      whereClause = {
        OR: [
          { universidadId: null },
          { universidadId: user.universidadId },
          { autorId: session.user.id },
        ],
      };
    }

    const recursos = await db.recurso.findMany({
      where: whereClause,
      include: {
        materia: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            semestre: true,
            carrera: {
              select: {
                universidadId: true,
              },
            },
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
            usuarioId: session.user.id,
          },
          select: {
            calificacion: true,
          },
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
      orderBy: [{ createdAt: "desc" }],
    });

    const recursosConFavorito = recursos.map(({ favoritos, ...r }) => {
      const masked = maskAutorIfAnon(r as any, session.user.id);
      return {
        ...masked,
        isFavorito: favoritos.length > 0,
      };
    });

    return withCors(
      NextResponse.json({
        recursos: recursosConFavorito,
        restrictions: {
          fullCaletasPlanLocked: !misRecursos && !hasFullCaletasPlan,
        },
      }),
      request,
    );
  } catch (error) {
    console.error("Error fetching recursos:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
}

// POST - Crear nuevo recurso (JSON; subidas con archivo usan /api/caletas/upload-cpanel)
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
      tags,
    } = body;

    if (!titulo || !descripcion || !tipo || !contenido) {
      return withCors(NextResponse.json({ error: "Faltan campos obligatorios" }, { status: 400 }), request);
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { universidadId: true, carreraId: true },
    });

    let finalMateriaId: string | null = typeof materiaId === "string" && materiaId.trim() ? materiaId.trim() : null;
    let finalUniversidadId: string | null = null;

    if (user?.universidadId) {
      if (!finalMateriaId || !user.carreraId) {
        return withCors(
          NextResponse.json({ error: "Debes tener carrera y seleccionar una materia de tu pensum" }, { status: 400 }),
          request,
        );
      }
      const ok = await db.materia.findFirst({
        where: {
          id: finalMateriaId,
          carreraId: user.carreraId,
          carrera: { universidadId: user.universidadId },
        },
        select: { id: true },
      });
      if (!ok) {
        return withCors(NextResponse.json({ error: "Materia no válida para tu universidad y carrera" }, { status: 404 }), request);
      }
      finalUniversidadId = user.universidadId;
    } else {
      finalMateriaId = null;
      finalUniversidadId = null;
    }

    const recurso = await db.recurso.create({
      data: {
        titulo,
        descripcion,
        tipo,
        contenido,
        archivoUrl,
        archivoSizeBytes: typeof archivoSizeBytes === "number" ? archivoSizeBytes : undefined,
        materiaId: finalMateriaId,
        universidadId: finalUniversidadId,
        autorId: session.user.id,
        esPublico: esPublico !== false,
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

    return withCors(
      NextResponse.json({
        message: "Recurso creado exitosamente",
        recurso: maskAutorIfAnon(recurso as any, session.user.id),
      }),
      request,
    );
  } catch (error) {
    console.error("Error creating recurso:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
}
