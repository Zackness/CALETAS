import { db } from "@/lib/db";
import { Solicitud } from "@prisma/client";

type SolicitudWithCount = {
  completedSolicitudes: Solicitud[]; // Cambié el tipo a Solicitud[]
  pendingSolicitudes: Solicitud[];   // Cambié el tipo a Solicitud[]
  aprovedSolicitudes: Solicitud[];   // Cambié el tipo a Solicitud[]
  inProgressSolicitudes: Solicitud[];   // Cambié el tipo a Solicitud[]
  regectedSolicitudes: Solicitud[];   // Cambié el tipo a Solicitud[]
};

export const getSolicitudWithCount = async (userId: string): Promise<SolicitudWithCount> => {
  try {
    // Obtener solicitudes pendientes
    const pendingSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "PENDIENTE",
      },
    });
    
    // Obtener solicitudes pendientes
    const aprovedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "APROBADA",
      },
    });
    
    // Obtener solicitudes pendientes
    const inProgressSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "EN_PROGRESO",
      },
    });

    // Obtener solicitudes finalizadas
    const completedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "FINALIZADA",
      },
    });

    // Obtener solicitudes finalizadas
    const regectedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "FINALIZADA",
      },
    });    


    // Devolver los datos en el formato esperado
    return {
      completedSolicitudes,
      pendingSolicitudes,
      aprovedSolicitudes,
      inProgressSolicitudes,
      regectedSolicitudes,
    };
    
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
    throw new Error("No se pudieron obtener las solicitudes");
  }
};