import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export const runtime = "nodejs";

const DEVICE_ID_PATTERN = /^[a-zA-Z0-9_-]{8,128}$/;

function ownerIdForDevice(deviceId: string) {
  return `device:${deviceId}`;
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

export async function GET(
  _request: Request,
  context: { params: Promise<{ deviceId: string }> },
) {
  try {
    const { deviceId } = await context.params;
    if (!DEVICE_ID_PATTERN.test(deviceId)) {
      return NextResponse.json({ error: "deviceId invalido" }, { status: 400 });
    }

    const row = await db.zenoWorkspace.findUnique({
      where: { ownerId: ownerIdForDevice(deviceId) },
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
    console.error("[ZENO_WORKSPACE_LOCAL_GET]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ deviceId: string }> },
) {
  try {
    const { deviceId } = await context.params;
    if (!DEVICE_ID_PATTERN.test(deviceId)) {
      return NextResponse.json({ error: "deviceId invalido" }, { status: 400 });
    }

    const body = await request.json();
    const payload = body?.payload;
    if (!payload || typeof payload !== "object") {
      return NextResponse.json({ error: "payload is required" }, { status: 400 });
    }

    const row = await db.zenoWorkspace.upsert({
      where: { ownerId: ownerIdForDevice(deviceId) },
      create: {
        ownerId: ownerIdForDevice(deviceId),
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
    console.error("[ZENO_WORKSPACE_LOCAL_PUT]", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
