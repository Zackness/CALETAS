import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET - Obtener estadísticas de caletas del usuario
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const usuarioId = searchParams.get('usuarioId') || session.user.id;

    // Obtener conteos por tipo de archivo
    const [
      totalCaletas,
      caletasPDF,
      caletasImagenes,
      caletasDocumentos,
      caletasOtros,
      caletasFavoritas,
      caletasRecientes
    ] = await Promise.all([
      // Total de caletas del usuario
      db.caleta.count({
        where: {
          usuarioId: usuarioId,
          isActive: true
        }
      }),
      // Caletas PDF
      db.caleta.count({
        where: {
          usuarioId: usuarioId,
          isActive: true,
          tipoArchivo: {
            contains: 'pdf',
            mode: 'insensitive'
          }
        }
      }),
      // Caletas imágenes
      db.caleta.count({
        where: {
          usuarioId: usuarioId,
          isActive: true,
          tipoArchivo: {
            in: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg']
          }
        }
      }),
      // Caletas documentos
      db.caleta.count({
        where: {
          usuarioId: usuarioId,
          isActive: true,
          tipoArchivo: {
            in: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
          }
        }
      }),
      // Caletas otros tipos
      db.caleta.count({
        where: {
          usuarioId: usuarioId,
          isActive: true,
          tipoArchivo: {
            notIn: [
              'application/pdf',
              'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg',
              'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'
            ]
          }
        }
      }),
      // Caletas favoritas del usuario
      db.caletaFavorita.count({
        where: {
          usuarioId: usuarioId
        }
      }),
      // Caletas recientes (últimos 7 días)
      db.caleta.count({
        where: {
          usuarioId: usuarioId,
          isActive: true,
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);

    // Obtener caletas por materia (top 5)
    const caletasPorMateria = await db.caleta.groupBy({
      by: ['materiaId'],
      where: {
        usuarioId: usuarioId,
        isActive: true
      },
      _count: {
        _all: true
      },
      orderBy: {
        _count: {
          _all: 'desc'
        }
      },
      take: 5
    });

    // Obtener detalles de las materias
    const materiasIds = caletasPorMateria.map(c => c.materiaId);
    const materias = await db.materia.findMany({
      where: {
        id: {
          in: materiasIds
        }
      },
      include: {
        carrera: {
          include: {
            universidad: true
          }
        }
      }
    });

    // Combinar la información
    const caletasPorMateriaDetallado = caletasPorMateria.map(c => {
      const materia = materias.find(m => m.id === c.materiaId);
      return {
        materiaId: c.materiaId,
        materiaNombre: materia?.nombre || "Desconocida",
        materiaCodigo: materia?.codigo || "",
        carreraNombre: materia?.carrera?.nombre || "",
        universidadNombre: materia?.carrera?.universidad?.nombre || "",
        cantidad: c._count._all
      };
    });

    // Obtener caletas por mes (últimos 6 meses)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

    const caletasPorMes = await db.caleta.groupBy({
      by: ['createdAt'],
      where: {
        usuarioId: usuarioId,
        isActive: true,
        createdAt: {
          gte: seisMesesAtras
        }
      },
      _count: {
        _all: true
      }
    });

    // Formatear datos por mes
    const caletasPorMesFormateado = caletasPorMes.map(c => ({
      mes: c.createdAt.toISOString().substring(0, 7), // Formato YYYY-MM
      cantidad: c._count._all
    }));

    // Calcular tamaño total de archivos
    const totalTamanio = await db.caleta.aggregate({
      where: {
        usuarioId: usuarioId,
        isActive: true
      },
      _sum: {
        tamanio: true
      }
    });

    return NextResponse.json({
      total: totalCaletas,
      porTipo: {
        pdf: caletasPDF,
        imagenes: caletasImagenes,
        documentos: caletasDocumentos,
        otros: caletasOtros
      },
      favoritas: caletasFavoritas,
      recientes: caletasRecientes,
      porMateria: caletasPorMateriaDetallado,
      porMes: caletasPorMesFormateado,
      tamanioTotal: totalTamanio._sum.tamanio || 0
    });

  } catch (error) {
    console.error("Error fetching caletas stats:", error);
    return NextResponse.json(
      { error: "Error al obtener las estadísticas de caletas" },
      { status: 500 }
    );
  }
} 