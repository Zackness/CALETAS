"use client";

import { useEffect, useState, useTransition } from "react";
import { Plus, Settings2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createCaletaBoardColumnId,
  type StoredTaskBoardColumn,
} from "@/lib/tareas/task-board-config";
import {
  CALETA_BOARD_COLOR_KEYS,
  CALETA_BOARD_COLOR_PRESETS,
} from "@/lib/tareas/task-board-colors";
import type { CaletaTaskBoardColumn } from "@/lib/tareas/task-board";
import { cn } from "@/lib/utils";

const MAX_COLUMNS = 12;

export function CaletaBoardSettingsDialog({
  onSaved,
}: {
  onSaved: (columns: CaletaTaskBoardColumn[], stored: StoredTaskBoardColumn[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<StoredTaskBoardColumn[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    fetch("/api/tareas/board-config")
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error al cargar");
        setDraft(data.stored ?? []);
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Error al cargar"))
      .finally(() => setLoading(false));
  }, [open]);

  function addColumn() {
    if (draft.length >= MAX_COLUMNS) {
      toast.error(`Máximo ${MAX_COLUMNS} columnas`);
      return;
    }
    setDraft((prev) => [
      ...prev,
      {
        status: createCaletaBoardColumnId(),
        label: "Nueva columna",
        colorKey: "teal",
      },
    ]);
  }

  function removeColumn(index: number) {
    if (draft.length <= 1) {
      toast.error("Debe quedar al menos una columna");
      return;
    }
    setDraft((prev) => prev.filter((_, i) => i !== index));
  }

  function save() {
    startTransition(async () => {
      try {
        const res = await fetch("/api/tareas/board-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ columns: draft }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo guardar");
        onSaved(data.columns, data.stored);
        toast.success("Tablero actualizado");
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-sm font-medium",
            "text-white/70 transition-colors hover:bg-white/10 hover:text-white"
          )}
        >
          <Settings2 className="h-4 w-4" />
          Configurar tablero
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto border-white/10 bg-[#1C2D20] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración del tablero</DialogTitle>
          <DialogDescription className="text-white/60">
            Añade columnas, cambia títulos y colores. Si eliminas una columna, sus tareas pasan a la
            primera columna del tablero.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-white/60">Cargando…</p>
        ) : (
          <>
            <ul className="space-y-4 py-1">
              {draft.map((col, i) => {
                const preset = CALETA_BOARD_COLOR_PRESETS[col.colorKey];
                return (
                  <li
                    key={col.status}
                    className="rounded-xl border border-white/10 bg-[#354B3A]/50 p-3"
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span className={cn("h-2 w-2 rounded-full", preset.dotClass)} />
                      <span
                        className={cn(
                          "rounded-md px-2 py-0.5 text-xs font-semibold",
                          preset.pillClass
                        )}
                      >
                        Vista previa
                      </span>
                      <button
                        type="button"
                        title="Eliminar columna"
                        disabled={draft.length <= 1 || pending}
                        onClick={() => removeColumn(i)}
                        className="ml-auto inline-flex h-8 w-8 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                    <label className="block text-xs font-medium text-white/60">
                      Título de la columna
                    </label>
                    <input
                      value={col.label}
                      onChange={(e) => {
                        const label = e.target.value;
                        setDraft((prev) =>
                          prev.map((c, idx) => (idx === i ? { ...c, label } : c))
                        );
                      }}
                      className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-[#203324] px-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[var(--accent-hex)]/40"
                    />
                    <p className="mt-3 text-xs font-medium text-white/60">Color</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {CALETA_BOARD_COLOR_KEYS.map((key) => {
                        const p = CALETA_BOARD_COLOR_PRESETS[key];
                        const selected = col.colorKey === key;
                        return (
                          <button
                            key={key}
                            type="button"
                            title={p.label}
                            onClick={() =>
                              setDraft((prev) =>
                                prev.map((c, idx) => (idx === i ? { ...c, colorKey: key } : c))
                              )
                            }
                            className={cn(
                              "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors",
                              selected
                                ? "border-[var(--accent-hex)] bg-[var(--accent-hex)]/12 text-white"
                                : "border-white/15 text-white/70 hover:bg-white/10"
                            )}
                          >
                            <span className={cn("h-2 w-2 rounded-full", p.dotClass)} />
                            {p.label}
                          </button>
                        );
                      })}
                    </div>
                  </li>
                );
              })}
            </ul>
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-white/20 bg-transparent text-white hover:bg-white/10"
              disabled={draft.length >= MAX_COLUMNS || pending}
              onClick={addColumn}
            >
              <Plus className="mr-2 h-4 w-4" />
              Añadir columna
            </Button>
          </>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            className="text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => setOpen(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            className="bg-[var(--accent-hex)] text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
            onClick={save}
            disabled={pending || loading}
          >
            {pending ? "Guardando…" : "Guardar cambios"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
