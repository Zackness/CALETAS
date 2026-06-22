import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { attachCourseProgressBundle } from "@/lib/cursos/attach-course-progress";
import { dedupeCursosByPlatform } from "@/lib/cursos/dedupe-cursos";
import { getAprendeProgressForUser } from "@/lib/aprende-progress-db";
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

    const { pic18, cpp } = await getAprendeProgressForUser(session.user.id);

    const unique = dedupeCursosByPlatform(cursos);

    return NextResponse.json({
      cursos: unique.map((curso) => ({
        ...curso,
        ...attachCourseProgressBundle(curso, pic18, cpp),
      })),
    });
  } catch (error) {
    console.error("Error listing cursos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
