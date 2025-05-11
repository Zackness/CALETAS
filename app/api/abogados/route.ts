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

    // Solo los administradores pueden ver la lista de abogados
    if (user?.role !== UserRole.ADMIN) {
      return new NextResponse("No autorizado", { status: 403 });
    }

    // Obtener todos los usuarios con rol de abogado
    const abogados = await db.user.findMany({
      where: {
        role: UserRole.ABOGADO
      },
      select: {
        id: true,
        name: true,
        email: true,
        cedula: true,
        telefono: true
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json(abogados);
  } catch (error) {
    console.error("[ABOGADOS_GET]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 