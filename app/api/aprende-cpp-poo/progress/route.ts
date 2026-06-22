import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { verifyMobileJwt } from "@/lib/zeno-mobile-auth";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

function getUserId(request: Request) {
  return verifyMobileJwt(request.headers.get("Authorization"))?.id ?? null;
}

/** GET — carga progreso del usuario en AprendeC++ POO */
export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: CORS });
  }

  const row = await db.aprendeCppPooProgress.findUnique({
    where: { userId },
    select: { payload: true, updatedAt: true },
  });

  return NextResponse.json(
    {
      payload: row?.payload ?? {},
      updatedAt: row?.updatedAt ?? null,
    },
    { headers: CORS },
  );
}

/** PUT — guarda/merge progreso (quizzes, ruta, checklists) */
export async function PUT(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: CORS });
  }

  const body = await request.json();
  const incoming = body?.payload ?? body;
  if (!incoming || typeof incoming !== "object") {
    return NextResponse.json({ error: "Payload invalido" }, { status: 400, headers: CORS });
  }

  const existing = await db.aprendeCppPooProgress.findUnique({
    where: { userId },
    select: { payload: true },
  });

  const prev = (existing?.payload as Record<string, unknown> | undefined) ?? {};
  const merged = {
    ...prev,
    ...incoming,
    quizzes: {
      ...((prev.quizzes as object) ?? {}),
      ...((incoming.quizzes as object) ?? {}),
    },
    studyPath: {
      ...((prev.studyPath as object) ?? {}),
      ...((incoming.studyPath as object) ?? {}),
    },
    checklists: {
      ...((prev.checklists as object) ?? {}),
      ...((incoming.checklists as object) ?? {}),
    },
  };

  const row = await db.aprendeCppPooProgress.upsert({
    where: { userId },
    create: { userId, payload: merged },
    update: { payload: merged },
    select: { payload: true },
  });

  return NextResponse.json({ ok: true, payload: row.payload }, { headers: CORS });
}
