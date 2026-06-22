import {
  boardColumnsForStatusLabel,
  boardColumnsForStatusPill,
  CALETA_TASK_BOARD_COLUMNS,
  CALETA_TASK_DONE_STATUSES,
  type CaletaTaskBoardColumn,
  type StoredTaskBoardColumn,
} from "@/lib/tareas/task-board-config";

export {
  CALETA_TASK_BOARD_COLUMNS,
  CALETA_TASK_DONE_STATUSES,
  boardColumnsForStatusLabel,
  boardColumnsForStatusPill,
  type CaletaTaskBoardColumn,
  type StoredTaskBoardColumn,
};

export const CALETA_TASK_PRIORITIES = ["BAJA", "MEDIA", "ALTA"] as const;

const PRIORITY_LABELS: Record<string, string> = {
  BAJA: "Baja",
  MEDIA: "Media",
  ALTA: "Alta",
};

const PRIORITY_PILL: Record<string, string> = {
  ALTA: "bg-red-500/15 text-red-200",
  MEDIA: "bg-amber-500/15 text-amber-100",
  BAJA: "bg-white/10 text-white/65",
};

export function caletaTaskPriorityLabel(priority: string) {
  return PRIORITY_LABELS[priority] ?? priority;
}

export function caletaTaskPriorityPillClass(priority: string) {
  return PRIORITY_PILL[priority] ?? PRIORITY_PILL.MEDIA;
}

export function caletaTaskStatusLabel(status: string, columns?: CaletaTaskBoardColumn[]) {
  if (columns?.length) {
    return boardColumnsForStatusLabel(status, columns);
  }
  const fromBoard = CALETA_TASK_BOARD_COLUMNS.find((c) => c.status === status);
  if (fromBoard) return fromBoard.label;
  if (status === "HECHO") return "Completada";
  if (status === "CANCELADA") return "Cancelada";
  return status;
}

export function caletaTaskStatusPillClass(status: string, columns?: CaletaTaskBoardColumn[]) {
  if (columns?.length) {
    return boardColumnsForStatusPill(status, columns);
  }
  const fromBoard = CALETA_TASK_BOARD_COLUMNS.find((c) => c.status === status);
  if (fromBoard) return fromBoard.pillClass;
  if (status === "HECHO") return "bg-emerald-500/15 text-emerald-200";
  if (status === "CANCELADA") return "bg-white/10 text-white/60";
  return "bg-sky-500/15 text-sky-200";
}
