import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// GET /api/familiares - Obtener todos los familiares del usuario
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const familiares = await db.familiar.findMany({
      where: {
        usuarioId: session.user.id
      }
    });

    return NextResponse.json(familiares);
  } catch (error) {
    console.error("[FAMILIARES_GET]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
}

// POST /api/familiares - Crear un nuevo familiar
export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse("No autorizado", { status: 401 });
    }

    const body = await req.json();
    const { ciPhoto, telefono, parentesco, analyzedData } = body;

    if (!analyzedData || !parentesco) {
      return new NextResponse("Faltan campos requeridos", { status: 400 });
    }

    // Verificar si ya existe un familiar con la misma cédula
    const existingFamiliar = await db.familiar.findUnique({
      where: {
        cedula: analyzedData.cedula
      }
    });

    if (existingFamiliar) {
      return new NextResponse("Ya existe un familiar registrado con esta cédula", { status: 400 });
    }

    // Crear el nuevo familiar
    const familiar = await db.familiar.create({
      data: {
        nombre: analyzedData.nombre,
        nombre2: analyzedData.nombre2 || null,
        apellido: analyzedData.apellido || null,
        apellido2: analyzedData.apellido2 || null,
        cedula: analyzedData.cedula,
        telefono: telefono || null,
        parentesco,
        fechaNacimiento: new Date(analyzedData.fechaNacimiento),
        usuarioId: session.user.id
      }
    });

    return NextResponse.json(familiar);
  } catch (error) {
    console.error("[FAMILIARES_POST]", error);
    return new NextResponse("Error interno del servidor", { status: 500 });
  }
} 