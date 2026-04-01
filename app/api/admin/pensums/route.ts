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

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const carreraId = request.nextUrl.searchParams.get("carreraId");

    const universidades = await db.universidad.findMany({
      select: {
        id: true,
        nombre: true,
        carreras: {
          where: { isActive: true },
          select: { id: true, nombre: true, codigo: true },
          orderBy: { nombre: "asc" },
        },
      },
      orderBy: { nombre: "asc" },
    });

    if (!carreraId) return NextResponse.json({ universidades, materias: [] });

    const materias = await db.materia.findMany({
      where: { carreraId },
      include: {
        prerrequisitos: {
          include: {
            prerrequisito: { select: { id: true, codigo: true, nombre: true } },
          },
        },
      },
      orderBy: [{ semestre: "asc" }, { codigo: "asc" }],
    });

    return NextResponse.json({ universidades, materias });
  } catch (error) {
    console.error("Error listing pensum admin data:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) return NextResponse.json({ error: "No autorizado" }, { status: admin.status });

    const body = (await request.json()) as {
      carreraId?: string;
      codigo?: string;
      nombre?: string;
      creditos?: number;
      semestre?: string;
      horasTeoria?: number;
      horasPractica?: number;
      prerrequisitoIds?: string[];
    };

    if (!body.carreraId || !body.codigo?.trim() || !body.nombre?.trim()) {
      return NextResponse.json({ error: "Carrera, código y nombre son obligatorios" }, { status: 400 });
    }
    if (!body.semestre || !SEMESTRES.includes(body.semestre as any)) {
      return NextResponse.json({ error: "Semestre inválido" }, { status: 400 });
    }

    const materia = await db.materia.create({
      data: {
        carreraId: body.carreraId,
        codigo: body.codigo.trim().toUpperCase(),
        nombre: body.nombre.trim(),
        creditos: Math.max(0, Number(body.creditos ?? 0)),
        semestre: body.semestre as any,
        horasTeoria: Math.max(0, Number(body.horasTeoria ?? 0)),
        horasPractica: Math.max(0, Number(body.horasPractica ?? 0)),
      },
    });

    const prereqIds = Array.isArray(body.prerrequisitoIds) ? body.prerrequisitoIds : [];
    if (prereqIds.length > 0) {
      await db.materiaPrerrequisito.createMany({
        data: prereqIds.map((id) => ({
          materiaId: materia.id,
          prerrequisitoId: id,
        })),
        skipDuplicates: true,
      });
    }

    return NextResponse.json({ materia }, { status: 201 });
  } catch (error) {
    console.error("Error creating pensum materia:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
