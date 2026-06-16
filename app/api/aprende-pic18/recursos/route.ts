import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { recursoToExploreHref } from "@/lib/recurso-view-href";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

const MICRO_TAG_FRAGMENTS = ["pic18", "microcontrolador", "microcontroladores", "pic18f4550"];

function appOrigin() {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    process.env.BETTER_AUTH_URL?.replace(/\/$/, "") ||
    "https://caleta.top"
  );
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** GET — recursos publicos de CALETAS relacionados con Microcontroladores / PIC18 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(Math.max(Number(searchParams.get("limit")) || 24, 1), 50);

    const recursos = await db.recurso.findMany({
      where: {
        esPublico: true,
        OR: [
          {
            materia: {
              nombre: { contains: "Microcontrolador", mode: "insensitive" },
            },
          },
          ...MICRO_TAG_FRAGMENTS.map((tag) => ({
            tags: { contains: tag, mode: "insensitive" as const },
          })),
        ],
      },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        tipo: true,
        tags: true,
        calificacion: true,
        numVistas: true,
        archivoUrl: true,
        createdAt: true,
        materia: {
          select: {
            nombre: true,
            codigo: true,
          },
        },
      },
      orderBy: [{ calificacion: "desc" }, { numVistas: "desc" }, { createdAt: "desc" }],
      take: limit,
    });

    const origin = appOrigin();
    const items = recursos.map((r) => ({
      id: r.id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      tipo: r.tipo,
      tags: r.tags,
      calificacion: r.calificacion,
      numVistas: r.numVistas,
      materia: r.materia,
      href: `${origin}${recursoToExploreHref(r)}`,
    }));

    return NextResponse.json({ recursos: items, total: items.length }, { headers: CORS });
  } catch (error) {
    console.error("Error fetching aprende-pic18 recursos:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500, headers: CORS });
  }
}
