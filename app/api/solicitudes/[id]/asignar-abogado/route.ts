import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Extraer el ID de la URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 2]; // El ID es el penúltimo segmento de la URL

    // Verificar el rol del usuario
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    // Solo los administradores pueden asignar abogados
    if (user?.role !== UserRole.ADMIN) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    const body = await req.json();
    const { abogadoId } = body;

    if (!abogadoId) {
      return new NextResponse("El ID del abogado es requerido", { status: 400 });
    }

    // Verificar que el abogado existe y tiene el rol correcto
    const abogado = await db.user.findUnique({
      where: { 
        id: abogadoId,
        role: UserRole.ABOGADO
      }
    });

    if (!abogado) {
      return new NextResponse("Abogado no encontrado", { status: 404 });
    }

    // Crear la asignación
    const asignacion = await db.solicitudAbogado.create({
      data: {
        solicitudId: parseInt(id),
        abogadoId: abogadoId,
        asignadoPor: session.user.id
      }
    });

    // Crear una notificación para el abogado
    await db.notificacion.create({
      data: {
        titulo: "Nueva solicitud asignada",
        mensaje: "Se te ha asignado una nueva solicitud para revisar",
        tipo: "ASIGNACION",
        solicitudId: parseInt(id),
        usuarioId: abogadoId
      }
    });

    return NextResponse.json(asignacion);
  } catch (error) {
    console.error("[ASIGNAR_ABOGADO_POST]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 