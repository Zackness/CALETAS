import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { announceNewCurso } from "@/lib/notifications/announce-curso";

async function requireAdmin(headers: Headers) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const };
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== "ADMIN") return { ok: false as const, status: 403 as const };
  return { ok: true as const };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { id } = await context.params;
    const curso = await db.curso.findUnique({
      where: { id },
      select: { id: true, titulo: true, descripcion: true },
    });

    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }

    const result = await announceNewCurso(curso);
    return NextResponse.json({
      ok: true,
      titulo: curso.titulo,
      ...result,
    });
  } catch (error) {
    console.error("[admin/cursos/announce] Error:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
