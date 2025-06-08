import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";
import { auth } from "@/auth";
import { Estado } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    console.log("Datos recibidos:", body);

    const { usuarioId, familiarId, testigo1, testigo2, actaNacimiento } = body;

    // Log de validación
    console.log("Validación de datos:", {
      hasUsuarioId: !!usuarioId,
      hasFamiliarId: !!familiarId,
      hasTestigo1: !!testigo1,
      hasTestigo2: !!testigo2,
      hasActaNacimiento: !!actaNacimiento
    });

    // Validar los datos recibidos
    if (!usuarioId || !testigo1 || !testigo2 || !actaNacimiento) {
      return NextResponse.json({ 
        error: 'Faltan datos requeridos',
        missing: {
          usuarioId: !usuarioId,
          testigo1: !testigo1,
          testigo2: !testigo2,
          actaNacimiento: !actaNacimiento
        }
      }, { status: 400 });
    }

    // Obtener el ID del documento de soltería
    const documento = await db.documento.findFirst({
      where: {
        nombre: "Solteria",
        servicio: {
          nombre: "PREVISION PERSONAL"
        }
      }
    });

    if (!documento) {
      console.error("Documento no encontrado");
      return NextResponse.json({ 
        error: "El tipo de documento no existe",
        documentoId: "personal-doc-id"
      }, { status: 400 });
    }

    console.log("Intentando crear solicitud con:", {
      usuarioId,
      familiarId,
      documentoId: documento.id
    });

    // Crear la solicitud
    const solicitud = await db.solicitud.create({
      data: {
        documentoId: documento.id,
        usuarioId,
        familiarId,
        estado: Estado.PENDIENTE,
        detalle: {
          create: {
            Testigo1: testigo1,
            Testigo2: testigo2,
            bienes_generico1: actaNacimiento, // Usamos bienes_generico1 para el acta de nacimiento
          }
        }
      }
    });

    console.log("Solicitud creada:", solicitud);

    // Actualizar la solicitud para usar la nota predefinida
    const solicitudActualizada = await db.solicitud.update({
      where: { id: solicitud.id },
      data: {
        nota: {
          connect: {
            id: "e20313fa-a6a3-4585-8b1f-9151452976a1"
          }
        }
      },
      include: { 
        detalle: true,
        nota: true
      }
    });

    console.log("Solicitud actualizada con nota predefinida:", solicitudActualizada);

    return NextResponse.json({ 
      succes: "Solicitud creada exitosamente.", 
      solicitud: solicitudActualizada 
    }, { status: 200 });
  } catch (error: any) {
    console.error("Error interno del servidor:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack
    });

    // Si es un error de Prisma, puede tener información adicional
    if (error.code) {
      return NextResponse.json({ 
        error: 'Error de base de datos',
        details: error.message,
        code: error.code,
        meta: error.meta
      }, { status: 400 });
    }

    return NextResponse.json({ 
      error: 'Error interno del servidor',
      details: error.message
    }, { status: 500 });
  }
}