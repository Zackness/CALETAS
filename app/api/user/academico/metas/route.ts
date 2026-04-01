import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCorsHeaders } from "@/lib/cors";

function withCors(res: NextResponse, req: NextRequest) {
  Object.entries(getCorsHeaders(req)).forEach(([k, v]) => res.headers.set(k, v));
  return res;
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
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

    return withCors(NextResponse.json({ metas }), request);
  } catch (error) {
    console.error("Error fetching metas:", error);
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return withCors(NextResponse.json({ error: "No autorizado" }, { status: 401 }), request);
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
      return withCors(NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 }), request);
    }
    if (valorObjetivo <= 0) {
      return withCors(NextResponse.json({ error: "El valor objetivo debe ser mayor a 0" }, { status: 400 }), request);
    }
    if (valorActual < 0) {
      return withCors(NextResponse.json({ error: "El valor actual no puede ser negativo" }, { status: 400 }), request);
    }
    if (tipo === "PROMEDIO_GENERAL" && valorActual > valorObjetivo) {
      return withCors(NextResponse.json({ error: "El promedio actual no puede ser mayor al objetivo" }, { status: 400 }), request);
    }
    if (tipo === "SEMESTRE_ESPECIFICO" && valorActual > valorObjetivo) {
      return withCors(NextResponse.json({ error: "El semestre actual no puede ser mayor al objetivo" }, { status: 400 }), request);
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

    return withCors(NextResponse.json({ meta }, { status: 201 }), request);
  } catch (error) {
    console.error("Error creating meta:", error);
    if (error instanceof Error && error.message.includes('Invalid value')) {
      return withCors(NextResponse.json({ error: "Datos inválidos para crear la meta" }, { status: 400 }), request);
    }
    return withCors(NextResponse.json({ error: "Error interno del servidor" }, { status: 500 }), request);
  }
} 