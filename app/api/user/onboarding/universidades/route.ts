import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const universidades = await db.universidad.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        nombre: true,
        siglas: true,
        tipo: true,
        estado: true,
        ciudad: true,
        ranking: true,
      },
      orderBy: {
        ranking: 'asc'
      }
    });

    return NextResponse.json(universidades);
  } catch (error) {
    console.error("Error fetching universidades:", error);
    return NextResponse.json(
      { error: "Error al obtener las universidades" },
      { status: 500 }
    );
  }
} 