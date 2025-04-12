import { db } from "@/lib/db";
import { Solicitud } from "@prisma/client";

type SolicitudWithCount = {
  completedSolicitudes: Solicitud[]; 
  pendingSolicitudes: Solicitud[];   
  aprovedSolicitudes: Solicitud[];   
  inProgressSolicitudes: Solicitud[];   
  regectedSolicitudes: Solicitud[];   
};

export const getSolicitudWithCount = async (userId: string): Promise<SolicitudWithCount> => {
  try {
    // Obtener solicitudes pendientes del usuario
    const pendingSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "PENDIENTE",
      },
    });
    
    // Obtener solicitudes aprobadas del usuario
    const aprovedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "APROBADA",
      },
    });
    
    // Obtener solicitudes en proceso del usuario
    const inProgressSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "EN_PROGRESO",
      },
    });

    // Obtener solicitudes finalizadas del usuario
    const completedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "FINALIZADA",
      },
    });

    // Obtener solicitudes rechazadas del usuario
    const regectedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "RECHAZADA",
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