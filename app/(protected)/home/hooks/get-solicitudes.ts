import { db } from "@/lib/db";
import { Estado } from "@prisma/client";

export const getSolicitudWithCount = async (userId: string) => {
  try {
    // Obtener todas las solicitudes finalizadas del usuario
    const completedSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.FINALIZADA,
        usuarioId: userId
      }
    });

    // Obtener todas las solicitudes pendientes del usuario
    const pendingSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.PENDIENTE,
        usuarioId: userId
      }
    });

    // Obtener todas las solicitudes aprobadas del usuario
    const aprovedSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.APROBADA,
        usuarioId: userId
      }
    });

    // Obtener todas las solicitudes en progreso del usuario
    const inProgressSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.EN_PROGRESO,
        usuarioId: userId
      }
    });

    // Obtener todas las solicitudes rechazadas del usuario
    const regectedSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.RECHAZADA,
        usuarioId: userId
      }
    });

    return {
      completedSolicitudes,
      pendingSolicitudes,
      aprovedSolicitudes,
      inProgressSolicitudes,
      regectedSolicitudes
    };
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
    return {
      completedSolicitudes: [],
      pendingSolicitudes: [],
      aprovedSolicitudes: [],
      inProgressSolicitudes: [],
      regectedSolicitudes: []
    };
  }
};