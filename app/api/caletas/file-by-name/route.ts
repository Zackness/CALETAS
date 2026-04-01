import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const filename = request.nextUrl.searchParams.get("filename");
    if (!filename) {
      return NextResponse.json({ error: "filename es requerido" }, { status: 400 });
    }

    const recurso = await db.recurso.findFirst({
      where: {
        archivoUrl: { contains: filename },
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        titulo: true,
        archivoUrl: true,
      },
    });

    if (!recurso?.archivoUrl) {
      return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({
      file: {
        id: recurso.id,
        name: filename,
        url: recurso.archivoUrl,
        titulo: recurso.titulo,
      },
    });
  } catch (error) {
    console.error("Error resolving file by name:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
