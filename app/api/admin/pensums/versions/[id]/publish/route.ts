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

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const { id } = await context.params;
    const version = await db.pensumVersion.findUnique({ where: { id } });
    if (!version) return NextResponse.json({ error: "Versión no encontrada" }, { status: 404 });

    const snapshot = (version.snapshot as SnapshotMateria[]) || [];

    await db.$transaction(async (tx) => {
      const current = await tx.materia.findMany({
        where: { carreraId: version.carreraId },
        select: { id: true, codigo: true },
      });
      const currentByCode = new Map(current.map((m) => [m.codigo, m.id]));

      for (const m of snapshot) {
        if (currentByCode.has(m.codigo)) {
          await tx.materia.update({
            where: { id: currentByCode.get(m.codigo)! },
            data: {
              nombre: m.nombre,
              creditos: m.creditos,
              semestre: m.semestre as any,
              horasTeoria: m.horasTeoria,
              horasPractica: m.horasPractica,
              isActive: true,
            },
          });
        } else {
          const created = await tx.materia.create({
            data: {
              carreraId: version.carreraId,
              codigo: m.codigo,
              nombre: m.nombre,
              creditos: m.creditos,
              semestre: m.semestre as any,
              horasTeoria: m.horasTeoria,
              horasPractica: m.horasPractica,
              isActive: true,
            },
          });
          currentByCode.set(created.codigo, created.id);
        }
      }

      const snapshotCodes = new Set(snapshot.map((m) => m.codigo));
      const toDisable = current.filter((m) => !snapshotCodes.has(m.codigo)).map((m) => m.id);
      if (toDisable.length > 0) {
        await tx.materia.updateMany({
          where: { id: { in: toDisable } },
          data: { isActive: false },
        });
      }

      const activeMateriaIds = Array.from(currentByCode.values());
      if (activeMateriaIds.length > 0) {
        await tx.materiaPrerrequisito.deleteMany({
          where: { materiaId: { in: activeMateriaIds } },
        });
      }

      for (const m of snapshot) {
        const materiaId = currentByCode.get(m.codigo);
        if (!materiaId) continue;
        const prereqIds = m.prerrequisitoCodigos
          .map((code) => currentByCode.get(code))
          .filter(Boolean) as string[];
        if (prereqIds.length) {
          await tx.materiaPrerrequisito.createMany({
            data: prereqIds.map((pr) => ({ materiaId, prerrequisitoId: pr })),
            skipDuplicates: true,
          });
        }
      }

      await tx.pensumVersion.updateMany({
        where: { carreraId: version.carreraId, status: "PUBLISHED" },
        data: { status: "ARCHIVED" },
      });

      await tx.pensumVersion.update({
        where: { id: version.id },
        data: { status: "PUBLISHED", publishedAt: new Date() },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error publishing pensum version:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
