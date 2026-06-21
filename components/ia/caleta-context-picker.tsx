"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BookOpen, Check, ChevronsUpDown, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CaletaChatListItem } from "@/lib/ia-caleta-types";

const MAX_SELECTED = 3;
const SEARCH_DEBOUNCE_MS = 280;

type Props = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  compact?: boolean;
};

function normalizeForSearch(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function matchesLocalQuery(recurso: CaletaChatListItem, query: string): boolean {
  const q = normalizeForSearch(query);
  if (!q) return true;
  const haystack = normalizeForSearch(
    [
      recurso.titulo,
      recurso.descripcion,
      recurso.tipo,
      recurso.materia?.nombre,
      recurso.materia?.codigo,
      recurso.esPropio ? "mía mias propia propias tuya" : "",
    ]
      .filter(Boolean)
      .join(" "),
  );
  return q.split(/\s+/).every((token) => haystack.includes(token));
}

export function CaletaContextPicker({ selectedIds, onChange, disabled, compact = false }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recursos, setRecursos] = useState<CaletaChatListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [soloMias, setSoloMias] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [searchQuery]);

  const loadRecursos = useCallback(async (query: string, onlyMine: boolean) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (onlyMine) params.set("soloMias", "true");
      const qs = params.toString();
      const res = await fetch(`/api/ia/chat/caletas${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("No se pudieron cargar las caletas");
      const data = (await res.json()) as { recursos?: CaletaChatListItem[] };
      setRecursos(Array.isArray(data.recursos) ? data.recursos : []);
    } catch {
      setRecursos([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadRecursos(debouncedQuery, soloMias);
  }, [open, debouncedQuery, soloMias, loadRecursos]);

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setDebouncedQuery("");
      return;
    }
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [open]);

  const filteredRecursos = useMemo(() => {
    let list = recursos;
    if (soloMias) list = list.filter((r) => r.esPropio);
    if (searchQuery.trim()) list = list.filter((r) => matchesLocalQuery(r, searchQuery));
    return list;
  }, [recursos, searchQuery, soloMias]);

  const selected = useMemo(
    () => recursos.filter((r) => selectedIds.includes(r.id)),
    [recursos, selectedIds],
  );

  const selectedNotInList = useMemo(() => {
    const known = new Set(recursos.map((r) => r.id));
    return selectedIds.filter((id) => !known.has(id));
  }, [recursos, selectedIds]);

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((x) => x !== id));
      return;
    }
    if (selectedIds.length >= MAX_SELECTED) return;
    onChange([...selectedIds, id]);
  };

  const remove = (id: string) => onChange(selectedIds.filter((x) => x !== id));

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", compact && "gap-1")}>
      {!compact && (selected.length > 0 || selectedNotInList.length > 0) ? (
        <div className="flex flex-wrap gap-1 px-1">
          {selected.map((r) => (
            <span
              key={r.id}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-[var(--accent-hex)]/30 bg-white/5 px-2 py-0.5 text-[11px] text-white/85"
            >
              <BookOpen className="h-3 w-3 shrink-0 text-[var(--accent-hex)]" />
              <span className="truncate">{r.titulo}</span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-white/50 hover:bg-white/10 hover:text-white"
                onClick={() => remove(r.id)}
                disabled={disabled}
                aria-label={`Quitar ${r.titulo}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          {selectedNotInList.map((id) => (
            <span
              key={id}
              className="inline-flex max-w-full items-center gap-1 rounded-md border border-[var(--accent-hex)]/30 bg-white/5 px-2 py-0.5 text-[11px] text-white/85"
            >
              <BookOpen className="h-3 w-3 shrink-0 text-[var(--accent-hex)]" />
              <span className="truncate">Caleta adjunta</span>
              <button
                type="button"
                className="shrink-0 rounded p-0.5 text-white/50 hover:bg-white/10 hover:text-white"
                onClick={() => remove(id)}
                disabled={disabled}
                aria-label="Quitar caleta"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || (loading && !open)}
            className={cn(
              "justify-between border-white/15 bg-[#1C2D20] text-xs text-white/80 hover:bg-white/10 hover:text-white",
              compact ? "h-8 w-auto min-w-[8.5rem] max-w-[10rem] px-2" : "h-8 w-full",
              selectedIds.length > 0 && "border-[var(--accent-hex)]/40 text-[var(--accent-hex)]",
            )}
          >
            <span className="flex items-center gap-1.5 truncate">
              <BookOpen className="h-3.5 w-3.5 shrink-0" />
              {selectedIds.length
                ? `${selectedIds.length} caleta${selectedIds.length > 1 ? "s" : ""}`
                : compact
                  ? "Caletas"
                  : "Adjuntar caletas"}
            </span>
            <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[min(100vw-2rem,420px)] border-white/10 bg-[#354B3A] p-0 text-white"
          align="start"
        >
          <div className="border-b border-white/10 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/45" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por título, materia, tipo o descripción…"
                className="h-9 border-white/15 bg-[#1C2D20] pl-8 pr-8 text-sm text-white placeholder:text-white/45 focus-visible:ring-[var(--accent-hex)]/40"
                disabled={disabled}
                aria-label="Buscar caletas"
              />
              {loading ? (
                <Loader2 className="absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/45" />
              ) : searchQuery ? (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-white/45 hover:bg-white/10 hover:text-white"
                  onClick={() => setSearchQuery("")}
                  aria-label="Limpiar búsqueda"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSoloMias((v) => !v)}
                disabled={disabled}
                className={cn(
                  "rounded-md border px-2 py-1 text-[11px] transition-colors",
                  soloMias
                    ? "border-[var(--accent-hex)]/50 bg-[color-mix(in_oklab,var(--accent-hex)_15%,transparent)] text-[var(--accent-hex)]"
                    : "border-white/15 bg-[#1C2D20] text-white/60 hover:bg-white/10 hover:text-white/80",
                )}
              >
                Solo mis caletas
              </button>
            </div>
            <p className="mt-1.5 px-0.5 text-[10px] text-white/45">
              {loading
                ? "Buscando…"
                : soloMias && !searchQuery.trim()
                  ? `${filteredRecursos.length} caleta${filteredRecursos.length === 1 ? "" : "s"} tuya${filteredRecursos.length === 1 ? "" : "s"}`
                  : searchQuery.trim()
                    ? `${filteredRecursos.length} resultado${filteredRecursos.length === 1 ? "" : "s"}`
                    : `${filteredRecursos.length} caleta${filteredRecursos.length === 1 ? "" : "s"} recientes`}
            </p>
          </div>

          <div
            className="max-h-[min(320px,50vh)] overflow-y-auto overscroll-contain p-1"
            role="listbox"
            aria-label="Caletas disponibles"
          >
            {!loading && filteredRecursos.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-white/60">
                {searchQuery.trim() || soloMias
                  ? "No hay caletas que coincidan con tu búsqueda."
                  : "No tienes caletas accesibles todavía."}
              </p>
            ) : (
              filteredRecursos.map((r) => {
                const isSelected = selectedIds.includes(r.id);
                const atLimit = !isSelected && selectedIds.length >= MAX_SELECTED;
                return (
                  <button
                    key={r.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    disabled={atLimit || disabled}
                    onClick={() => toggle(r.id)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-left transition-colors",
                      "hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent-hex)]/50",
                      isSelected && "bg-white/10",
                      atLimit && "cursor-not-allowed opacity-45",
                    )}
                  >
                    <Check
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-hex)]",
                        isSelected ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm leading-snug text-white">{r.titulo}</p>
                      <p className="mt-0.5 text-[11px] leading-snug text-white/50">
                        {r.materia ? `${r.materia.codigo} · ${r.materia.nombre} · ` : ""}
                        {r.tipo}
                        {r.esPropio ? " · tuya" : ""}
                      </p>
                      {r.descripcion ? (
                        <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-white/40">
                          {r.descripcion}
                        </p>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <p className="border-t border-white/10 px-3 py-2 text-[10px] text-white/45">
            Máx. {MAX_SELECTED} caletas por chat. Escribe para filtrar el listado.
          </p>
        </PopoverContent>
      </Popover>
    </div>
  );
}
