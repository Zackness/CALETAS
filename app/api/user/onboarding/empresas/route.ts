import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const empresas = await db.empresa.findMany({
      select: {
        id: true,
        nombre: true,
        tipo: true,
      },
    });

    return NextResponse.json(empresas);
  } catch (error) {
    console.error("Error fetching empresas:", error);
    return NextResponse.json(
      { error: "Error al obtener las empresas" },
      { status: 500 }
    );
  }
} 