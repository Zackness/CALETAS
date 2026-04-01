import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

type SnapshotMateria = {
  codigo: string;
  nombre: string;
  creditos: number;
  semestre: string;
  horasTeoria: number;
  horasPractica: number;
  prerrequisitoCodigos: string[];
};

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
    const body = (await request.json()) as { name?: string; notes?: string; status?: "DRAFT" | "ARCHIVED" };

    const version = await db.pensumVersion.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name.trim() }),
        ...(body.notes !== undefined && { notes: body.notes?.trim() || null }),
        ...(body.status !== undefined && { status: body.status }),
      },
    });

    return NextResponse.json({ version });
  } catch (error) {
    console.error("Error updating pensum version:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { id } = await context.params;
    const version = await db.pensumVersion.findUnique({ where: { id } });
    if (!version) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 });
    return NextResponse.json({ version });
  } catch (error) {
    console.error("Error fetching pensum version:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
