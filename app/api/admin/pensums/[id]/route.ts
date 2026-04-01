import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

const SEMESTRES = ["S1", "S2", "S3", "S4", "S5", "S6", "S7", "S8", "S9", "S10"] as const;

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
      codigo?: string;
      nombre?: string;
      creditos?: number;
      semestre?: string;
      horasTeoria?: number;
      horasPractica?: number;
      prerrequisitoIds?: string[];
    };

    if (body.semestre && !SEMESTRES.includes(body.semestre as any)) {
      return NextResponse.json({ error: "Semestre inválido" }, { status: 400 });
    }

    await db.materia.update({
      where: { id },
      data: {
        ...(body.codigo !== undefined && { codigo: body.codigo.trim().toUpperCase() }),
        ...(body.nombre !== undefined && { nombre: body.nombre.trim() }),
        ...(body.creditos !== undefined && { creditos: Math.max(0, Number(body.creditos)) }),
        ...(body.semestre !== undefined && { semestre: body.semestre as any }),
        ...(body.horasTeoria !== undefined && { horasTeoria: Math.max(0, Number(body.horasTeoria)) }),
        ...(body.horasPractica !== undefined && { horasPractica: Math.max(0, Number(body.horasPractica)) }),
      },
    });

    if (Array.isArray(body.prerrequisitoIds)) {
      await db.materiaPrerrequisito.deleteMany({ where: { materiaId: id } });
      if (body.prerrequisitoIds.length > 0) {
        await db.materiaPrerrequisito.createMany({
          data: body.prerrequisitoIds.map((pr) => ({ materiaId: id, prerrequisitoId: pr })),
          skipDuplicates: true,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error updating pensum materia:", error);
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

    await db.$transaction([
      db.materiaPrerrequisito.deleteMany({ where: { materiaId: id } }),
      db.materiaPrerrequisito.deleteMany({ where: { prerrequisitoId: id } }),
      db.materia.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting pensum materia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
