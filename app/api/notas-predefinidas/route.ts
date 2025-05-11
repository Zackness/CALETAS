import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    // Verificar el rol del usuario
    const user = await db.user.findUnique({
      where: {
        id: session.user.id
      },
      select: {
        role: true
      }
    });

    // Solo los administradores y abogados pueden ver las notas predefinidas
    if (user?.role === UserRole.CLIENT) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    const notasPredefinidas = await db.nota.findMany({
      select: {
        id: true,
        contenido: true
      },
      orderBy: {
        contenido: 'asc'
      }
    });

    return NextResponse.json(notasPredefinidas);
  } catch (error) {
    console.error("[NOTAS_PREDEFINIDAS_GET]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 