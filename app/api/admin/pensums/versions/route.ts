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
  return { ok: true as const, userId: session.user.id };
}

const buildSnapshotFromMaterias = (materias: any[]): SnapshotMateria[] =>
  materias.map((m) => ({
    codigo: m.codigo,
    nombre: m.nombre,
    creditos: m.creditos,
    semestre: m.semestre,
    horasTeoria: m.horasTeoria,
    horasPractica: m.horasPractica,
    prerrequisitoCodigos: (m.prerrequisitos || []).map((p: any) => p.prerrequisito.codigo),
  }));

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const carreraId = request.nextUrl.searchParams.get("carreraId");
    if (!carreraId) return NextResponse.json({ versions: [] });

    const versions = await db.pensumVersion.findMany({
      where: { carreraId },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: [{ versionNumber: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error listing pensum versions:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const body = (await request.json()) as {
      carreraId?: string;
      universidadId?: string;
      sourceVersionId?: string;
      name?: string;
      notes?: string;
    };

    if (!body.carreraId || !body.universidadId) {
      return NextResponse.json({ error: "carreraId y universidadId son requeridos" }, { status: 400 });
    }

    let snapshot: SnapshotMateria[] = [];
    if (body.sourceVersionId) {
      const source = await db.pensumVersion.findUnique({
        where: { id: body.sourceVersionId },
        select: { snapshot: true },
      });
      if (!source) return NextResponse.json({ error: "Versión origen no encontrada" }, { status: 404 });
      snapshot = (source.snapshot as SnapshotMateria[]) || [];
    } else {
      const materias = await db.materia.findMany({
        where: { carreraId: body.carreraId },
        include: {
          prerrequisitos: {
            include: { prerrequisito: { select: { codigo: true } } },
          },
        },
        orderBy: [{ semestre: "asc" }, { codigo: "asc" }],
      });
      snapshot = buildSnapshotFromMaterias(materias);
    }

    const last = await db.pensumVersion.findFirst({
      where: { carreraId: body.carreraId },
      orderBy: { versionNumber: "desc" },
      select: { versionNumber: true },
    });

    const version = await db.pensumVersion.create({
      data: {
        universidadId: body.universidadId,
        carreraId: body.carreraId,
        versionNumber: (last?.versionNumber || 0) + 1,
        name: body.name?.trim() || `Versión ${(last?.versionNumber || 0) + 1}`,
        notes: body.notes?.trim() || null,
        status: "DRAFT",
        snapshot: snapshot as any,
        createdById: admin.userId,
      },
    });

    return NextResponse.json({ version }, { status: 201 });
  } catch (error) {
    console.error("Error creating pensum version:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
