import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Obtener todas las solicitudes del usuario
    const solicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: session.user.id,
        estado: {
          not: "FINALIZADA"
        }
      },
      include: {
        documento: {
          include: {
            servicio: true
          }
        },
        usuario: true,
        familiar: true,
        detalle: true,
        nota: {
          select: {
            id: true,
            contenido: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transformar las solicitudes para el formato esperado
    const transformedSolicitudes = solicitudes.map(solicitud => ({
      id: solicitud.id.toString(),
      estado: solicitud.estado,
      fecha: solicitud.createdAt.toISOString(),
      prioridad: "NORMAL",
      documento: {
        id: solicitud.documento.id,
        nombre: solicitud.documento.nombre,
        servicio: {
          id: solicitud.documento.servicio.id,
          nombre: solicitud.documento.servicio.nombre
        }
      },
      client: {
        id: solicitud.usuario.id,
        name: solicitud.usuario.name || "",
        email: solicitud.usuario.email || "",
        avatar: solicitud.usuario.image || "/default-avatar.png"
      },
      familiar: solicitud.familiar ? {
        id: solicitud.familiar.id,
        name: solicitud.familiar.nombre,
        email: solicitud.familiar.telefono || "",
        avatar: "/default-avatar.png"
      } : null,
      detalle: solicitud.detalle ? {
        Testigo1: solicitud.detalle.Testigo1 || undefined,
        Testigo2: solicitud.detalle.Testigo2 || undefined,
        Testigo3: solicitud.detalle.Testigo3 || undefined,
        Testigo4: solicitud.detalle.Testigo4 || undefined,
        generic_text: solicitud.detalle.generic_text || undefined,
        bienes_generico1: solicitud.detalle.bienes_generico1 || undefined,
        bienes_generico2: solicitud.detalle.bienes_generico2 || undefined,
        bienes_generico3: solicitud.detalle.bienes_generico3 || undefined,
        bienes_generico4: solicitud.detalle.bienes_generico4 || undefined,
        bienes_generico5: solicitud.detalle.bienes_generico5 || undefined,
        Acta_de_nacimiento: solicitud.detalle.Acta_de_nacimiento || undefined,
        Acta_de_matrimonio: solicitud.detalle.Acta_de_matrimonio || undefined,
        Acta_de_defuncion: solicitud.detalle.Acta_de_defuncion || undefined,
        Acta_de_divorcio: solicitud.detalle.Acta_de_divorcio || undefined
      } : null,
      nota: solicitud.nota ? {
        id: solicitud.nota.id,
        contenido: solicitud.nota.contenido,
        createdAt: solicitud.nota.createdAt.toISOString()
      } : null
    }));

    return NextResponse.json(transformedSolicitudes);
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 