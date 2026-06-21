import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { summarizePic18Progress } from "@/lib/aprende-pic18-progress-summary";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const tema = searchParams.get("tema")?.trim() || undefined;
    const cursos = await db.curso.findMany({
      where: tema ? { tema } : undefined,
      orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        titulo: true,
        slug: true,
        tipo: true,
        descripcion: true,
        contenido: true,
        urlVideo: true,
        externalUrl: true,
        imagenUrl: true,
        tema: true,
        orden: true,
        createdAt: true,
        autor: { select: { name: true } },
      },
    });

    const pic18Progress = await db.aprendePic18Progress.findUnique({
      where: { userId: session.user.id },
      select: { payload: true, updatedAt: true },
    });
    const pic18Summary = summarizePic18Progress(pic18Progress?.payload);

    return NextResponse.json({
      cursos: cursos.map((curso) => {
        const isPic18 =
          curso.slug === "aprende-pic18" ||
          curso.externalUrl?.includes("pic18.caleta.top") ||
          curso.titulo.toLowerCase().includes("pic18");
        return {
          ...curso,
          progress: isPic18 ? pic18Summary : null,
          progressUpdatedAt: isPic18 ? pic18Progress?.updatedAt ?? null : null,
        };
      }),
    });
  } catch (error) {
    console.error("Error listing cursos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
