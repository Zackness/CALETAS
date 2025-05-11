import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/solicitudes/stats
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Obtener conteos por estado
    const [
      totalSolicitudes,
      pendientesSolicitudes,
      aprobadasSolicitudes,
      enProgresoSolicitudes,
      finalizadasSolicitudes,
      rechazadasSolicitudes
    ] = await Promise.all([
      // Total de solicitudes
      db.solicitud.count({
        where: {
          usuarioId: session.user.id
        }
      }),
      // Solicitudes pendientes
      db.solicitud.count({
        where: {
          usuarioId: session.user.id,
          estado: "PENDIENTE"
        }
      }),
      // Solicitudes aprobadas
      db.solicitud.count({
        where: {
          usuarioId: session.user.id,
          estado: "APROBADA"
        }
      }),
      // Solicitudes en progreso
      db.solicitud.count({
        where: {
          usuarioId: session.user.id,
          estado: "EN_PROGRESO"
        }
      }),
      // Solicitudes finalizadas
      db.solicitud.count({
        where: {
          usuarioId: session.user.id,
          estado: "FINALIZADA"
        }
      }),
      // Solicitudes rechazadas
      db.solicitud.count({
        where: {
          usuarioId: session.user.id,
          estado: "RECHAZADA"
        }
      })
    ]);

    // Obtener solicitudes por servicio
    const solicitudesPorServicio = await db.solicitud.groupBy({
      by: ['documentoId'],
      where: {
        usuarioId: session.user.id
      },
      _count: {
        _all: true
      }
    });

    // Obtener detalles de los servicios
    const serviciosIds = solicitudesPorServicio.map(s => s.documentoId);
    const servicios = await db.documento.findMany({
      where: {
        id: {
          in: serviciosIds
        }
      },
      include: {
        servicio: true
      }
    });

    // Combinar la información
    const solicitudesPorServicioDetallado = solicitudesPorServicio.map(s => {
      const servicio = servicios.find(serv => serv.id === s.documentoId);
      return {
        servicioId: servicio?.servicio.id || "",
        servicioNombre: servicio?.servicio.nombre || "Desconocido",
        documentoId: s.documentoId,
        documentoNombre: servicio?.nombre || "Desconocido",
        cantidad: s._count._all
      };
    });

    // Obtener solicitudes por mes (últimos 6 meses)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const solicitudesPorMes = await db.solicitud.groupBy({
      by: ['createdAt'],
      where: {
        usuarioId: session.user.id,
        createdAt: {
          gte: seisMesesAtras
        }
      },
      _count: {
        _all: true
      }
    });

    // Formatear datos por mes
    const solicitudesPorMesFormateado = solicitudesPorMes.map(s => ({
      mes: s.createdAt.toISOString().substring(0, 7), // Formato YYYY-MM
      cantidad: s._count._all
    }));

    return NextResponse.json({
      total: totalSolicitudes,
      porEstado: {
        pendientes: pendientesSolicitudes,
        aprobadas: aprobadasSolicitudes,
        enProgreso: enProgresoSolicitudes,
        finalizadas: finalizadasSolicitudes,
        rechazadas: rechazadasSolicitudes
      },
      porServicio: solicitudesPorServicioDetallado,
      porMes: solicitudesPorMesFormateado
    });
  } catch (error) {
    console.error("[SOLICITUDES_STATS]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 