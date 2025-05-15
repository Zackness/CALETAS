import { NextRequest, NextResponse } from 'next/server';
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("Datos recibidos:", body);

    const {
      usuarioId,
      familiarId,
      tipoActividad,
      otroTipoActividad,
      fechaInicioActividad,
      fechaFinActividad,
      esBalanceConjunto,
      documentoConyuge,
      tipoActividadConyuge,
      otroTipoActividadConyuge,
      fechaInicioActividadConyuge,
      fechaFinActividadConyuge,
      gananciaTotal,
      fuenteIngresos,
      institucionDestino,
    } = body;

    // Log de validación
    console.log("Validación de datos:", {
      hasUsuarioId: !!usuarioId,
      hasTipoActividad: !!tipoActividad,
      hasFechaInicio: !!fechaInicioActividad,
      hasFechaFin: !!fechaFinActividad,
      hasGananciaTotal: !!gananciaTotal,
      hasFuenteIngresos: !!fuenteIngresos,
      hasInstitucionDestino: !!institucionDestino,
      isBalanceConjunto: esBalanceConjunto,
      hasDocumentoConyuge: !!documentoConyuge,
      hasTipoActividadConyuge: !!tipoActividadConyuge,
      hasFechaInicioConyuge: !!fechaInicioActividadConyuge,
      hasFechaFinConyuge: !!fechaFinActividadConyuge
    });

    // Validar los datos requeridos
    if (!usuarioId || !tipoActividad || !fechaInicioActividad || !fechaFinActividad || 
        !gananciaTotal || !fuenteIngresos || !institucionDestino) {
      return NextResponse.json({ 
        error: 'Faltan datos requeridos',
        missing: {
          usuarioId: !usuarioId,
          tipoActividad: !tipoActividad,
          fechaInicioActividad: !fechaInicioActividad,
          fechaFinActividad: !fechaFinActividad,
          gananciaTotal: !gananciaTotal,
          fuenteIngresos: !fuenteIngresos,
          institucionDestino: !institucionDestino
        }
      }, { status: 400 });
    }

    // Verificar que el documento existe
    const documento = await db.documento.findFirst({
      where: {
        nombre: "Certificacion de Ingresos",
      },
    });

    if (!documento) {
      console.error("Documento de certificación de ingresos no encontrado");
      return NextResponse.json({ 
        error: "El tipo de documento de certificación de ingresos no existe en la base de datos"
      }, { status: 400 });
    }

    console.log("Documento encontrado:", documento);

    // Crear la solicitud
    const solicitud = await db.solicitud.create({
      data: {
        documentoId: documento.id,
        usuarioId,
        familiarId: familiarId || null,
        estado: "PENDIENTE"
      },
      include: {
        detalle: true
      }
    });

    console.log("Solicitud creada:", solicitud);

    // Preparar los datos para el detalle
    const detalleData = {
      solicitudId: solicitud.id,
      Testigo1: documentoConyuge || null,
      Testigo2: fechaFinActividadConyuge ? new Date(fechaFinActividadConyuge).toISOString() : null,
      Testigo3: gananciaTotal,
      Testigo4: institucionDestino,
      generic_text: fuenteIngresos,
      bienes_generico1: tipoActividad === "Otro" ? otroTipoActividad : tipoActividad,
      bienes_generico2: fechaInicioActividad ? new Date(fechaInicioActividad).toISOString() : null,
      bienes_generico3: fechaFinActividad ? new Date(fechaFinActividad).toISOString() : null,
      bienes_generico4: tipoActividadConyuge === "Otro" ? otroTipoActividadConyuge : tipoActividadConyuge,
      bienes_generico5: fechaInicioActividadConyuge ? new Date(fechaInicioActividadConyuge).toISOString() : null,
    };

    console.log("Intentando crear detalle con:", detalleData);

    // Crear el detalle
    const detalle = await db.detalle.create({
      data: detalleData
    });

    console.log("Detalle creado:", detalle);

    // Actualizar la solicitud para incluir el detalle
    const solicitudActualizada = await db.solicitud.update({
      where: { id: solicitud.id },
      data: {},
      include: { 
        detalle: true
      }
    });

    console.log("Solicitud actualizada con detalle:", solicitudActualizada);

    return NextResponse.json({ 
      succes: "Solicitud de certificación de ingresos creada exitosamente.", 
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