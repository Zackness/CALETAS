"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SlashMenuItem } from "@/lib/editor/slash-types";
import { cn } from "@/lib/utils";

export function BlogSlashMenu({
  open,
  position,
  items,
  activeIndex,
  onSelect,
  onActiveIndexChange,
  aiPanel,
}: {
  open: boolean;
  position: { top: number; left: number } | null;
  items: SlashMenuItem[];
  activeIndex: number;
  onSelect: (item: SlashMenuItem) => void;
  onActiveIndexChange: (index: number) => void;
  aiPanel?: {
    prompt: string;
    onPromptChange: (v: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    pending: boolean;
  } | null;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-slash-index="${activeIndex}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!open || !position) return null;

  if (aiPanel) {
    return (
      <div
        data-blog-slash-menu
        className="fixed z-[100] w-[min(360px,calc(100vw-24px))] rounded-xl border border-[var(--border)] bg-[var(--background)] p-3 shadow-xl"
        style={{ top: position.top, left: position.left }}
        role="dialog"
        aria-label="Fragmento con IA"
      >
        <p className="text-xs font-semibold text-[var(--foreground)]">Fragmento con IA</p>
        <p className="mt-0.5 text-[11px] text-[var(--muted-foreground)]">
          Describe qué quieres añadir en esta parte del artículo.
        </p>
        <textarea
          value={aiPanel.prompt}
          onChange={(e) => aiPanel.onPromptChange(e.target.value)}
          rows={3}
          autoFocus
          placeholder="Ej.: un párrafo sobre Launch vs Custom para pymes…"
          className="mt-2 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#40C9A9]/35"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              aiPanel.onSubmit();
            }
          }}
        />
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" size="sm" variant="ghost" disabled={aiPanel.pending} onClick={aiPanel.onCancel}>
            Cancelar
          </Button>
          <Button type="button" size="sm" disabled={aiPanel.pending || !aiPanel.prompt.trim()} onClick={aiPanel.onSubmit}>
            {aiPanel.pending ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Generando…
              </>
            ) : (
              "Insertar"
            )}
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        data-blog-slash-menu
        className="fixed z-[100] rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-xs text-[var(--muted-foreground)] shadow-lg"
        style={{ top: position.top, left: position.left }}
      >
        Sin resultados
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      data-blog-slash-menu
      className="fixed z-[100] max-h-[280px] w-[min(280px,calc(100vw-24px))] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--background)] py-1 shadow-xl"
      style={{ top: position.top, left: position.left }}
      role="listbox"
      aria-label="Insertar bloque"
    >
      <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">
        Insertar
      </p>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            data-slash-index={i}
            role="option"
            aria-selected={i === activeIndex}
            className={cn(
              "flex w-full items-start gap-2.5 px-3 py-2 text-left text-sm transition-colors",
              item.locked && "opacity-60",
              i === activeIndex ? "bg-[#40C9A9]/12 text-[var(--foreground)]" : "hover:bg-[var(--muted)]/50"
            )}
            onMouseEnter={() => onActiveIndexChange(i)}
            onMouseDown={(e) => {
              e.preventDefault();
              onSelect(item);
            }}
          >
            <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[#40C9A9]" />
            <span className="min-w-0 flex-1">
              <span className="font-medium">
                {item.label}
                {item.locked ? (
                  <span className="ml-1.5 text-[10px] font-normal text-[var(--muted-foreground)]">
                    (complemento)
                  </span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-[11px] text-[var(--muted-foreground)]">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
