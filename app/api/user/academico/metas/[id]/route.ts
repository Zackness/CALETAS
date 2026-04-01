import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const body = await request.json();
    const { titulo, descripcion, tipo, valorObjetivo, valorActual, fechaLimite, completada } = body;

    const { id } = await params;

    // Verificar que la meta pertenece al usuario
    const existingMeta = await db.metaAcademica.findFirst({
      where: {
        id,
        usuarioId: session.user.id,
      },
    });

    if (!existingMeta) {
      return withCors(NextResponse.json({ error: "Meta no encontrada" }, { status: 404 }), request);
    }

    // Validaciones
    if (titulo !== undefined && !titulo) {
      return NextResponse.json(
        { error: "El título no puede estar vacío" },
        { status: 400 }
      );
    }

    if (tipo !== undefined && !tipo) {
      return NextResponse.json(
        { error: "El tipo es requerido" },
        { status: 400 }
      );
    }

    if (valorObjetivo !== undefined && valorObjetivo <= 0) {
      return NextResponse.json(
        { error: "El valor objetivo debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (valorActual !== undefined && valorActual < 0) {
      return NextResponse.json(
        { error: "El valor actual no puede ser negativo" },
        { status: 400 }
      );
    }

    // Determinar si la meta está completada
    const isCompleted = completada !== undefined 
      ? completada 
      : (valorActual !== undefined && valorObjetivo !== undefined 
          ? valorActual >= valorObjetivo 
          : existingMeta.valorActual >= existingMeta.valorObjetivo);

    // Actualizar la meta
    const updatedMeta = await db.metaAcademica.update({
      where: {
        id,
      },
      data: {
        ...(titulo !== undefined && { titulo }),
        ...(descripcion !== undefined && { descripcion }),
        ...(tipo !== undefined && { tipo }),
        ...(valorObjetivo !== undefined && { valorObjetivo }),
        ...(valorActual !== undefined && { valorActual }),
        ...(fechaLimite !== undefined && { 
          fechaLimite: fechaLimite ? new Date(fechaLimite) : null 
        }),
        completada: isCompleted,
      },
    });

    return withCors(NextResponse.json({ meta: updatedMeta }), request);
  } catch (error) {
    console.error("Error updating meta:", error);
    return withCors(NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    ), request);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
    }

    const { id } = await params;

    // Verificar que la meta pertenece al usuario
    const existingMeta = await db.metaAcademica.findFirst({
      where: {
        id,
        usuarioId: session.user.id,
      },
    });

    if (!existingMeta) {
      return withCors(NextResponse.json({ error: "Meta no encontrada" }, { status: 404 }), request);
    }

    // Eliminar la meta
    await db.metaAcademica.delete({
      where: {
        id,
      },
    });

    return withCors(NextResponse.json({ message: "Meta eliminada exitosamente" }), request);
  } catch (error) {
    console.error("Error deleting meta:", error);
    return withCors(NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    ), request);
  }
} 