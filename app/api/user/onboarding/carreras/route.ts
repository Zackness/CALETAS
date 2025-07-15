import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const universidadId = searchParams.get('universidadId');

    if (!universidadId) {
      return NextResponse.json(
        { error: "ID de universidad es requerido" },
        { status: 400 }
      );
    }

    const carreras = await db.carrera.findMany({
      where: {
        universidadId: universidadId,
        isActive: true
      },
      select: {
        id: true,
        nombre: true,
        codigo: true,
        descripcion: true,
        duracion: true,
        creditos: true,
        universidad: {
          select: {
            nombre: true,
            siglas: true
          }
        }
      },
      orderBy: {
        nombre: 'asc'
      }
    });

    return NextResponse.json(carreras);
  } catch (error) {
    console.error("Error fetching carreras:", error);
    return NextResponse.json(
      { error: "Error al obtener las carreras" },
      { status: 500 }
    );
  }
} 