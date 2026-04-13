import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

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

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const obras = await db.bibliotecaObra.findMany({
      orderBy: [{ orden: "asc" }, { titulo: "asc" }],
      take: 500,
    });
    return NextResponse.json({ obras });
  } catch (e) {
    console.error("admin biblioteca GET:", e);
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
      cuerpo?: string;
      orden?: number;
      isPublished?: boolean;
    };

    if (!body.titulo?.trim() || !body.cuerpo?.trim()) {
      return NextResponse.json({ error: "Título y cuerpo son obligatorios" }, { status: 400 });
    }

    let slug = body.slug?.trim() ? toSlug(body.slug) : toSlug(body.titulo);
    const exists = await db.bibliotecaObra.findUnique({ where: { slug } });
    if (exists) slug = `${slug}-${Date.now().toString(36)}`;

    const obra = await db.bibliotecaObra.create({
      data: {
        titulo: body.titulo.trim(),
        slug,
        descripcion: body.descripcion?.trim() || null,
        cuerpo: body.cuerpo.trim(),
        orden: Number.isFinite(body.orden) ? Number(body.orden) : 0,
        isPublished: !!body.isPublished,
      },
    });

    return NextResponse.json({ obra }, { status: 201 });
  } catch (e) {
    console.error("admin biblioteca POST:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
