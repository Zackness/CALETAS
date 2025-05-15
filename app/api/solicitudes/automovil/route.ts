import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Datos recibidos:", body);

    const { 
      usuarioId, 
      familiarId, 
      testigo1, 
      bienes_generico1, 
      bienes_generico2, 
      bienes_generico3, 
      generic_text,
      testigo2,
      testigo3,
      bienes_generico4, 
      bienes_generico5
    } = body;

    // Log de validación
    console.log("Validación de datos:", {
      hasUsuarioId: !!usuarioId,
      hasFamiliarId: !!familiarId,
      hasTestigo1: !!testigo1,
      hasBienes1: !!bienes_generico1,
      hasBienes2: !!bienes_generico2,
      hasBienes3: !!bienes_generico3,
      hasGenericText: !!generic_text,
      hasTestigo2: !!testigo2,
      hasTestigo3: !!testigo3,
      hasBienes4: !!bienes_generico4,
      hasBienes5: !!bienes_generico5
    });

    // Validar los datos recibidos
    if (!usuarioId || !testigo1 || !bienes_generico1 || !bienes_generico2 || !bienes_generico3 || !generic_text || !testigo2 || !testigo3 || !bienes_generico4 || !bienes_generico5) {
      const missing = {
        usuarioId: !usuarioId,
        testigo1: !testigo1,
        bienes_generico1: !bienes_generico1,
        bienes_generico2: !bienes_generico2,
        bienes_generico3: !bienes_generico3,
        generic_text: !generic_text,
        testigo2: !testigo2,
        testigo3: !testigo3,
        bienes_generico4: !bienes_generico4,
        bienes_generico5: !bienes_generico5
      };
      console.error("Datos faltantes:", missing);
      return NextResponse.json({ 
        error: 'Faltan datos requeridos',
        missing
      }, { status: 400 });
    }

    // Verificar que el documento existe usando el ID específico
    const documento = await db.documento.findUnique({
      where: { id: "4f3503c9-264b-476c-b751-9718c72a1ab6" }
    });

    if (!documento) {
      console.error("Documento de compra de vehículo no encontrado");
      return NextResponse.json({ 
        error: "El tipo de documento de compra de vehículo no existe en la base de datos"
      }, { status: 400 });
    }

    console.log("Documento encontrado:", documento);

    // Verificar que la nota predefinida existe
    const notaPredefinida = await db.nota.findUnique({
      where: { id: "e20313fa-a6a3-4585-8b1f-9151452976a1" }
    });

    if (!notaPredefinida) {
      console.error("Nota predefinida no encontrada");
      return NextResponse.json({ 
        error: "La nota predefinida no existe en la base de datos"
      }, { status: 400 });
    }

    console.log("Nota predefinida encontrada:", notaPredefinida);

    // Crear una nueva nota basada en la predefinida
    const nota = await db.nota.create({
      data: {
        contenido: notaPredefinida.contenido
      }
    });

    console.log("Nota creada:", nota);

    console.log("Intentando crear solicitud con:", {
      usuarioId,
      familiarId,
      documentoId: documento.id,
      notaId: nota.id
    });

    // Crear la solicitud con la nota asociada
    const solicitud = await db.solicitud.create({
      data: {
        usuarioId,
        familiarId: familiarId || null,
        documentoId: documento.id,
        notaId: nota.id
      },
      include: {
        detalle: true,
        nota: true
      }
    });

    console.log("Solicitud creada:", solicitud);

    console.log("Intentando crear detalle con:", {
      solicitudId: solicitud.id,
      Testigo1: testigo1,
      bienes_generico1,
      bienes_generico2,
      bienes_generico3,
      generic_text,
      Testigo2: testigo2,
      Testigo3: testigo3,
      bienes_generico4,
      bienes_generico5
    });

    // Crear el detalle usando el ID de la solicitud
    const detalle = await db.detalle.create({
      data: {
        solicitudId: solicitud.id,
        Testigo1: testigo1,
        bienes_generico1,
        bienes_generico2,
        bienes_generico3,
        generic_text,
        Testigo2: testigo2,
        Testigo3: testigo3,
        bienes_generico4,
        bienes_generico5
      },
    });

    console.log("Detalle creado:", detalle);

    // Actualizar la solicitud para incluir el detalle
    const solicitudActualizada = await db.solicitud.update({
      where: { id: solicitud.id },
      data: {},
      include: { 
        detalle: true,
        nota: true
      }
    });

    console.log("Solicitud actualizada con detalle:", solicitudActualizada);

    return NextResponse.json({ 
      succes: "Solicitud de compra de vehículo creada exitosamente.", 
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