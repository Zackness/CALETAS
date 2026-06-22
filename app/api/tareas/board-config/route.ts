import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getCaletaTaskBoardConfigForUser,
  saveCaletaTaskBoardColumns,
} from "@/lib/tareas/board-config-service";
import type { StoredTaskBoardColumn } from "@/lib/tareas/task-board-config";

function unauthorized() {
  return NextResponse.json({ error: "No autorizado" }, { status: 401 });
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return unauthorized();

  const config = await getCaletaTaskBoardConfigForUser(session.user.id);
  return NextResponse.json(config);
}

export async function PUT(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    columns?: StoredTaskBoardColumn[];
  } | null;

  if (!Array.isArray(body?.columns)) {
    return NextResponse.json({ error: "Formato inválido." }, { status: 400 });
  }

  try {
    const columns = await saveCaletaTaskBoardColumns(session.user.id, body.columns);
    const { stored } = await getCaletaTaskBoardConfigForUser(session.user.id);
    return NextResponse.json({ columns, stored });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "No se pudo guardar" },
      { status: 400 }
    );
  }
}
