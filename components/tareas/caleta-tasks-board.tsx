"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, LayoutGrid, CheckCircle2, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CALETA_TASK_BOARD_COLUMNS,
  CALETA_TASK_DONE_STATUSES,
  caletaTaskPriorityLabel,
  caletaTaskPriorityPillClass,
  type CaletaTaskBoardColumn,
} from "@/lib/tareas/task-board";
import type { StoredTaskBoardColumn } from "@/lib/tareas/task-board-config";
import { caletaTaskCardDescriptionPreview } from "@/lib/tareas/task-card-text";
import { CaletaTaskIcon } from "./caleta-task-icon";
import { CaletaBoardSettingsDialog } from "./caleta-board-settings-dialog";
import { CaletaBoardColumnMenu } from "./caleta-board-column-menu";
import { CaletaTaskDetailSheet } from "./caleta-task-detail-sheet";

export type CaletaTaskItem = {
  id: string;
  title: string;
  description: string | null;
  icon: string | null;
  status: string;
  priority: string;
  dueAt: string | null;
};

type BoardView = "board" | "done";

function formatCardDate(iso: string | null) {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("es-VE", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

const DONE_STATUSES = new Set(["HECHO", "CANCELADA"]);

function CardActionButton({
  label,
  onClick,
  disabled,
  pending,
  variant = "default",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pending?: boolean;
  variant?: "default" | "danger" | "success";
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled || pending}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "inline-flex h-7 w-7 items-center justify-center rounded-md border transition-colors",
        "disabled:pointer-events-none disabled:opacity-40",
        variant === "danger" &&
          "border-red-500/25 bg-red-500/10 text-red-300 hover:bg-red-500/20",
        variant === "success" &&
          "border-emerald-500/25 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20",
        variant === "default" &&
          "border-white/15 bg-[#1C2D20]/90 text-white/60 hover:bg-white/10 hover:text-white"
      )}
    >
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
      ) : variant === "danger" ? (
        <Trash2 className="h-3.5 w-3.5" aria-hidden />
      ) : (
        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
      )}
    </button>
  );
}

