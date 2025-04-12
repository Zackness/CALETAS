import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/solicitudes/[id]
export async function GET(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Extraer el ID de la URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1]; // El ID es el último segmento de la URL

    const solicitud = await db.solicitud.findUnique({
      where: {
        id: parseInt(id),
        usuarioId: session.user.id
      },
      include: {
        documento: {
          include: {
            servicio: true
          }
        },
        usuario: true,
        familiar: true,
        detalle: true,
        nota: true
      }
    });

    if (!solicitud) {
      return new NextResponse("Solicitud no encontrada", { status: 404 });
    }

    // Transformar la solicitud
    const transformedSolicitud = {
      id: solicitud.id.toString(),
      estado: solicitud.estado,
      fecha: solicitud.createdAt.toISOString(),
      prioridad: "NORMAL", // Valor fijo ya que no existe en el modelo
      documento: {
        id: solicitud.documento.id,
        nombre: solicitud.documento.nombre,
        servicio: {
          id: solicitud.documento.servicio.id,
          nombre: solicitud.documento.servicio.nombre
        }
      },
      client: {
        id: solicitud.usuario.id,
        name: solicitud.usuario.name || "",
        email: solicitud.usuario.email || "",
        avatar: solicitud.usuario.image || "/default-avatar.png",
        telefono: solicitud.usuario.telefono || "",
        cedula: solicitud.usuario.cedula || ""
      },
      familiar: solicitud.familiar ? {
        id: solicitud.familiar.id,
        name: solicitud.familiar.nombre,
        email: solicitud.familiar.telefono || "",
        avatar: "/default-avatar.png",
        telefono: solicitud.familiar.telefono || "",
        cedula: solicitud.familiar.cedula || ""
      } : null,
      detalle: solicitud.detalle ? {
        Testigo1: solicitud.detalle.Testigo1 || undefined,
        Testigo2: solicitud.detalle.Testigo2 || undefined,
        Testigo3: solicitud.detalle.Testigo3 || undefined,
        Testigo4: solicitud.detalle.Testigo4 || undefined,
        generic_text: solicitud.detalle.generic_text || undefined,
        bienes_generico1: solicitud.detalle.bienes_generico1 || undefined,
        bienes_generico2: solicitud.detalle.bienes_generico2 || undefined,
        bienes_generico3: solicitud.detalle.bienes_generico3 || undefined,
        bienes_generico4: solicitud.detalle.bienes_generico4 || undefined,
        bienes_generico5: solicitud.detalle.bienes_generico5 || undefined,
        Acta_de_nacimiento: solicitud.detalle.Acta_de_nacimiento || undefined,
        Acta_de_matrimonio: solicitud.detalle.Acta_de_matrimonio || undefined,
        Acta_de_defuncion: solicitud.detalle.Acta_de_defuncion || undefined,
        Acta_de_divorcio: solicitud.detalle.Acta_de_divorcio || undefined
      } : null,
      nota: solicitud.nota ? {
        id: solicitud.nota.id,
        contenido: solicitud.nota.contenido,
        createdAt: solicitud.nota.createdAt.toISOString()
      } : null
    };

    return NextResponse.json(transformedSolicitud);
  } catch (error) {
    console.error("[SOLICITUD_GET]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

// PUT /api/solicitudes/[id]
export async function PUT(req: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Extraer el ID de la URL
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1]; // El ID es el último segmento de la URL

    const body = await req.json();
    const { estado } = body;

    const solicitud = await db.solicitud.update({
      where: {
        id: parseInt(id),
        usuarioId: session.user.id
      },
      data: {
        estado
      }
    });

    return NextResponse.json(solicitud);
  } catch (error) {
    console.error("[SOLICITUD_PUT]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 