import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { id } = await context.params;
    const body = (await request.json()) as {
      titulo?: string;
      slug?: string;
      descripcion?: string;
      contenido?: string;
      urlVideo?: string;
      imagenUrl?: string;
      tema?: string;
      orden?: number;
    };

    const exist = await db.curso.findUnique({ where: { id } });
    if (!exist) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    const curso = await db.curso.update({
      where: { id },
      data: {
        ...(body.titulo !== undefined && { titulo: body.titulo.trim() }),
        ...(body.slug !== undefined && { slug: body.slug.trim() || null }),
        ...(body.descripcion !== undefined && { descripcion: body.descripcion.trim() }),
        ...(body.contenido !== undefined && { contenido: body.contenido.trim() }),
        ...(body.urlVideo !== undefined && { urlVideo: body.urlVideo?.trim() || null }),
        ...(body.imagenUrl !== undefined && { imagenUrl: body.imagenUrl?.trim() || null }),
        ...(body.tema !== undefined && { tema: body.tema?.trim() || null }),
        ...(typeof body.orden === "number" && { orden: body.orden }),
      },
      include: { autor: { select: { name: true } } },
    });

    return NextResponse.json({ curso });
  } catch (error) {
    console.error("Error updating curso:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { id } = await context.params;
    const exist = await db.curso.findUnique({ where: { id } });
    if (!exist) return NextResponse.json({ error: "Curso no encontrado" }, { status: 404 });

    await db.curso.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting curso:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
