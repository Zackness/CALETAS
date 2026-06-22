import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { attachCourseProgressBundle } from "@/lib/cursos/attach-course-progress";
import { getAprendeProgressForUser } from "@/lib/aprende-progress-db";
import { db, isDatabaseUnreachableError } from "@/lib/db";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await context.params;

    let curso;
    try {
      curso = await db.curso.findFirst({
        where: { id },
        include: { autor: { select: { name: true } } },
      });
    } catch (error) {
      if (isDatabaseUnreachableError(error)) {
        return NextResponse.json(
          {
            error:
              "No hay conexión con la base de datos. Si usas Neon, espera unos segundos y reintenta.",
            code: "DATABASE_UNAVAILABLE",
          },
          { status: 503 },
        );
      }
      throw error;
    }

    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const { pic18, cpp } = await getAprendeProgressForUser(session.user.id);
    const bundle = attachCourseProgressBundle(curso, pic18, cpp);

    return NextResponse.json({
      ...curso,
      ...bundle,
    });
  } catch (error) {
    console.error("Error fetching curso:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
