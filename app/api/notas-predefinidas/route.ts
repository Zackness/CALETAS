import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { UserRole } from "@prisma/client";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      console.error("No hay sesión de usuario");
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

    console.log("Usuario encontrado:", user);

    // Solo los administradores y abogados pueden ver las notas predefinidas
    if (user?.role === UserRole.CLIENT) {
      console.error("Usuario no autorizado:", user?.role);
      return new NextResponse("No autorizado", { status: 403 });
    }

    console.log("Buscando notas predefinidas...");
    const notasPredefinidas = await db.nota.findMany({
      orderBy: {
        contenido: 'asc'
      }
    });

    console.log("Notas predefinidas encontradas:", notasPredefinidas);

    return NextResponse.json(notasPredefinidas);
  } catch (error) {
    console.error("[NOTAS_PREDEFINIDAS_GET]", error);
    return new NextResponse("Error interno", { status: 500 });
  }
} 