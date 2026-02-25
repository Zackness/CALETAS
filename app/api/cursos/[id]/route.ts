import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({ headers: _request.headers });
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const { id } = await context.params;
    const curso = await db.curso.findFirst({
      where: { id },
      include: { autor: { select: { name: true } } },
    });
    if (!curso) {
      return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });
    }
    return NextResponse.json(curso);
  } catch (error) {
    console.error("Error fetching curso:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
