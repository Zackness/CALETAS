"use client";

import { useEffect, useState, useTransition } from "react";
import { MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  CALETA_BOARD_COLOR_KEYS,
  CALETA_BOARD_COLOR_PRESETS,
} from "@/lib/tareas/task-board-colors";
import type { StoredTaskBoardColumn } from "@/lib/tareas/task-board-config";
import type { CaletaTaskBoardColumn } from "@/lib/tareas/task-board";
import { cn } from "@/lib/utils";

export function CaletaBoardColumnMenu({
  column,
  allStored,
  onSaved,
}: {
  column: CaletaTaskBoardColumn;
  allStored: StoredTaskBoardColumn[];
  onSaved: (columns: CaletaTaskBoardColumn[], stored: StoredTaskBoardColumn[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const stored = allStored.find((s) => s.status === column.status);
  const [label, setLabel] = useState(stored?.label ?? column.label);
  const [colorKey, setColorKey] = useState(stored?.colorKey ?? "blue");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    const s = allStored.find((x) => x.status === column.status);
    setLabel(s?.label ?? column.label);
    setColorKey(s?.colorKey ?? "blue");
  }, [open, allStored, column.status, column.label]);

  function save() {
    const next = allStored.map((s) =>
      s.status === column.status ? { ...s, label: label.trim(), colorKey } : s
    );
    startTransition(async () => {
      try {
        const res = await fetch("/api/tareas/board-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ columns: next }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo guardar");
        onSaved(data.columns, data.stored);
        toast.success("Columna actualizada");
        setOpen(false);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo guardar");
      }
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Opciones de columna ${column.label}`}
          className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/50 opacity-0 transition-opacity hover:bg-white/10 hover:text-white group-hover/col:opacity-100"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="z-[120] w-[min(100vw-2rem,280px)] rounded-xl border border-white/10 bg-[#354B3A] p-3 shadow-xl"
      >
        <p className="text-xs font-semibold text-white">Editar columna</p>
        <label className="mt-2 block text-[11px] text-white/60">Título</label>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="mt-1 h-9 w-full rounded-lg border border-white/15 bg-[#1C2D20] px-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-[var(--accent-hex)]/40"
        />
        <p className="mt-2 text-[11px] text-white/60">Color</p>
        <div className="mt-1 flex flex-wrap gap-1">
          {CALETA_BOARD_COLOR_KEYS.map((key) => {
            const p = CALETA_BOARD_COLOR_PRESETS[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => setColorKey(key)}
                className={cn(
                  "rounded-md border p-1.5",
                  colorKey === key
                    ? "border-[var(--accent-hex)] bg-[var(--accent-hex)]/10"
                    : "border-transparent"
                )}
                title={p.label}
              >
                <span className={cn("block h-3 w-3 rounded-full", p.dotClass)} />
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          size="sm"
          className="mt-3 w-full bg-[var(--accent-hex)] text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
          disabled={pending}
          onClick={save}
        >
          {pending ? "Guardando…" : "Aplicar"}
        </Button>
      </PopoverContent>
    </Popover>
  );
}
