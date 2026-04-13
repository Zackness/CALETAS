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

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { id } = await context.params;
    const body = (await request.json()) as {
      titulo?: string;
      slug?: string;
      descripcion?: string | null;
      cuerpo?: string;
      orden?: number;
      isPublished?: boolean;
    };

    const data: Record<string, unknown> = {};
    if (body.titulo !== undefined) data.titulo = body.titulo.trim();
    if (body.slug !== undefined) data.slug = toSlug(body.slug);
    if (body.descripcion !== undefined) data.descripcion = body.descripcion?.trim() || null;
    if (body.cuerpo !== undefined) data.cuerpo = body.cuerpo.trim();
    if (body.orden !== undefined) data.orden = Number(body.orden) || 0;
    if (body.isPublished !== undefined) data.isPublished = body.isPublished;

    if (data.slug) {
      const clash = await db.bibliotecaObra.findFirst({
        where: { slug: data.slug as string, NOT: { id } },
      });
      if (clash) {
        return NextResponse.json({ error: "Ese slug ya existe" }, { status: 409 });
      }
    }

    const obra = await db.bibliotecaObra.update({
      where: { id },
      data: data as any,
    });
    return NextResponse.json({ obra });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    console.error("admin biblioteca PATCH:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { id } = await context.params;
    await db.bibliotecaObra.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") {
      return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    }
    console.error("admin biblioteca DELETE:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
