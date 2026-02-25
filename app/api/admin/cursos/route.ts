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
  return { ok: true as const, session };
}

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    const cursos = await db.curso.findMany({
      orderBy: [{ orden: "asc" }, { createdAt: "desc" }],
      include: { autor: { select: { name: true } } },
    });
    return NextResponse.json({ cursos });
  } catch (error) {
    console.error("Error listing admin cursos:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
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
    if (!body.titulo?.trim()) {
      return NextResponse.json({ error: "El título es requerido" }, { status: 400 });
    }
    const slug =
      body.slug?.trim() ||
      body.titulo.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    const curso = await db.curso.create({
      data: {
        titulo: body.titulo.trim(),
        slug: slug || undefined,
        descripcion: (body.descripcion ?? "").trim(),
        contenido: (body.contenido ?? "").trim(),
        urlVideo: body.urlVideo?.trim() || null,
        imagenUrl: body.imagenUrl?.trim() || null,
        tema: body.tema?.trim() || null,
        orden: typeof body.orden === "number" ? body.orden : 0,
        autorId: admin.session.user.id,
      },
      include: { autor: { select: { name: true } } },
    });
    return NextResponse.json({ curso }, { status: 201 });
  } catch (error) {
    console.error("Error creating curso:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
