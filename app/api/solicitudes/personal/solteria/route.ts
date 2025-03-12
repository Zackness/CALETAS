import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Datos recibidos:", body);

    const { usuarioId, familiarId, testigo1, testigo2 } = body;

    // Log de validación
    console.log("Validación de datos:", {
      hasUsuarioId: !!usuarioId,
      hasFamiliarId: !!familiarId,
      hasTestigo1: !!testigo1,
      hasTestigo2: !!testigo2
    });

    // Validar los datos recibidos
    if (!usuarioId || !testigo1 || !testigo2) {
      return NextResponse.json({ 
        error: 'Faltan datos requeridos',
        missing: {
          usuarioId: !usuarioId,
          testigo1: !testigo1,
          testigo2: !testigo2
        }
      }, { status: 400 });
    }

    // Verificar que el documento existe
    const documento = await db.documento.findUnique({
      where: { id: "a3d50fb4-0fc3-4f6f-81a7-16786dce301a" }
    });

    if (!documento) {
      console.error("Documento no encontrado");
      return NextResponse.json({ 
        error: "El tipo de documento no existe",
        documentoId: "a3d50fb4-0fc3-4f6f-81a7-16786dce301a"
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
        usuarioId,
        familiarId,
        documentoId: documento.id,
      },
    });

    console.log("Solicitud creada:", solicitud);

    console.log("Intentando crear detalle con:", {
      solicitudId: solicitud.id,
      Testigo1: testigo1,
      Testigo2: testigo2
    });

    // Crear el detalle usando el ID de la solicitud
    const detalle = await db.detalle.create({
      data: {
        solicitudId: solicitud.id,
        Testigo1: testigo1,
        Testigo2: testigo2,
      },
    });

    console.log("Detalle creado:", detalle);

    // Obtener la solicitud completa con su detalle
    const solicitudCompleta = await db.solicitud.findUnique({
      where: { id: solicitud.id },
      include: { detalle: true }
    });

    return NextResponse.json({ 
      succes: "Solicitud creada exitosamente.", 
      solicitud: solicitudCompleta 
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