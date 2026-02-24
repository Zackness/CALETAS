import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
      return NextResponse.json({ error: "Meta no encontrada" }, { status: 404 });
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

    return NextResponse.json({ meta: updatedMeta });
  } catch (error) {
    console.error("Error updating meta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
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
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
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
      return NextResponse.json({ error: "Meta no encontrada" }, { status: 404 });
    }

    // Eliminar la meta
    await db.metaAcademica.delete({
      where: {
        id,
      },
    });

    return NextResponse.json({ message: "Meta eliminada exitosamente" });
  } catch (error) {
    console.error("Error deleting meta:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 