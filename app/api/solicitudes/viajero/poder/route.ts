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
      testigo3, // documento del cónyuge
      testigo4, // documento del cónyuge (duplicado para compatibilidad)
      bienes_generico1,
      bienes_generico2,
      bienes_generico3,
      bienes_generico4,
      bienes_generico5,
      genericText
    } = body;

    // Log de validación
    console.log("Validación de datos:", {
      hasUsuarioId: !!usuarioId,
      hasFamiliarId: !!familiarId,
      hasAlMenosUnBien: !!(bienes_generico1 || bienes_generico2 || bienes_generico3 || bienes_generico4 || bienes_generico5),
      isPoderEspecial: !!genericText
    });

    // Validar los datos requeridos
    if (!usuarioId) {
      return NextResponse.json({ 
        error: 'Falta el ID del usuario',
      }, { status: 400 });
    }

    // Verificar que al menos un documento de propiedad esté presente solo si es poder especial
    if (genericText && !bienes_generico1 && !bienes_generico2 && !bienes_generico3 && !bienes_generico4 && !bienes_generico5) {
      return NextResponse.json({ 
        error: 'Debe subir al menos un documento de propiedad para un poder especial',
      }, { status: 400 });
    }

    // Verificar que el documento existe usando el ID específico
    const documento = await db.documento.findUnique({
      where: { id: "4f3503c9-264b-476c-b751-9718c72a1ab6" }
    });

    if (!documento) {
      console.error("Documento de poder no encontrado");
      return NextResponse.json({ 
        error: "El tipo de documento de poder no existe en la base de datos"
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

    // Crear la solicitud
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

    // Crear el detalle usando las columnas existentes
    const detalle = await db.detalle.create({
      data: {
        solicitudId: solicitud.id,
        // Datos del cónyuge
        Testigo3: testigo3,
        Testigo4: testigo4,
        // Documentos de propiedad
        bienes_generico1,
        bienes_generico2,
        bienes_generico3,
        bienes_generico4,
        bienes_generico5,
        // Detalles del poder especial
        generic_text: genericText || null
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
      succes: "Solicitud de poder creada exitosamente.", 
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