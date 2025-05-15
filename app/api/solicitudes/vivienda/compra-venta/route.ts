import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Datos recibidos:", body);

    const { 
      usuarioId, 
      familiarId,
      tipoInmueble,
      otroTipoInmueble,
      monto,
      formaPago,
      moneda,
      esCompraConjunta,
      esVendedorJuridico,
      esApoderado,
      cedulaVendedor,
      nombreVendedor,
      documentoConstitucion,
      actaAutorizacion,
      documentoPropiedad,
      cedulaCatastral,
      solvenciaMunicipal,
      cedulaApoderado,
      documentoConyuge,
      documentoConyugeVendedor
    } = body;

    // Log de validación
    console.log("Validación de datos:", {
      hasUsuarioId: !!usuarioId,
      hasFamiliarId: !!familiarId,
      hasTipoInmueble: !!tipoInmueble,
      hasMonto: !!monto,
      hasFormaPago: !!formaPago,
      hasMoneda: !!moneda,
      hasDocumentoPropiedad: !!documentoPropiedad,
      hasCedulaCatastral: !!cedulaCatastral,
      hasSolvenciaMunicipal: !!solvenciaMunicipal
    });

    // Validar los datos requeridos
    if (!usuarioId || !tipoInmueble || !monto || !formaPago || !moneda || !documentoPropiedad || !cedulaCatastral || !solvenciaMunicipal) {
      const missing = {
        usuarioId: !usuarioId,
        tipoInmueble: !tipoInmueble,
        monto: !monto,
        formaPago: !formaPago,
        moneda: !moneda,
        documentoPropiedad: !documentoPropiedad,
        cedulaCatastral: !cedulaCatastral,
        solvenciaMunicipal: !solvenciaMunicipal
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
      console.error("Documento de compra-venta de vivienda no encontrado");
      return NextResponse.json({ 
        error: "El tipo de documento de compra-venta de vivienda no existe en la base de datos"
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
        // Datos del inmueble
        generic_text: monto,
        Testigo1: tipoInmueble === "otro" ? otroTipoInmueble : tipoInmueble,
        Testigo2: formaPago,
        Testigo3: moneda,
        bienes_generico1: documentoPropiedad,
        bienes_generico2: cedulaCatastral,
        bienes_generico3: solvenciaMunicipal,
        // Documentos adicionales para persona jurídica
        bienes_generico4: esVendedorJuridico ? documentoConstitucion : null,
        bienes_generico5: esVendedorJuridico ? actaAutorizacion : null,
        // Documentos adicionales
        Testigo4: esApoderado ? cedulaApoderado : null,
        Acta_de_nacimiento: esCompraConjunta ? documentoConyuge : null,
        Acta_de_matrimonio: !esVendedorJuridico ? documentoConyugeVendedor : null
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
      succes: "Solicitud de compra-venta de vivienda creada exitosamente.", 
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