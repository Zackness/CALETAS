import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const metas = await db.metaAcademica.findMany({
      where: {
        usuarioId: session.user.id,
      },
      orderBy: [
        { completada: 'asc' },
        { fechaLimite: 'asc' },
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json({ metas });
  } catch (error) {
    console.error("Error fetching metas:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { titulo, descripcion, tipo, valorObjetivo, valorActual, fechaLimite } = body;

    console.log("Datos recibidos para crear meta:", {
      titulo,
      tipo,
      valorObjetivo,
      valorActual,
      fechaLimite
    });

    // Validaciones
    if (!titulo || !tipo || valorObjetivo === undefined || valorActual === undefined) {
      return NextResponse.json(
        { error: "Faltan campos requeridos" },
        { status: 400 }
      );
    }

    if (valorObjetivo <= 0) {
      return NextResponse.json(
        { error: "El valor objetivo debe ser mayor a 0" },
        { status: 400 }
      );
    }

    if (valorActual < 0) {
      return NextResponse.json(
        { error: "El valor actual no puede ser negativo" },
        { status: 400 }
      );
    }

    // Solo validar que el valor actual no sea mayor al objetivo para ciertos tipos
    if (tipo === "PROMEDIO_GENERAL" && valorActual > valorObjetivo) {
      return NextResponse.json(
        { error: "El promedio actual no puede ser mayor al objetivo" },
        { status: 400 }
      );
    }

    if (tipo === "SEMESTRE_ESPECIFICO" && valorActual > valorObjetivo) {
      return NextResponse.json(
        { error: "El semestre actual no puede ser mayor al objetivo" },
        { status: 400 }
      );
    }

    // Crear la meta
    const meta = await db.metaAcademica.create({
      data: {
        usuarioId: session.user.id,
        titulo,
        descripcion,
        tipo,
        valorObjetivo,
        valorActual,
        fechaLimite: fechaLimite ? new Date(fechaLimite) : null,
        completada: valorActual >= valorObjetivo,
      },
    });

    return NextResponse.json({ meta }, { status: 201 });
  } catch (error) {
    console.error("Error creating meta:", error);
    
    // Si es un error de validación de Prisma, devolver un mensaje más específico
    if (error instanceof Error && error.message.includes('Invalid value')) {
      return NextResponse.json(
        { error: "Datos inválidos para crear la meta" },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
} 