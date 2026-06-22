import { NextResponse } from "next/server";

import { expandPic18ProgressPayload } from "@/lib/aprende-pic18/expand-progress-payload";
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

/** GET — carga progreso del usuario en AprendePIC18 */
export async function GET(request: Request) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401, headers: CORS });
  }

  const rows = await db.$queryRawUnsafe<
    { payload: unknown; updated_at: Date }[]
  >(
    `SELECT payload, updated_at FROM aprende_pic18_progress WHERE user_id = $1 LIMIT 1`,
    userId,
  );

  const row = rows[0];
  const payload = expandPic18ProgressPayload(row?.payload ?? {});

  return NextResponse.json(
    {
      payload,
      updatedAt: row?.updated_at ?? null,
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

  const existing = await db.$queryRawUnsafe<{ payload: Record<string, unknown> }[]>(
    `SELECT payload FROM aprende_pic18_progress WHERE user_id = $1 LIMIT 1`,
    userId,
  );

  const merged = expandPic18ProgressPayload({
    ...(existing[0]?.payload ?? {}),
    ...incoming,
    quizzes: {
      ...((existing[0]?.payload?.quizzes as object) ?? {}),
      ...((incoming.quizzes as object) ?? {}),
    },
    studyPath: {
      ...((existing[0]?.payload?.studyPath as object) ?? {}),
      ...((incoming.studyPath as object) ?? {}),
    },
    checklists: {
      ...((existing[0]?.payload?.checklists as object) ?? {}),
      ...((incoming.checklists as object) ?? {}),
    },
    skillGuides: {
      ...((existing[0]?.payload?.skillGuides as object) ?? {}),
      ...((incoming.skillGuides as object) ?? {}),
    },
  });

  await db.$executeRawUnsafe(
    `INSERT INTO aprende_pic18_progress (user_id, payload, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (user_id)
     DO UPDATE SET payload = $2::jsonb, updated_at = NOW()`,
    userId,
    JSON.stringify(merged),
  );

  return NextResponse.json({ ok: true, payload: merged }, { headers: CORS });
}
