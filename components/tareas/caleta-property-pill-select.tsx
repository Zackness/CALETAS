"use client";

import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function CaletaPropertyPillSelect({
  value,
  label,
  pillClass,
  onChange,
  options,
  getOptionPillClass,
  "aria-label": ariaLabel,
}: {
  value: string;
  label: string;
  pillClass: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  getOptionPillClass?: (value: string) => string;
  "aria-label"?: string;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? `Cambiar: ${label}`}
          className={cn(
            "inline-flex min-h-8 max-w-full cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium",
            "border border-transparent transition-[box-shadow,background-color,border-color]",
            "hover:border-white/15 hover:shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-hex)]/40",
            "active:scale-[0.98]",
            pillClass
          )}
        >
          <span className="truncate">{label}</span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className={cn(
          "z-[120] min-w-[220px] overflow-hidden rounded-xl border border-white/10",
          "bg-[#354B3A] p-1.5 text-white shadow-xl"
        )}
      >
        {options.map((o) => {
          const selected = value === o.value;
          const optionPill = getOptionPillClass?.(o.value);
          return (
            <DropdownMenuItem
              key={o.value || "__empty"}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-sm outline-none",
                "focus:bg-[var(--accent-hex)]/12 focus:text-white",
                selected && "bg-[var(--accent-hex)]/10"
              )}
              onSelect={(e) => {
                e.preventDefault();
                onChange(o.value);
              }}
            >
              {optionPill ? (
                <span
                  className={cn(
                    "inline-flex shrink-0 rounded-md px-2 py-0.5 text-xs font-medium",
                    optionPill
                  )}
                >
                  {o.label}
                </span>
              ) : (
                <span className="text-white">{o.label}</span>
              )}
              {selected ? (
                <Check className="ml-auto h-4 w-4 shrink-0 text-[var(--accent-hex)]" aria-hidden />
              ) : (
                <span className="ml-auto h-4 w-4 shrink-0" aria-hidden />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
