import {
  CALETA_BOARD_COLOR_PRESETS,
  type CaletaBoardColorKey,
  isCaletaBoardColorKey,
} from "@/lib/tareas/task-board-colors";

export type CaletaTaskBoardColumn = {
  status: string;
  label: string;
  pillClass: string;
  dotClass: string;
};

export type StoredTaskBoardColumn = {
  status: string;
  label: string;
  colorKey: CaletaBoardColorKey;
};

export const CALETA_TASK_DONE_STATUSES = ["HECHO", "CANCELADA"] as const;

const SYSTEM_BOARD_COLUMN_IDS = [
  "BACKLOG",
  "PENDIENTE",
  "EN_PROGRESO",
  "EN_PAUSA",
] as const;

const DONE_COLUMN_IDS = new Set<string>(CALETA_TASK_DONE_STATUSES);

const CUSTOM_COLUMN_ID_RE = /^col_[a-z0-9]{6,32}$/;

const DEFAULT_COLOR_BY_STATUS: Record<string, CaletaBoardColorKey> = {
  BACKLOG: "violet",
  PENDIENTE: "blue",
  EN_PROGRESO: "amber",
  EN_PAUSA: "fuchsia",
};

export const CALETA_TASK_BOARD_COLUMNS: CaletaTaskBoardColumn[] = [
  {
    status: "BACKLOG",
    label: "Backlog",
    pillClass: CALETA_BOARD_COLOR_PRESETS.violet.pillClass,
    dotClass: CALETA_BOARD_COLOR_PRESETS.violet.dotClass,
  },
  {
    status: "PENDIENTE",
    label: "Pendiente",
    pillClass: CALETA_BOARD_COLOR_PRESETS.blue.pillClass,
    dotClass: CALETA_BOARD_COLOR_PRESETS.blue.dotClass,
  },
  {
    status: "EN_PROGRESO",
    label: "En progreso",
    pillClass: CALETA_BOARD_COLOR_PRESETS.amber.pillClass,
    dotClass: CALETA_BOARD_COLOR_PRESETS.amber.dotClass,
  },
  {
    status: "EN_PAUSA",
    label: "En pausa",
    pillClass: CALETA_BOARD_COLOR_PRESETS.fuchsia.pillClass,
    dotClass: CALETA_BOARD_COLOR_PRESETS.fuchsia.dotClass,
  },
];

export function createCaletaBoardColumnId(): string {
  const rand =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `col_${rand.toLowerCase()}`;
}

export function isCaletaBoardColumnId(status: string): boolean {
  if ((SYSTEM_BOARD_COLUMN_IDS as readonly string[]).includes(status)) return true;
  return CUSTOM_COLUMN_ID_RE.test(status);
}

export function isCaletaBoardColumnStatus(status: string): boolean {
  if (DONE_COLUMN_IDS.has(status)) return false;
  return isCaletaBoardColumnId(status);
}

export function getDefaultStoredBoardColumns(): StoredTaskBoardColumn[] {
  return CALETA_TASK_BOARD_COLUMNS.map((c) => ({
    status: c.status,
    label: c.label,
    colorKey: DEFAULT_COLOR_BY_STATUS[c.status] ?? "blue",
  }));
}

export function storedToBoardColumns(stored: StoredTaskBoardColumn[]): CaletaTaskBoardColumn[] {
  return stored
    .filter((s) => isCaletaBoardColumnStatus(s.status))
    .map((s) => {
      const preset = CALETA_BOARD_COLOR_PRESETS[s.colorKey] ?? CALETA_BOARD_COLOR_PRESETS.blue;
      return {
        status: s.status,
        label: s.label.trim() || s.status,
        pillClass: preset.pillClass,
        dotClass: preset.dotClass,
      };
    });
}

function normalizeStoredItem(
  item: Record<string, unknown>,
  fallback?: StoredTaskBoardColumn
): StoredTaskBoardColumn | null {
  const status = typeof item.status === "string" ? item.status : fallback?.status;
  if (!status || !isCaletaBoardColumnStatus(status)) return null;

  const label =
    typeof item.label === "string" && item.label.trim()
      ? item.label.trim().slice(0, 48)
      : (fallback?.label ?? status);

  const colorKey =
    typeof item.colorKey === "string" && isCaletaBoardColorKey(item.colorKey)
      ? item.colorKey
      : (fallback?.colorKey ?? DEFAULT_COLOR_BY_STATUS[status] ?? "blue");

  return { status, label, colorKey };
}

export function parseTaskBoardColumnsJson(raw: unknown): StoredTaskBoardColumn[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;

  const defaults = getDefaultStoredBoardColumns();
  const defaultByStatus = new Map(defaults.map((d) => [d.status, d]));
  const result: StoredTaskBoardColumn[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const row = item as Record<string, unknown>;
    const status = typeof row.status === "string" ? row.status : "";
    if (!status || seen.has(status) || DONE_COLUMN_IDS.has(status)) continue;
    const normalized = normalizeStoredItem(row, defaultByStatus.get(status));
    if (!normalized) continue;
    seen.add(normalized.status);
    result.push(normalized);
  }

  if (result.length === 0) return null;
  return result;
}

export function resolveBoardColumns(raw: unknown): CaletaTaskBoardColumn[] {
  const stored = parseTaskBoardColumnsJson(raw);
  if (!stored) return CALETA_TASK_BOARD_COLUMNS;
  return storedToBoardColumns(stored);
}

export function boardColumnIds(stored: StoredTaskBoardColumn[]): string[] {
  return stored.map((s) => s.status);
}

export function isAllowedCaletaTaskStatus(status: string, boardColumnIdsList: string[]): boolean {
  if ((CALETA_TASK_DONE_STATUSES as readonly string[]).includes(status)) return true;
  return boardColumnIdsList.includes(status) && isCaletaBoardColumnStatus(status);
}

export function boardColumnsForStatusLabel(
  status: string,
  columns: CaletaTaskBoardColumn[]
): string {
  const hit = columns.find((c) => c.status === status);
  if (hit) return hit.label;
  if (status === "HECHO") return "Completada";
  if (status === "CANCELADA") return "Cancelada";
  return status;
}

export function boardColumnsForStatusPill(
  status: string,
  columns: CaletaTaskBoardColumn[]
): string {
  const hit = columns.find((c) => c.status === status);
  if (hit) return hit.pillClass;
  if (status === "HECHO") return CALETA_BOARD_COLOR_PRESETS.emerald.pillClass;
  if (status === "CANCELADA") return CALETA_BOARD_COLOR_PRESETS.slate.pillClass;
  return CALETA_BOARD_COLOR_PRESETS.blue.pillClass;
}
