"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type TaskStatus = "BACKLOG" | "PENDIENTE" | "EN_PROGRESO" | "EN_PAUSA" | "HECHO" | "CANCELADA";
type TaskPriority = "BAJA" | "MEDIA" | "ALTA";

type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  icon?: string | null;
};

const columns: { id: TaskStatus; label: string }[] = [
  { id: "BACKLOG", label: "Backlog" },
  { id: "PENDIENTE", label: "Pendiente" },
  { id: "EN_PROGRESO", label: "En progreso" },
  { id: "EN_PAUSA", label: "En pausa" },
  { id: "HECHO", label: "Hecho" },
  { id: "CANCELADA", label: "Cancelada" },
];

export function CaletaTasksBoard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"board" | "done">("board");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [drafts, setDrafts] = useState<Partial<Record<TaskStatus, string>>>({});
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [savingTask, setSavingTask] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<TaskStatus, Task[]>();
    for (const col of columns) map.set(col.id, []);
    for (const t of tasks) map.get(t.status)?.push(t);
    return map;
  }, [tasks]);

  const doneTasks = useMemo(
    () => tasks.filter((t) => t.status === "HECHO" || t.status === "CANCELADA"),
    [tasks]
  );

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tareas");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudieron cargar tareas");
      setTasks(data.tasks || []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando tareas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createTask = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmed, description }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear la tarea");
      setTasks((prev) => [data.task, ...prev]);
      setTitle("");
      setDescription("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la tarea");
    } finally {
      setSubmitting(false);
    }
  };

  const createTaskInColumn = async (status: TaskStatus) => {
    const value = (drafts[status] || "").trim();
    if (!value) return;
    try {
      const res = await fetch("/api/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: value, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear la tarea");
      setTasks((prev) => [data.task, ...prev]);
      setDrafts((prev) => ({ ...prev, [status]: "" }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo crear la tarea");
    }
  };

  const updateStatus = async (id: string, status: TaskStatus) => {
    const previous = tasks;
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    try {
      const res = await fetch(`/api/tareas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo mover la tarea");
    } catch (e) {
      setTasks(previous);
      toast.error(e instanceof Error ? e.message : "No se pudo mover la tarea");
    }
  };

  const removeTask = async (id: string) => {
    const previous = tasks;
    setTasks((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`/api/tareas/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo eliminar la tarea");
    } catch (e) {
      setTasks(previous);
      toast.error(e instanceof Error ? e.message : "No se pudo eliminar la tarea");
    }
  };

  const saveTaskDetail = async () => {
    if (!activeTask) return;
    setSavingTask(true);
    try {
      const res = await fetch(`/api/tareas/${activeTask.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: activeTask.title,
          description: activeTask.description,
          status: activeTask.status,
          priority: activeTask.priority,
          dueAt: activeTask.dueAt || null,
          icon: activeTask.icon || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo guardar");
      setTasks((prev) => prev.map((t) => (t.id === activeTask.id ? data.task : t)));
      setActiveTask(data.task);
      toast.success("Tarea actualizada");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo guardar");
    } finally {
      setSavingTask(false);
    }
  };

  return (
    <div className="space-y-4">
      <Dialog open={!!activeTask} onOpenChange={(open) => !open && setActiveTask(null)}>
        <DialogContent className="border-white/10 bg-[var(--mygreen)] text-white sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Detalle de tarea</DialogTitle>
          </DialogHeader>
          {activeTask ? (
            <div className="space-y-3">
              <input
                className="h-10 w-full rounded-lg border border-white/20 bg-[var(--mygreen-dark)] px-3 text-white"
                value={activeTask.title}
                onChange={(e) => setActiveTask({ ...activeTask, title: e.target.value })}
              />
              <textarea
                className="min-h-28 w-full rounded-lg border border-white/20 bg-[var(--mygreen-dark)] p-3 text-sm text-white"
                value={activeTask.description || ""}
                onChange={(e) => setActiveTask({ ...activeTask, description: e.target.value || null })}
                placeholder="Descripcion"
              />
              <div className="grid gap-2 md:grid-cols-2">
                <select
                  className="h-10 rounded-lg border border-white/20 bg-[var(--mygreen-dark)] px-3 text-white"
                  value={activeTask.status}
                  onChange={(e) => setActiveTask({ ...activeTask, status: e.target.value as TaskStatus })}
                >
                  {columns.map((c) => (
                    <option key={c.id} value={c.id}>{c.label}</option>
                  ))}
                </select>
                <select
                  className="h-10 rounded-lg border border-white/20 bg-[var(--mygreen-dark)] px-3 text-white"
                  value={activeTask.priority}
                  onChange={(e) => setActiveTask({ ...activeTask, priority: e.target.value as TaskPriority })}
                >
                  <option value="BAJA">Prioridad baja</option>
                  <option value="MEDIA">Prioridad media</option>
                  <option value="ALTA">Prioridad alta</option>
                </select>
                <input
                  type="date"
                  className="h-10 rounded-lg border border-white/20 bg-[var(--mygreen-dark)] px-3 text-white"
                  value={activeTask.dueAt ? new Date(activeTask.dueAt).toISOString().slice(0, 10) : ""}
                  onChange={(e) =>
                    setActiveTask({
                      ...activeTask,
                      dueAt: e.target.value ? new Date(`${e.target.value}T12:00:00`).toISOString() : null,
                    })
                  }
                />
                <input
                  className="h-10 rounded-lg border border-white/20 bg-[var(--mygreen-dark)] px-3 text-white"
                  value={activeTask.icon || ""}
                  onChange={(e) => setActiveTask({ ...activeTask, icon: e.target.value || null })}
                  placeholder="Icono (ej: ✅)"
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setActiveTask(null)}
            >
              Cerrar
            </Button>
            <Button
              type="button"
              className="bg-[var(--accent-hex)] text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
              onClick={() => void saveTaskDetail()}
              disabled={savingTask}
            >
              {savingTask ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[var(--mygreen)] to-[var(--mygreen-light)] p-3">
        <div className="mb-3 inline-flex rounded-lg border border-white/15 bg-[var(--mygreen-dark)] p-1 text-sm">
          <button
            type="button"
            onClick={() => setViewMode("board")}
            className={`rounded-md px-3 py-1.5 ${viewMode === "board" ? "bg-[var(--accent-hex)] text-white" : "text-white/75"}`}
          >
            Tablero
          </button>
          <button
            type="button"
            onClick={() => setViewMode("done")}
            className={`rounded-md px-3 py-1.5 ${viewMode === "done" ? "bg-[var(--accent-hex)] text-white" : "text-white/75"}`}
          >
            Hechas
          </button>
        </div>
        <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
          <input
            className="h-10 rounded-lg border border-white/20 bg-[var(--mygreen-dark)] px-3 text-white placeholder:text-white/50"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nueva tarea"
          />
          <input
            className="h-10 rounded-lg border border-white/20 bg-[var(--mygreen-dark)] px-3 text-white placeholder:text-white/50"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripcion opcional"
          />
          <button
            type="button"
            onClick={createTask}
            disabled={submitting}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[var(--accent-hex)] px-4 font-medium text-white disabled:opacity-60"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Crear
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center text-white/70">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : viewMode === "done" ? (
        <div className="grid gap-2 md:grid-cols-2">
          {doneTasks.map((task) => (
            <article
              key={task.id}
              className="rounded-lg border border-white/10 bg-[var(--mygreen-light)]/80 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTask(task)}
                  className="text-left"
                >
                  <p className="text-sm font-medium text-white">{task.icon ? `${task.icon} ` : ""}{task.title}</p>
                </button>
                <button
                  type="button"
                  onClick={() => void removeTask(task.id)}
                  className="rounded p-1 text-white/70 hover:bg-red-500/20 hover:text-red-200"
                  aria-label="Eliminar tarea"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="mt-1 text-xs text-white/70">{task.status === "HECHO" ? "Completada" : "Cancelada"}</p>
            </article>
          ))}
          {!doneTasks.length ? <p className="text-sm text-white/70">No hay tareas completadas o canceladas.</p> : null}
        </div>
      ) : (
        <div className="grid gap-3 xl:grid-cols-6 md:grid-cols-3">
          {columns.map((col) => (
            <div
              key={col.id}
              className="rounded-xl border border-white/10 bg-[var(--mygreen-light)]/80 p-2"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const taskId = e.dataTransfer.getData("text/task-id");
                if (taskId) void updateStatus(taskId, col.id);
              }}
            >
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-white/80">{col.label}</p>
              <div className="mb-2 flex items-center gap-1 rounded-lg border border-dashed border-white/20 bg-[var(--mygreen)]/70 px-2 py-1.5">
                <input
                  className="h-7 w-full bg-transparent text-xs text-white placeholder:text-white/45 outline-none"
                  value={drafts[col.id] || ""}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [col.id]: e.target.value }))}
                  placeholder="Nueva tarea"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void createTaskInColumn(col.id);
                    }
                  }}
                />
                <button type="button" onClick={() => void createTaskInColumn(col.id)} className="text-white/70 hover:text-white">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="space-y-2">
                {(grouped.get(col.id) || []).map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/task-id", task.id)}
                    className="rounded-lg border border-white/10 bg-[var(--mygreen)] p-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveTask(task)}
                        className="text-left"
                      >
                        <p className="text-sm font-medium text-white">{task.icon ? `${task.icon} ` : ""}{task.title}</p>
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeTask(task.id)}
                        className="rounded p-1 text-white/70 hover:bg-red-500/20 hover:text-red-200"
                        aria-label="Eliminar tarea"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {task.description ? <p className="mt-1 line-clamp-2 text-xs text-white/75">{task.description}</p> : null}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {task.dueAt ? (
                        <p className="inline-flex items-center gap-1 rounded bg-white/5 px-1.5 py-0.5 text-[11px] text-white/60">
                          <Calendar className="h-3 w-3" />
                          {new Date(task.dueAt).toLocaleDateString("es-VE")}
                        </p>
                      ) : null}
                      <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] text-white/75">{task.priority}</span>
                      {task.status !== "HECHO" && task.status !== "CANCELADA" ? (
                        <button
                          type="button"
                          onClick={() => void updateStatus(task.id, "HECHO")}
                          className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] text-emerald-200"
                        >
                          <CheckCircle2 className="h-3 w-3" />
                          Completar
                        </button>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
