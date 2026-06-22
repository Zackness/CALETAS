"use client";

import { useState } from "react";
import { Calendar, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

function toDateInputValue(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDueDisplay(iso: string) {
  try {
    return new Date(iso + "T12:00:00").toLocaleDateString("es-VE", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

const DATE_INPUT_CLASS = cn(
  "h-10 w-full rounded-lg border border-white/15 bg-[#1C2D20] px-3 text-sm text-white",
  "shadow-sm transition-shadow",
  "focus:outline-none focus:ring-2 focus:ring-[var(--accent-hex)]/40",
  "[color-scheme:dark]",
  "[&::-webkit-calendar-picker-indicator]:cursor-pointer",
  "[&::-webkit-calendar-picker-indicator]:rounded-md",
  "[&::-webkit-calendar-picker-indicator]:p-0.5",
  "[&::-webkit-calendar-picker-indicator]:opacity-80",
  "[&::-webkit-calendar-picker-indicator]:invert"
);

function QuickDateChip({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg border border-white/15 bg-white/5 px-2.5 py-1.5 text-xs font-medium",
        "text-white transition-colors",
        "hover:border-[var(--accent-hex)]/35 hover:bg-[var(--accent-hex)]/10"
      )}
    >
      {label}
    </button>
  );
}

export function CaletaTaskDueDateField({
  value,
  onChange,
  onScheduleSave,
}: {
  value: string;
  onChange: (isoDate: string) => void;
  onScheduleSave?: () => void;
}) {
  const [open, setOpen] = useState(false);

  const handleChange = (next: string) => {
    onChange(next);
  };

  const handleClear = () => {
    onChange("");
    onScheduleSave?.();
    setOpen(false);
  };

  const setQuick = (ymd: string) => {
    handleChange(ymd);
    onScheduleSave?.();
  };

  const today = toDateInputValue(new Date());
  const tomorrow = toDateInputValue(new Date(Date.now() + 86400000));
  const nextWeek = toDateInputValue(new Date(Date.now() + 7 * 86400000));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) onScheduleSave?.();
      }}
      modal={false}
    >
      {value ? (
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Cambiar fecha límite"
            className={cn(
              "inline-flex min-h-8 max-w-full cursor-pointer items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium",
              "bg-sky-500/15 text-sky-200",
              "border border-transparent transition-[box-shadow,background-color,border-color]",
              "hover:border-white/15 hover:shadow-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-hex)]/40"
            )}
          >
            <Calendar className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
            <span className="truncate">{formatDueDisplay(value)}</span>
          </button>
        </PopoverTrigger>
      ) : (
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              "rounded-md px-2 py-1 text-sm text-white/60 transition-colors",
              "hover:bg-white/10 hover:text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-hex)]/40"
            )}
          >
            Vacío
          </button>
        </PopoverTrigger>
      )}

      <PopoverContent
        align="start"
        sideOffset={6}
        className={cn(
          "z-[120] w-[min(100vw-2rem,300px)] rounded-xl border border-white/10",
          "bg-[#354B3A] p-4 text-white shadow-xl"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/60">
            Fecha límite
          </p>
          {value ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-3 w-3" aria-hidden />
              Quitar
            </button>
          ) : null}
        </div>

        <label className="mt-3 block text-sm text-white/70" htmlFor="caleta-task-due-date">
          Elige una fecha
        </label>
        <input
          id="caleta-task-due-date"
          type="date"
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          className={cn(DATE_INPUT_CLASS, "mt-1.5")}
        />

        <p className="mt-3 text-[11px] text-white/60">Acceso rápido</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <QuickDateChip label="Hoy" onClick={() => setQuick(today)} />
          <QuickDateChip label="Mañana" onClick={() => setQuick(tomorrow)} />
          <QuickDateChip label="En 1 semana" onClick={() => setQuick(nextWeek)} />
        </div>

        {value ? (
          <p className="mt-3 text-sm text-white">
            <Calendar className="mr-1.5 inline h-3.5 w-3.5 text-[var(--accent-hex)]" aria-hidden />
            {formatDueDisplay(value)}
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
