import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

// GET /api/solicitudes/[id]/nota
export async function GET(req: Request) {
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

    // Construir la consulta base
    const whereClause: { id: number; usuarioId?: string } = {
      id: parseInt(id)
    };

    // Si el usuario es cliente, solo puede ver sus propias solicitudes
    if (user?.role === UserRole.CLIENT) {
      whereClause.usuarioId = session.user.id;
    }

    const solicitud = await db.solicitud.findUnique({
      where: whereClause,
      include: { nota: true }
    });

    if (!solicitud) {
      return new NextResponse("Solicitud no encontrada", { status: 404 });
    }

    if (!solicitud.nota) {
      return new NextResponse("Nota no encontrada", { status: 404 });
    }

    return NextResponse.json({
      id: solicitud.nota.id,
      contenido: solicitud.nota.contenido,
      createdAt: solicitud.nota.createdAt.toISOString()
    });
  } catch (error) {
    console.error("[NOTA_GET]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

// POST /api/solicitudes/[id]/nota
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

    // Solo los administradores y abogados pueden crear notas
    if (user?.role === UserRole.CLIENT) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    const whereClause = {
      id: parseInt(id)
    };

    const solicitud = await db.solicitud.findUnique({
      where: whereClause
    });

    if (!solicitud) {
      return new NextResponse("Solicitud no encontrada", { status: 404 });
    }

    // Verificar si ya existe una nota
    const existingNota = await db.solicitud.findUnique({
      where: { id: parseInt(id) },
      select: { nota: true }
    });

    if (existingNota?.nota) {
      return new NextResponse("Ya existe una nota para esta solicitud", { status: 400 });
    }

    const body = await req.json();
    const { contenido } = body;

    if (!contenido) {
      return new NextResponse("El contenido de la nota es requerido", { status: 400 });
    }

    // Crear la nota y asociarla a la solicitud
    const nota = await db.nota.create({
      data: {
        contenido,
        solicitudes: {
          connect: {
            id: parseInt(id)
          }
        }
      }
    });

    return NextResponse.json({
      id: nota.id,
      contenido: nota.contenido,
      createdAt: nota.createdAt.toISOString()
    });
  } catch (error) {
    console.error("[NOTA_POST]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

// PUT /api/solicitudes/[id]/nota
export async function PUT(req: Request) {
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

    // Solo los administradores y abogados pueden actualizar notas
    if (user?.role === UserRole.CLIENT) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    const whereClause = {
      id: parseInt(id)
    };

    const solicitud = await db.solicitud.findUnique({
      where: whereClause,
      include: { nota: true }
    });

    if (!solicitud) {
      return new NextResponse("Solicitud no encontrada", { status: 404 });
    }

    if (!solicitud.nota) {
      return new NextResponse("Nota no encontrada", { status: 404 });
    }

    const body = await req.json();
    const { contenido } = body;

    if (!contenido) {
      return new NextResponse("El contenido de la nota es requerido", { status: 400 });
    }

    // Actualizar la nota
    const nota = await db.nota.update({
      where: { id: solicitud.nota.id },
      data: { contenido }
    });

    return NextResponse.json({
      id: nota.id,
      contenido: nota.contenido,
      createdAt: nota.createdAt.toISOString()
    });
  } catch (error) {
    console.error("[NOTA_PUT]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

// DELETE /api/solicitudes/[id]/nota
export async function DELETE(req: Request) {
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

    // Solo los administradores y abogados pueden eliminar notas
    if (user?.role === UserRole.CLIENT) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    const whereClause = {
      id: parseInt(id)
    };

    const solicitud = await db.solicitud.findUnique({
      where: whereClause,
      include: { nota: true }
    });

    if (!solicitud) {
      return new NextResponse("Solicitud no encontrada", { status: 404 });
    }

    if (!solicitud.nota) {
      return new NextResponse("Nota no encontrada", { status: 404 });
    }

    // Eliminar la nota
    await db.nota.delete({
      where: { id: solicitud.nota.id }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[NOTA_DELETE]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 