import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { empresaId, password } = body;

    if (!empresaId || !password) {
      return new NextResponse("Faltan datos requeridos", { status: 400 });
    }

    // Buscar la empresa
    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true, nombre: true, password: true }
    });

    if (!empresa) {
      return new NextResponse("Empresa no encontrada", { status: 404 });
    }

    if (!empresa.password) {
      return new NextResponse("Esta empresa no tiene contraseña configurada", { status: 400 });
    }

    // Verificar la contraseña usando bcrypt
    const isValid = await bcrypt.compare(password, empresa.password);

    return NextResponse.json({
      valid: isValid,
      empresa: {
        id: empresa.id,
        nombre: empresa.nombre
      }
    });

  } catch (error) {
    console.error("[VALIDATE_COMPANY_PASSWORD]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 