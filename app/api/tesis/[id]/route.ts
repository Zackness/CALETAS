import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function requireOwner(headers: Headers, id: string) {
  const session = await auth.api.getSession({ headers });
  if (!session?.user?.id) return { ok: false as const, status: 401 as const, userId: null as string | null };
  const doc = await db.tesisDocumento.findUnique({ where: { id }, select: { ownerId: true } });
  if (!doc) return { ok: false as const, status: 404 as const, userId: session.user.id };
  if (doc.ownerId !== session.user.id) return { ok: false as const, status: 403 as const, userId: session.user.id };
  return { ok: true as const, userId: session.user.id };
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authz = await requireOwner(request.headers, id);
    if (!authz.ok) return NextResponse.json({ error: "No autorizado" }, { status: authz.status });

    const doc = await db.tesisDocumento.findUnique({ where: { id } });
    if (!doc) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    return NextResponse.json({ doc });
  } catch (e) {
    console.error("tesis GET by id:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authz = await requireOwner(request.headers, id);
    if (!authz.ok) return NextResponse.json({ error: "No autorizado" }, { status: authz.status });

    const body = (await request.json()) as Partial<{
      titulo: string;
      cuerpo: string;
      headerTemplate: string;
      footerTemplate: string;
      paperSize: "a4" | "letter" | "tabloid";
      paperMode: "light" | "dim";
      zoom: number;
      fontScale: number;
    }>;

    const data: Record<string, unknown> = {};
    if (body.titulo !== undefined) data.titulo = body.titulo.trim().slice(0, 140);
    if (body.cuerpo !== undefined) data.cuerpo = body.cuerpo;
    if (body.headerTemplate !== undefined) data.headerTemplate = body.headerTemplate;
    if (body.footerTemplate !== undefined) data.footerTemplate = body.footerTemplate;
    if (body.paperSize !== undefined) data.paperSize = body.paperSize;
    if (body.paperMode !== undefined) data.paperMode = body.paperMode;
    if (body.zoom !== undefined) data.zoom = Math.max(70, Math.min(160, Math.round(Number(body.zoom) || 100)));
    if (body.fontScale !== undefined) data.fontScale = Math.max(0.75, Math.min(1.25, Number(body.fontScale) || 0.92));

    const doc = await db.tesisDocumento.update({ where: { id }, data: data as any });
    return NextResponse.json({ doc });
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    console.error("tesis PATCH:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const authz = await requireOwner(request.headers, id);
    if (!authz.ok) return NextResponse.json({ error: "No autorizado" }, { status: authz.status });

    await db.tesisDocumento.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return NextResponse.json({ error: "No encontrado" }, { status: 404 });
    console.error("tesis DELETE:", e);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

