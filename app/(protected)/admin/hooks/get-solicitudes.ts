import { db } from "@/lib/db";
import { Estado } from "@prisma/client";

export const getSolicitudWithCount = async () => {
  try {
    // Obtener todas las solicitudes finalizadas
    const completedSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.FINALIZADA
      }
    });

    // Obtener todas las solicitudes pendientes
    const pendingSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.PENDIENTE
      }
    });

    // Obtener todas las solicitudes aprobadas
    const aprovedSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.APROBADA
      }
    });

    // Obtener todas las solicitudes en progreso
    const inProgressSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.EN_PROGRESO
      }
    });

    // Obtener todas las solicitudes rechazadas
    const regectedSolicitudes = await db.solicitud.findMany({
      where: {
        estado: Estado.RECHAZADA
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