"use client";

import { Edit3, MoreHorizontal, Trash2 } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ChatThreadRow({
  title,
  active,
  onSelect,
  onRename,
  onDelete,
}: {
  title: string;
  active: boolean;
  onSelect: () => void;
  onRename: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={cn(
        "group flex min-w-0 items-center gap-0.5 rounded-lg pr-0.5 transition-colors",
        active
          ? "border-l-2 border-[var(--accent-hex)] bg-[color-mix(in_oklab,var(--accent-hex)_14%,transparent)]"
          : "hover:bg-white/10",
      )}
    >
      <button
        type="button"
        onClick={onSelect}
        className={cn(
          "min-w-0 flex-1 truncate rounded-lg py-2 text-left text-sm transition-colors",
          active ? "pl-[calc(0.625rem-2px)] pr-1 text-white" : "px-2.5 text-white/75 hover:text-white",
        )}
        title={title}
      >
        {title}
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-white/55 transition-opacity hover:bg-white/10 hover:text-white",
              active ? "opacity-100" : "opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100",
            )}
            aria-label={`Opciones de ${title}`}
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="min-w-[10rem] border-white/10 bg-[var(--mygreen-dark)] text-white"
        >
          <DropdownMenuItem
            className="cursor-pointer gap-2 focus:bg-white/10 focus:text-white"
            onClick={onRename}
          >
            <Edit3 className="h-4 w-4 text-[var(--accent-hex)]" />
            Renombrar
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem
            className="cursor-pointer gap-2 text-red-300 focus:bg-red-500/15 focus:text-red-200"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
            Eliminar chat
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
