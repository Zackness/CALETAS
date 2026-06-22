"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  CALETA_TASK_DONE_STATUSES,
  CALETA_TASK_PRIORITIES,
  caletaTaskPriorityLabel,
  caletaTaskPriorityPillClass,
  type CaletaTaskBoardColumn,
} from "@/lib/tareas/task-board";
import {
  boardColumnsForStatusLabel,
  boardColumnsForStatusPill,
  isAllowedCaletaTaskStatus,
} from "@/lib/tareas/task-board-config";
import { normalizeCaletaTaskIcon, type CaletaTaskIconKey } from "@/lib/tareas/task-icons";
import type { CaletaTaskItem } from "./caleta-tasks-board";
import { CaletaTaskBodyEditor } from "./caleta-task-body-editor";
import { CaletaTaskIconPicker } from "./caleta-task-icon-picker";
import { CaletaPropertyPillSelect } from "./caleta-property-pill-select";
import { CaletaTaskDueDateField } from "./caleta-task-due-date-field";

const AUTOSAVE_MS = 700;

function PropertyRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="group flex min-h-[34px] items-center gap-3 py-0.5">
      <span className="w-[110px] shrink-0 text-sm text-white/60">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

async function patchTask(
  id: string,
  payload: {
    title: string;
    icon: string;
    description: string;
    status: string;
    priority: string;
    dueAt: string | null;
  }
) {
  const res = await fetch(`/api/tareas/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: payload.title,
      icon: payload.icon,
      description: payload.description || null,
      status: payload.status,
      priority: payload.priority,
      dueAt: payload.dueAt,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || "No se pudo guardar");
  return data.task as CaletaTaskItem;
}

export function CaletaTaskDetailSheet({
  task,
  open,
  onOpenChange,
  focusBody,
  hasAiWriting = false,
  boardColumns,
  onTaskUpdated,
}: {
  task: CaletaTaskItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  focusBody?: boolean;
  hasAiWriting?: boolean;
  boardColumns: CaletaTaskBoardColumn[];
  onTaskUpdated?: (id: string, patch: Partial<CaletaTaskItem>) => void;
}) {
  const [title, setTitle] = useState("");
  const [icon, setIcon] = useState<CaletaTaskIconKey>("check-square");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("PENDIENTE");
  const [priority, setPriority] = useState("MEDIA");
  const [dueAt, setDueAt] = useState("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSaved = useRef<string>("");
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const savingRef = useRef(false);

  useEffect(() => {
    if (!task) return;
    setTitle(task.title);
    setIcon(normalizeCaletaTaskIcon(task.icon));
    setDescription(task.description ?? "");
    const boardIds = boardColumns.map((c) => c.status);
    const validBoard =
      isAllowedCaletaTaskStatus(task.status, boardIds) &&
      !(CALETA_TASK_DONE_STATUSES as readonly string[]).includes(task.status);
    setStatus(
      validBoard
        ? task.status
        : boardIds.includes("PENDIENTE")
          ? "PENDIENTE"
          : boardIds[0] ?? "PENDIENTE"
    );
    setPriority(task.priority);
    setDueAt(task.dueAt ? task.dueAt.slice(0, 10) : "");
    lastSaved.current = JSON.stringify({
      title: task.title,
      icon: normalizeCaletaTaskIcon(task.icon),
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueAt: task.dueAt?.slice(0, 10) ?? "",
    });
  }, [task, boardColumns]);

  useEffect(() => {
    if (!open || !task) return;
    const el = titleRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
    if (focusBody) return;
    const t = window.setTimeout(() => titleRef.current?.focus(), 100);
    return () => window.clearTimeout(t);
  }, [open, task, focusBody, title]);

  const persist = useCallback(async () => {
    if (!task || savingRef.current) return;
    const payload = {
      title: title.trim(),
      icon,
      description,
      status,
      priority,
      dueAt: dueAt || null,
    };
    const key = JSON.stringify(payload);
    if (key === lastSaved.current || !payload.title) return;

    savingRef.current = true;
    try {
      const updated = await patchTask(task.id, payload);
      lastSaved.current = key;
      onTaskUpdated?.(task.id, {
        title: updated.title,
        icon: updated.icon,
        description: updated.description,
        status: updated.status,
        priority: updated.priority,
        dueAt: updated.dueAt,
      });
    } catch {
      /* silencioso: reintento en el siguiente cambio */
    } finally {
      savingRef.current = false;
    }
  }, [task, title, icon, description, status, priority, dueAt, onTaskUpdated]);

  const scheduleSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void persist();
    }, AUTOSAVE_MS);
  }, [persist]);

  const flushSave = useCallback(() => {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    void persist();
  }, [persist]);

  useEffect(() => {
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, []);

  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) flushSave();
      onOpenChange(next);
    },
    [flushSave, onOpenChange]
  );

  if (!task) return null;

  const allStatuses = [...boardColumns.map((c) => c.status), ...CALETA_TASK_DONE_STATUSES];

  const statusLabel = (s: string) => boardColumnsForStatusLabel(s, boardColumns);
  const statusPill = (s: string) => boardColumnsForStatusPill(s, boardColumns);

  const statusOptions = allStatuses.map((s) => ({
    value: s,
    label: statusLabel(s),
  }));

  const priorityOptions = CALETA_TASK_PRIORITIES.map((p) => ({
    value: p,
    label: caletaTaskPriorityLabel(p),
  }));

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full max-w-none border-white/10 bg-[#1C2D20] p-0 text-white sm:max-w-2xl"
      >
        <div className="flex h-full flex-col overflow-y-auto">
          <SheetHeader className="sr-only">
            <SheetTitle>{task.title}</SheetTitle>
          </SheetHeader>

          <div className="px-10 pb-2 pt-10 sm:px-12">
            <div className="flex items-start gap-3">
              <CaletaTaskIconPicker
                size="inline"
                value={icon}
                onChange={(next) => {
                  setIcon(next);
                  onTaskUpdated?.(task.id, { icon: next });
                  scheduleSave();
                }}
              />
              <textarea
                ref={titleRef}
                value={title}
                rows={1}
                onChange={(e) => {
                  setTitle(e.target.value);
                  onTaskUpdated?.(task.id, { title: e.target.value.trim() || task.title });
                  e.target.style.height = "auto";
                  e.target.style.height = `${e.target.scrollHeight}px`;
                  scheduleSave();
                }}
                placeholder="Sin título"
                className="min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent py-0.5 font-special text-[2rem] font-bold leading-tight tracking-tight text-white outline-none placeholder:text-white/40 focus:ring-0 sm:text-[2.35rem]"
              />
            </div>
          </div>

          <div className="space-y-0.5 px-10 py-4 sm:px-12">
            <PropertyRow label="Estado">
              <CaletaPropertyPillSelect
                aria-label="Estado de la tarea"
                value={status}
                label={statusLabel(status)}
                pillClass={statusPill(status)}
                getOptionPillClass={statusPill}
                onChange={(v) => {
                  setStatus(v);
                  onTaskUpdated?.(task.id, { status: v });
                  scheduleSave();
                }}
                options={statusOptions}
              />
            </PropertyRow>

            <PropertyRow label="Prioridad">
              <CaletaPropertyPillSelect
                aria-label="Prioridad de la tarea"
                value={priority}
                label={caletaTaskPriorityLabel(priority)}
                pillClass={caletaTaskPriorityPillClass(priority)}
                getOptionPillClass={caletaTaskPriorityPillClass}
                onChange={(v) => {
                  setPriority(v);
                  onTaskUpdated?.(task.id, { priority: v });
                  scheduleSave();
                }}
                options={priorityOptions}
              />
            </PropertyRow>

            <PropertyRow label="Fechas">
              <CaletaTaskDueDateField
                value={dueAt}
                onChange={(v) => {
                  setDueAt(v);
                  onTaskUpdated?.(task.id, {
                    dueAt: v ? new Date(v + "T12:00:00").toISOString() : null,
                  });
                  scheduleSave();
                }}
                onScheduleSave={scheduleSave}
              />
            </PropertyRow>
          </div>

          <div className="mx-10 border-t border-white/10 sm:mx-12" />

          <div className="flex-1 px-10 py-8 sm:px-12 sm:py-10">
            {!hasAiWriting ? (
              <p className="mb-4 text-xs text-white/60">
                Escribe <strong className="text-white">/</strong> para insertar bloques. La opción{" "}
                <strong className="text-white">IA</strong> requiere una{" "}
                <a
                  href="/suscripcion"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-hex)] underline-offset-2 hover:underline"
                >
                  suscripción activa
                </a>
                .
              </p>
            ) : null}
            <CaletaTaskBodyEditor
              editorKey={task.id}
              value={description}
              taskTitle={title}
              hasAiWriting={hasAiWriting}
              autoFocus={focusBody}
              onChange={(text) => {
                setDescription(text);
                onTaskUpdated?.(task.id, { description: text || null });
                scheduleSave();
              }}
              placeholder='Escribe aquí… Pulsa "/" para insertar bloques'
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
