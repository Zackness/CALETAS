import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/solicitudes/[id]/nota
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const nota = await db.nota.findUnique({
      where: {
        solicitudId: parseInt(params.id)
      }
    });

    return NextResponse.json(nota);
  } catch (error) {
    console.error("[NOTA_GET]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

// POST /api/solicitudes/[id]/nota
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { contenido } = body;

    if (!contenido) {
      return new NextResponse("El contenido es requerido", { status: 400 });
    }

    const nota = await db.nota.create({
      data: {
        contenido,
        solicitudId: parseInt(params.id)
      }
    });

    return NextResponse.json(nota);
  } catch (error) {
    console.error("[NOTA_POST]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

// PUT /api/solicitudes/[id]/nota
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { contenido } = body;

    if (!contenido) {
      return new NextResponse("El contenido es requerido", { status: 400 });
    }

    const nota = await db.nota.upsert({
      where: {
        solicitudId: parseInt(params.id)
      },
      update: {
        contenido
      },
      create: {
        contenido,
        solicitudId: parseInt(params.id)
      }
    });

    return NextResponse.json(nota);
  } catch (error) {
    console.error("[NOTA_PUT]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
}

// DELETE /api/solicitudes/[id]/nota
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    await db.nota.delete({
      where: {
        solicitudId: parseInt(params.id)
      }
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[NOTA_DELETE]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 