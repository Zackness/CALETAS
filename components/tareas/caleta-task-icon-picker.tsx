"use client";

import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  CALETA_TASK_ICON_OPTIONS,
  caletaTaskIconLabel,
  normalizeCaletaTaskIcon,
  type CaletaTaskIconKey,
} from "@/lib/tareas/task-icons";
import { cn } from "@/lib/utils";
import { CaletaTaskIcon } from "./caleta-task-icon";

export function CaletaTaskIconPicker({
  value,
  onChange,
  size = "inline",
  disabled,
}: {
  value: string | null | undefined;
  onChange: (icon: CaletaTaskIconKey) => void;
  size?: "inline" | "lg" | "sm";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const current = normalizeCaletaTaskIcon(value);

  const triggerClass =
    size === "lg"
      ? "h-14 w-14 rounded-full"
      : size === "inline"
        ? "mt-1.5 h-10 w-10 shrink-0 rounded-xl"
        : "h-8 w-8 rounded-lg";

  const iconClass =
    size === "lg" ? "h-7 w-7" : size === "inline" ? "h-5 w-5" : "h-4 w-4";

  return (
    <Popover open={open} onOpenChange={setOpen} modal={false}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          title="Cambiar icono de la tarea"
          aria-label={`Icono: ${caletaTaskIconLabel(current)}. Pulsa para cambiar`}
          className={cn(
            "inline-flex items-center justify-center border border-transparent bg-white/10 text-white",
            "transition-colors hover:border-white/15 hover:bg-white/15",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-hex)]/40",
            "disabled:pointer-events-none disabled:opacity-50",
            triggerClass
          )}
        >
          <CaletaTaskIcon icon={current} className={iconClass} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        className="z-[130] w-[min(100vw-2rem,300px)] rounded-xl border border-white/10 bg-[#354B3A] p-3 shadow-xl"
      >
        <p className="text-xs font-semibold text-white">Icono de la tarea</p>
        <p className="mt-0.5 text-[11px] text-white/60">
          Se muestra aquí y en las tarjetas del tablero.
        </p>
        <div className="mt-3 grid grid-cols-6 gap-1">
          {CALETA_TASK_ICON_OPTIONS.map((opt) => {
            const selected = opt.key === current;
            return (
              <button
                key={opt.key}
                type="button"
                title={opt.label}
                aria-label={opt.label}
                aria-pressed={selected}
                onClick={() => {
                  onChange(opt.key);
                  setOpen(false);
                }}
                className={cn(
                  "inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                  selected
                    ? "border-[var(--accent-hex)] bg-[var(--accent-hex)]/15 text-white"
                    : "border-transparent text-white/60 hover:border-white/15 hover:bg-white/10 hover:text-white"
                )}
              >
                <opt.Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
