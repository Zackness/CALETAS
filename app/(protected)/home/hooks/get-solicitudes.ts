import { db } from "@/lib/db";
import { Solicitud } from "@prisma/client";

type SolicitudWithCount = {
  completedSolicitudes: Solicitud[]; // Cambié el tipo a Solicitud[]
  pendingSolicitudes: Solicitud[];   // Cambié el tipo a Solicitud[]
};

export const getSolicitudWithCount = async (userId: string): Promise<SolicitudWithCount> => {
  try {
    // Obtener solicitudes finalizadas
    const completedSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "FINALIZADA",
      },
    });

    // Obtener solicitudes pendientes
    const pendingSolicitudes = await db.solicitud.findMany({
      where: {
        usuarioId: userId,
        estado: "PENDIENTE",
      },
    });

    // Devolver los datos en el formato esperado
    return {
      completedSolicitudes,
      pendingSolicitudes,
    };
    
  } catch (error) {
    console.error("Error al obtener las solicitudes:", error);
    throw new Error("No se pudieron obtener las solicitudes");
  }
};