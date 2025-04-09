import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Datos recibidos:", body);

    const { 
      usuarioId, 
      familiarId, 
      nombreConyuge, 
      cedulaConyuge, 
      testigo3, 
      bien1, 
      bien2, 
      bien3, 
      bien4, 
      bien5,
      genericText
    } = body;

    // Log de validación
    console.log("Validación de datos:", {
      hasUsuarioId: !!usuarioId,
      hasFamiliarId: !!familiarId,
      hasNombreConyuge: !!nombreConyuge,
      hasCedulaConyuge: !!cedulaConyuge,
      hasTestigo3: !!testigo3,
      hasBienes: !!(bien1 || bien2 || bien3 || bien4 || bien5),
      hasGenericText: !!genericText
    });

    // Validar los datos recibidos
    if (!usuarioId) {
      return NextResponse.json({ 
        error: 'Faltan datos requeridos',
        missing: {
          usuarioId: !usuarioId
        }
      }, { status: 400 });
    }

    // Verificar que el documento existe
    const documento = await db.documento.findUnique({
      where: { id: "4ae1c21c-e9ad-4a40-8dac-727b90f58f1c" }
    });

    if (!documento) {
      console.error("Documento no encontrado");
      return NextResponse.json({ 
        error: "El tipo de documento no existe",
        documentoId: "4ae1c21c-e9ad-4a40-8dac-727b90f58f1c"
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
      nombreConyuge,
      cedulaConyuge,
      testigo3,
      bien1,
      bien2,
      bien3,
      bien4,
      bien5,
      genericText
    });

    // Crear el detalle usando el ID de la solicitud
    const detalleData = {
      solicitudId: solicitud.id,
      Testigo3: testigo3 || null,
      bienes_generico1: bien1 || null,
      bienes_generico2: bien2 || null,
      bienes_generico3: bien3 || null,
      bienes_generico4: bien4 || null,
      bienes_generico5: bien5 || null,
      generic_text: genericText || null,
    };
    
    console.log("Datos para crear detalle:", detalleData);
    
    const detalle = await db.detalle.create({
      data: detalleData,
    });

    console.log("Detalle creado:", detalle);

    // Obtener la solicitud completa con su detalle
    const solicitudCompleta = await db.solicitud.findUnique({
      where: { id: solicitud.id },
      include: { detalle: true }
    });

    return NextResponse.json({ 
      succes: "Solicitud de poder creada exitosamente.", 
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