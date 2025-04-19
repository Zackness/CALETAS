import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Obtener solicitudes pendientes del usuario
    const pendingSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: session.user.id,
        estado: "PENDIENTE",
      },
    });
    
    // Obtener solicitudes aprobadas del usuario
    const aprovedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: session.user.id,
        estado: "APROBADA",
      },
    });
    
    // Obtener solicitudes en proceso del usuario
    const inProgressSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: session.user.id,
        estado: "EN_PROGRESO",
      },
    });

    // Obtener solicitudes finalizadas del usuario
    const completedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: session.user.id,
        estado: "FINALIZADA",
      },
    });

    // Obtener solicitudes rechazadas del usuario
    const regectedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: session.user.id,
        estado: "RECHAZADA",
      },
    });    

    // Devolver los datos en el formato esperado
    return NextResponse.json({
      completedSolicitudes,
      pendingSolicitudes,
      aprovedSolicitudes,
      inProgressSolicitudes,
      regectedSolicitudes,
    });
    
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 