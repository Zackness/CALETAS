import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

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
    const id = pathParts[pathParts.length - 2]; // El ID está antes de 'nota' en la URL

    const nota = await db.nota.findUnique({
      where: {
        solicitudId: parseInt(id),
      },
    });

    return NextResponse.json(nota);
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
    const id = pathParts[pathParts.length - 2]; // El ID está antes de 'nota' en la URL

    const body = await req.json();
    const { contenido } = body;

    if (!contenido) {
      return new NextResponse("El contenido es requerido", { status: 400 });
    }

    const nota = await db.nota.create({
      data: {
        contenido,
        solicitudId: parseInt(id),
      },
    });

    return NextResponse.json(nota);
  } catch (error) {
    console.error("[NOTA_POST]", error);
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
    const id = pathParts[pathParts.length - 2]; // El ID está antes de 'nota' en la URL

    await db.nota.delete({
      where: {
        solicitudId: parseInt(id),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[NOTA_DELETE]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 