function TaskCard({
  task,
  onOpen,
  onDragStart,
  onDragEnd,
  onComplete,
  onDelete,
  actionPending,
  dragging,
}: {
  task: CaletaTaskItem;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onComplete: () => void;
  onDelete: () => void;
  actionPending?: boolean;
  dragging?: boolean;
}) {
  const dateLabel = formatCardDate(task.dueAt);
  const showPriority = task.priority === "ALTA" || task.priority === "MEDIA";
  const isDone = DONE_STATUSES.has(task.status);
  const descriptionPreview = caletaTaskCardDescriptionPreview(task.description);

  return (
    <div
      className={cn(
        "group/task relative w-full rounded-lg border border-white/10 bg-[#354B3A] shadow-sm transition-all",
        "hover:border-[var(--accent-hex)]/35 hover:bg-[#354B3A]/90",
        dragging && "opacity-50 ring-2 ring-[var(--accent-hex)]/40"
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute right-1.5 top-1.5 z-20 flex items-center gap-1",
          "opacity-0 transition-opacity duration-150",
          "group-hover/task:pointer-events-auto group-hover/task:opacity-100",
          "group-focus-within/task:pointer-events-auto group-focus-within/task:opacity-100"
        )}
      >
        {!isDone ? (
          <CardActionButton
            label="Marcar como completada"
            variant="success"
            pending={actionPending}
            onClick={onComplete}
          />
        ) : null}
        <CardActionButton
          label="Eliminar tarea"
          variant="danger"
          pending={actionPending}
          onClick={onDelete}
        />
      </div>

      <div
        role="button"
        tabIndex={0}
        draggable
        onDragStart={(e) => {
          e.dataTransfer.setData("text/task-id", task.id);
          e.dataTransfer.effectAllowed = "move";
          onDragStart();
        }}
        onDragEnd={onDragEnd}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
        className="w-full cursor-pointer rounded-lg px-3 py-2.5 pr-[4.25rem] text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-hex)]/40"
      >
        <div className="flex gap-2">
          <CaletaTaskIcon
            icon={task.icon}
            className="mt-0.5 h-4 w-4 text-white/60"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium leading-snug text-white">{task.title}</p>
            {descriptionPreview ? (
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/60">
                {descriptionPreview}
              </p>
            ) : null}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-6">
          {dateLabel ? (
            <span className="text-[11px] text-white/55">{dateLabel}</span>
          ) : null}
          {showPriority ? (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-medium",
                caletaTaskPriorityPillClass(task.priority)
              )}
            >
              {caletaTaskPriorityLabel(task.priority)}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function ColumnAddTask({
  status,
  onCreated,
}: {
  status: string;
  onCreated: (task: CaletaTaskItem) => void;
}) {
  const [value, setValue] = useState("");
  const [pending, startTransition] = useTransition();

  function submit() {
    const title = value.trim();
    if (!title) return;
    startTransition(async () => {
      try {
        const res = await fetch("/api/tareas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, status }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo crear la tarea");
        setValue("");
        onCreated({
          id: data.task.id,
          title: data.task.title,
          description: data.task.description,
          icon: data.task.icon,
          status: data.task.status,
          priority: data.task.priority,
          dueAt: data.task.dueAt,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo crear la tarea");
      }
    });
  }

  return (
    <div className="mt-2">
      <div className="flex items-center gap-1 rounded-lg border border-dashed border-white/15 px-2 py-1.5 focus-within:border-[var(--accent-hex)]/50">
        <Plus className="h-3.5 w-3.5 shrink-0 text-white/50" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          disabled={pending}
          placeholder="Nueva tarea"
          className="min-w-0 flex-1 bg-transparent text-xs text-white outline-none placeholder:text-white/40"
        />
      </div>
    </div>
  );
}

export function CaletaTasksBoard() {
  const [view, setView] = useState<BoardView>("board");
  const [localTasks, setLocalTasks] = useState<CaletaTaskItem[]>([]);
  const [boardCols, setBoardCols] = useState<CaletaTaskBoardColumn[]>(CALETA_TASK_BOARD_COLUMNS);
  const [storedCols, setStoredCols] = useState<StoredTaskBoardColumn[]>([]);
  const [hasAiWriting, setHasAiWriting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftTask, setDraftTask] = useState<CaletaTaskItem | null>(null);
  const [focusBodyOnOpen, setFocusBodyOnOpen] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);
  const [actionTaskId, setActionTaskId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/tareas");
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudieron cargar tareas");
        if (!cancelled) {
          setLocalTasks(data.tasks || []);
          setBoardCols(data.boardColumns || []);
          setStoredCols(data.boardColumnsStored || []);
          setHasAiWriting(!!data.hasAiWriting);
        }
      } catch (e) {
        if (!cancelled) toast.error(e instanceof Error ? e.message : "Error cargando tareas");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedTask = useMemo(() => {
    if (!selectedId) return null;
    return (
      localTasks.find((t) => t.id === selectedId) ??
      (draftTask?.id === selectedId ? draftTask : null)
    );
  }, [localTasks, selectedId, draftTask]);

  useEffect(() => {
    if (!selectedId || !draftTask) return;
    if (localTasks.some((t) => t.id === selectedId)) setDraftTask(null);
  }, [localTasks, selectedId, draftTask]);

  function handleBoardConfigSaved(cols: CaletaTaskBoardColumn[], stored: StoredTaskBoardColumn[]) {
    setBoardCols(cols);
    setStoredCols(stored);
  }

  const columns = useMemo(() => {
    if (view === "done") {
      return CALETA_TASK_DONE_STATUSES.map((status) => ({
        status,
        label: status === "HECHO" ? "Completadas" : "Canceladas",
        pillClass: "bg-emerald-500/15 text-emerald-200",
        dotClass: "bg-emerald-400",
      }));
    }
    return boardCols;
  }, [view, boardCols]);

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, CaletaTaskItem[]>();
    for (const col of columns) {
      map.set(col.status, []);
    }
    for (const t of localTasks) {
      const bucket = map.get(t.status);
      if (bucket) bucket.push(t);
      else if (view === "board" && (t.status === "HECHO" || t.status === "CANCELADA")) {
        /* ocultas en tablero activo */
      } else {
        const fallbackKey = boardCols[0]?.status ?? "PENDIENTE";
        const fallback = map.get(fallbackKey) ?? map.get("PENDIENTE");
        if (fallback) fallback.push(t);
      }
    }
    return map;
  }, [localTasks, columns, view, boardCols]);

  function moveTask(taskId: string, newStatus: string) {
    const task = localTasks.find((t) => t.id === taskId);
    if (!task || task.status === newStatus) return;

    const snapshot = localTasks;
    setLocalTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t))
    );
    setDraggingId(null);
    setDragOverStatus(null);

    void fetch(`/api/tareas/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).then(async (res) => {
      if (!res.ok) {
        setLocalTasks(snapshot);
        const data = await res.json();
        toast.error(data?.error || "No se pudo mover la tarea");
      }
    });
  }

  function completeTask(task: CaletaTaskItem) {
    setActionTaskId(task.id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tareas/${task.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "HECHO" }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo completar");
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: "HECHO" } : t))
        );
        if (selectedId === task.id) setSelectedId(null);
        toast.success("Tarea completada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo completar la tarea");
      } finally {
        setActionTaskId(null);
      }
    });
  }

  function removeTask(task: CaletaTaskItem) {
    const ok = window.confirm(
      `¿Eliminar «${task.title}»?\n\nEsta acción no se puede deshacer.`
    );
    if (!ok) return;

    setActionTaskId(task.id);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/tareas/${task.id}`, { method: "DELETE" });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo eliminar");
        setLocalTasks((prev) => prev.filter((t) => t.id !== task.id));
        if (selectedId === task.id) setSelectedId(null);
        toast.success("Tarea eliminada");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo eliminar la tarea");
      } finally {
        setActionTaskId(null);
      }
    });
  }

  if (loading) {
    return (
      <div className="flex h-40 items-center justify-center text-white/70">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {view === "board" ? (
          <CaletaBoardSettingsDialog onSaved={handleBoardConfigSaved} />
        ) : null}
        <button
          type="button"
          onClick={() => setView("board")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            view === "board"
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/10"
          )}
        >
          <LayoutGrid className="h-4 w-4" />
          Tablero
        </button>
        <button
          type="button"
          onClick={() => setView("done")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            view === "done"
              ? "bg-white/10 text-white"
              : "text-white/60 hover:bg-white/10"
          )}
        >
          <CheckCircle2 className="h-4 w-4" />
          Completadas
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4 overflow-x-auto overflow-y-hidden pb-0 [scrollbar-gutter:stable]">
        {columns.map((col) => {
          const colTasks = tasksByStatus.get(col.status) ?? [];
          return (
            <div
              key={col.status}
              className={cn(
                "group/col flex h-full min-h-0 w-[min(100%,280px)] shrink-0 flex-col rounded-xl bg-[#203324]/60 transition-colors",
                dragOverStatus === col.status && "bg-[var(--accent-hex)]/8 ring-2 ring-[var(--accent-hex)]/35 ring-inset"
              )}
              onDragEnter={(e) => {
                e.preventDefault();
                setDragOverStatus(col.status);
              }}
              onDragLeave={(e) => {
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                setDragOverStatus((s) => (s === col.status ? null : s));
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                setDragOverStatus(col.status);
              }}
              onDrop={(e) => {
                e.preventDefault();
                const taskId = e.dataTransfer.getData("text/task-id");
                if (taskId) moveTask(taskId, col.status);
              }}
            >
              <div className="flex items-center gap-2 px-3 py-3">
                <span className={cn("h-2 w-2 shrink-0 rounded-full", col.dotClass)} />
                <span
                  className={cn(
                    "rounded-md px-2 py-0.5 text-xs font-semibold",
                    col.pillClass
                  )}
                >
                  {col.label}
                </span>
                <span className="text-xs text-white/50">{colTasks.length}</span>
                {view === "board" ? (
                  <CaletaBoardColumnMenu
                    column={col}
                    allStored={storedCols}
                    onSaved={handleBoardConfigSaved}
                  />
                ) : null}
              </div>

              <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
                {colTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    dragging={draggingId === task.id}
                    actionPending={actionTaskId === task.id}
                    onDragStart={() => setDraggingId(task.id)}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverStatus(null);
                    }}
                    onOpen={() => {
                      setFocusBodyOnOpen(false);
                      setSelectedId(task.id);
                    }}
                    onComplete={() => completeTask(task)}
                    onDelete={() => removeTask(task)}
                  />
                ))}
                {view === "board" ? (
                  <ColumnAddTask
                    status={col.status}
                    onCreated={(task) => {
                      setLocalTasks((prev) => [...prev, task]);
                      setDraftTask(task);
                      setFocusBodyOnOpen(true);
                      setSelectedId(task.id);
                    }}
                  />
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      <CaletaTaskDetailSheet
        task={selectedTask}
        boardColumns={boardCols}
        hasAiWriting={hasAiWriting}
        open={!!selectedId}
        focusBody={focusBodyOnOpen}
        onTaskUpdated={(id, patch) => {
          setLocalTasks((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...patch } : t))
          );
          if (draftTask?.id === id) {
            setDraftTask((d) => (d ? { ...d, ...patch } : d));
          }
        }}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedId(null);
            setFocusBodyOnOpen(false);
          }
        }}
      />
    </div>
  );
}
