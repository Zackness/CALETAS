import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const LIMIT = 6;

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim() || "";
    if (q.length < 2) {
      return NextResponse.json({
        recursos: [],
        materias: [],
        universidades: [],
      });
    }

    const [recursos, materias, universidades] = await Promise.all([
      db.recurso.findMany({
        where: {
          OR: [
            { titulo: { contains: q } },
            { descripcion: { contains: q } },
            { tags: { contains: q } },
            {
              materia: {
                OR: [
                  { nombre: { contains: q } },
                  { codigo: { contains: q } },
                ],
              },
            },
          ],
        },
        select: {
          id: true,
          titulo: true,
          tipo: true,
          materia: {
            select: { codigo: true, nombre: true },
          },
        },
        orderBy: { numVistas: "desc" },
        take: LIMIT,
      }),
      db.materia.findMany({
        where: {
          isActive: true,
          OR: [
            { nombre: { contains: q } },
            { codigo: { contains: q } },
          ],
        },
        select: {
          id: true,
          nombre: true,
          codigo: true,
          carrera: {
            select: {
              nombre: true,
              universidad: { select: { siglas: true } },
            },
          },
        },
        take: LIMIT,
      }),
      db.universidad.findMany({
        where: {
          isActive: true,
          OR: [
            { nombre: { contains: q } },
            { siglas: { contains: q } },
          ],
        },
        select: {
          id: true,
          nombre: true,
          siglas: true,
        },
        take: LIMIT,
      }),
    ]);

    return NextResponse.json({
      recursos,
      materias,
      universidades,
    });
  } catch (error) {
    console.error("Error search suggestions:", error);
    return NextResponse.json({ error: "Error al buscar" }, { status: 500 });
  }
}
