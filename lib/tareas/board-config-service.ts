import { db } from "@/lib/db";
import {
  getDefaultStoredBoardColumns,
  isCaletaBoardColumnId,
  isCaletaBoardColumnStatus,
  parseTaskBoardColumnsJson,
  resolveBoardColumns,
  storedToBoardColumns,
  type StoredTaskBoardColumn,
} from "@/lib/tareas/task-board-config";
import type { CaletaTaskBoardColumn } from "@/lib/tareas/task-board-config";
import { isCaletaBoardColorKey } from "@/lib/tareas/task-board-colors";

const MAX_BOARD_COLUMNS = 12;

export async function readCaletaTaskBoardColumnsJson(userId: string): Promise<unknown | null> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { caletaTaskBoardColumns: true },
  });
  return user?.caletaTaskBoardColumns ?? null;
}

export async function getCaletaTaskBoardConfigForUser(userId: string): Promise<{
  columns: CaletaTaskBoardColumn[];
  stored: StoredTaskBoardColumn[];
}> {
  const raw = await readCaletaTaskBoardColumnsJson(userId);
  const stored = parseTaskBoardColumnsJson(raw) ?? getDefaultStoredBoardColumns();
  return { columns: storedToBoardColumns(stored), stored };
}

export async function saveCaletaTaskBoardColumns(
  userId: string,
  columns: StoredTaskBoardColumn[]
): Promise<CaletaTaskBoardColumn[]> {
  const prevRaw = await readCaletaTaskBoardColumnsJson(userId);
  const prev = parseTaskBoardColumnsJson(prevRaw) ?? getDefaultStoredBoardColumns();

  const normalized: StoredTaskBoardColumn[] = [];
  const seen = new Set<string>();

  for (const col of columns) {
    if (!isCaletaBoardColumnStatus(col.status)) continue;
    const label = (col.label ?? "").trim().slice(0, 48);
    if (!label) throw new Error("Cada columna necesita un título.");
    if (seen.has(col.status)) continue;
    const colorKey = isCaletaBoardColorKey(col.colorKey) ? col.colorKey : "blue";
    seen.add(col.status);
    normalized.push({ status: col.status, label, colorKey });
  }

  if (normalized.length < 1) {
    throw new Error("El tablero necesita al menos una columna.");
  }
  if (normalized.length > MAX_BOARD_COLUMNS) {
    throw new Error(`Máximo ${MAX_BOARD_COLUMNS} columnas en el tablero.`);
  }

  const nextIds = new Set(normalized.map((c) => c.status));
  const removed = prev
    .map((c) => c.status)
    .filter((id) => !nextIds.has(id) && isCaletaBoardColumnId(id));

  if (removed.length > 0) {
    const fallbackStatus = normalized[0]!.status;
    await db.caletaTask.updateMany({
      where: {
        userId,
        status: { in: removed },
      },
      data: { status: fallbackStatus },
    });
  }

  await db.user.update({
    where: { id: userId },
    data: { caletaTaskBoardColumns: normalized },
  });

  return storedToBoardColumns(normalized);
}

export async function validateCaletaTaskStatusForUser(
  userId: string,
  status: string
): Promise<boolean> {
  const { stored } = await getCaletaTaskBoardConfigForUser(userId);
  const ids = stored.map((s) => s.status);
  if (status === "HECHO" || status === "CANCELADA") {
    return true;
  }
  return ids.includes(status) && isCaletaBoardColumnStatus(status);
}

export { resolveBoardColumns, getDefaultStoredBoardColumns, parseTaskBoardColumnsJson };
