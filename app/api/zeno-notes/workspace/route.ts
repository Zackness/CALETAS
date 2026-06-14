import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { verifyMobileJwt } from "@/lib/zeno-mobile-auth";

export const runtime = "nodejs";

async function resolveAuthenticatedUserId(request: Request): Promise<string | null> {
  const jwtUser = verifyMobileJwt(request.headers.get("Authorization"));
  if (jwtUser?.id) return jwtUser.id;

  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user?.id ?? null;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function GET(request: Request) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const row = await db.zenoWorkspace.findUnique({
      where: { ownerId: userId },
      select: { payload: true, updatedAt: true },
    });

    if (!row) {
      return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    return NextResponse.json({
      payload: row.payload,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[ZENO_WORKSPACE_GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await resolveAuthenticatedUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const payload = body?.payload;
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "payload is required" }, { status: 400 });
    }

    const row = await db.zenoWorkspace.upsert({
      where: { ownerId: userId },
      create: {
        ownerId: userId,
        payload,
      },
      update: {
        payload,
      },
      select: { updatedAt: true },
    });

    return NextResponse.json({
      ok: true,
      updatedAt: row.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("[ZENO_WORKSPACE_PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
