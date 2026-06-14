import { randomUUID } from "crypto";
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
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { id } = await params;
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      role?: string;
      telefono?: string | null;
      isEmailVerified?: boolean;
      isTwoFactorEnabled?: boolean;
      universidadId?: string | null;
      carreraId?: string | null;
      semestreActual?: string | null;
      materias?: Array<{
        materiaId: string;
        estado?: string;
        nota?: number | null;
        semestreCursado?: string | null;
        observaciones?: string | null;
      }>;
      replaceMaterias?: boolean;
    };

    const data: any = {};

    if (body.name !== undefined) data.name = body.name;
    if (body.email !== undefined) data.email = body.email.toLowerCase().trim();
    if (body.role !== undefined) data.role = body.role;
    if (body.telefono !== undefined) data.telefono = body.telefono;
    if (body.isEmailVerified !== undefined) data.isEmailVerified = body.isEmailVerified;
    if (body.isTwoFactorEnabled !== undefined) {
      data.isTwoFactorEnabled = body.isTwoFactorEnabled;
    }

    let credentialPasswordHash: string | null = null;
    if (body.password != null && String(body.password).length > 0) {
      const plain = String(body.password);
      if (plain.length < 8) {
        return NextResponse.json(
          { error: "La contraseña debe tener al menos 8 caracteres" },
          { status: 400 },
        );
      }
      const bcrypt = await import("bcryptjs");
      credentialPasswordHash = await bcrypt.hash(plain, 10);
      data.password = credentialPasswordHash;
    }

    if (body.universidadId !== undefined) data.universidadId = body.universidadId;
    if (body.carreraId !== undefined) data.carreraId = body.carreraId;
    if (body.semestreActual !== undefined) data.semestreActual = body.semestreActual;

    const materiasUpdates = Array.isArray(body.materias) ? body.materias : [];
    const replaceMaterias = body.replaceMaterias === true;

    const user = await db.$transaction(
      async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          isEmailVerified: true,
          isTwoFactorEnabled: true,
          telefono: true,
          universidadId: true,
          carreraId: true,
          semestreActual: true,
        },
      });

      if (credentialPasswordHash) {
        const cred = await tx.authAccount.findFirst({
          where: { userId: id, providerId: "credential" },
          select: { id: true },
        });
        if (cred) {
          await tx.authAccount.update({
            where: { id: cred.id },
            data: { password: credentialPasswordHash },
          });
        } else {
          await tx.authAccount.create({
            data: {
              id: randomUUID(),
              providerId: "credential",
              accountId: id,
              userId: id,
              password: credentialPasswordHash,
            },
          });
        }
      }

      if (materiasUpdates.length > 0 || replaceMaterias) {
        if (replaceMaterias) {
          await tx.materiaEstudiante.deleteMany({
            where: { userId: id },
          });
          const byMateria = new Map<string, (typeof materiasUpdates)[0]>();
          for (const m of materiasUpdates) {
            if (m?.materiaId) byMateria.set(m.materiaId, m);
          }
          const toCreate = [...byMateria.values()];
          if (toCreate.length > 0) {
            await tx.materiaEstudiante.createMany({
              data: toCreate.map((m) => ({
                userId: id,
                materiaId: m.materiaId,
                estado: (m.estado as any) ?? "EN_CURSO",
                nota: m.nota ?? null,
                semestreCursado: m.semestreCursado ?? null,
                observaciones: m.observaciones ?? null,
              })),
            });
          }
        } else {
          for (const m of materiasUpdates) {
            if (!m?.materiaId) continue;
            await tx.materiaEstudiante.upsert({
              where: {
                userId_materiaId: { userId: id, materiaId: m.materiaId },
              },
              create: {
                userId: id,
                materiaId: m.materiaId,
                estado: (m.estado as any) ?? "EN_CURSO",
                nota: m.nota ?? null,
                semestreCursado: m.semestreCursado ?? null,
                observaciones: m.observaciones ?? null,
              },
              update: {
                estado: (m.estado as any) ?? undefined,
                nota: m.nota ?? null,
                semestreCursado: m.semestreCursado ?? null,
                observaciones: m.observaciones ?? null,
              },
            });
          }
        }
      }

      return updatedUser;
    },
      {
        maxWait: 15_000,
        timeout: 60_000,
      },
    );

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { id } = await params;
    const user = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        telefono: true,
        universidadId: true,
        carreraId: true,
        semestreActual: true,
        UserSubscription: {
          take: 1,
          orderBy: { createdAt: "desc" },
          select: {
            createdAt: true,
            subscriptionType: { select: { name: true } },
          },
        },
        universidad: { select: { id: true, nombre: true, siglas: true } },
        carrera: { select: { id: true, nombre: true, codigo: true, universidadId: true } },
        materiasEstudiante: {
          select: {
            id: true,
            materiaId: true,
            estado: true,
            nota: true,
            semestreCursado: true,
            observaciones: true,
            materia: { select: { id: true, codigo: true, nombre: true, semestre: true, carreraId: true } },
          },
          orderBy: [{ updatedAt: "desc" }],
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
    const last = (user as any).UserSubscription?.[0];
    const normalized = {
      ...(user as any),
      subscriptionStartedAt: last?.createdAt ?? null,
      subscriptionName: last?.subscriptionType?.name ?? null,
      UserSubscription: undefined,
    };
    return NextResponse.json({ user: normalized });
  } catch (error) {
    console.error("Error fetching user details:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin(request.headers);
    if (!admin.ok) {
      return NextResponse.json({ error: "No autorizado" }, { status: admin.status });
    }

    const { id } = await params;

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

