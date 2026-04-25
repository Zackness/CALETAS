"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, FileText, BookOpen, Building2, Loader2 } from "lucide-react";
import { recursoToExploreHref } from "@/lib/recurso-view-href";

type RecursoItem = {
  id: string;
  titulo: string;
  tipo: string;
  archivoUrl?: string | null;
  materia: { codigo: string; nombre: string };
};

type MateriaItem = {
  id: string;
  nombre: string;
  codigo: string;
  carrera: {
    nombre: string;
    universidad: { siglas: string };
  };
};

type UniversidadItem = {
  id: string;
  nombre: string;
  siglas: string;
};

type Suggestions = {
  recursos: RecursoItem[];
  materias: MateriaItem[];
  universidades: UniversidadItem[];
};

type PanelRect = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
};

const DEBOUNCE_MS = 280;
/** Por encima de la barra inferior móvil (z-50) y modales habituales */
const PANEL_Z = 200;
/** Reserva inferior para nav móvil + área segura */
const MOBILE_NAV_RESERVE = 96;

function isEditableTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === "TEXTAREA") return true;
  if (el.isContentEditable) return true;
  if (tag === "SELECT") return true;
  if (tag === "INPUT") {
    const type = (el as HTMLInputElement).type?.toLowerCase() ?? "text";
    if (["button", "checkbox", "radio", "submit", "reset", "file", "hidden"].includes(type)) return false;
    return true;
  }
  return false;
}

export function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestions>({
    recursos: [],
    materias: [],
    universidades: [],
  });
  const [highlight, setHighlight] = useState(0);
  const [panelRect, setPanelRect] = useState<PanelRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalItems = suggestions.recursos.length + suggestions.materias.length + suggestions.universidades.length;
  const hasAny = totalItems > 0;
  const showDropdown =
    open &&
    query.trim().length >= 2 &&
    (loading || hasAny || (!loading && totalItems === 0));

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePanelPosition = useCallback(() => {
    const wrap = containerRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom - MOBILE_NAV_RESERVE;
    const maxHeight = Math.min(400, Math.max(120, spaceBelow));
    setPanelRect({
      top: r.bottom + 4,
      left: r.left,
      width: Math.max(200, r.width),
      maxHeight,
    });
  }, []);

  useLayoutEffect(() => {
    if (!showDropdown) {
      setPanelRect(null);
      return;
    }
    updatePanelPosition();
  }, [showDropdown, loading, suggestions, query, updatePanelPosition]);

  useEffect(() => {
    if (!showDropdown) return;
    const onScrollOrResize = () => updatePanelPosition();
    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, true);
    return () => {
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [showDropdown, updatePanelPosition]);

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions({ recursos: [], materias: [], universidades: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`, {
        credentials: "same-origin",
      });
      const data = await res.json();
      if (res.ok) {
        setSuggestions({
          recursos: data.recursos ?? [],
          materias: data.materias ?? [],
          universidades: data.universidades ?? [],
        });
        setHighlight(0);
      } else {
        setSuggestions({ recursos: [], materias: [], universidades: [] });
      }
    } catch {
      setSuggestions({ recursos: [], materias: [], universidades: [] });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions({ recursos: [], materias: [], universidades: [] });
      setOpen(!!query.trim());
      return;
    }
    debounceRef.current = setTimeout(() => {
      void fetchSuggestions(query.trim());
      setOpen(true);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const t = e.target as Node;
      if (containerRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "k") return;
      if (isEditableTarget(e.target) && e.target !== inputRef.current) return;
      e.preventDefault();
      inputRef.current?.focus();
      if (query.trim().length >= 2) setOpen(true);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [query]);

  const selectRecurso = (r: RecursoItem) => {
    router.push(recursoToExploreHref({ id: r.id, archivoUrl: r.archivoUrl }));
    setQuery("");
    setOpen(false);
  };

  const selectMateria = (id: string) => {
    router.push(`/caletas?materia=${id}`);
    setQuery("");
    setOpen(false);
  };

  const selectUniversidad = () => {
    router.push("/caletas");
    setQuery("");
    setOpen(false);
  };

  const items: {
    type: "recurso" | "materia" | "universidad";
    id: string;
    label: string;
    sub?: string;
    onClick: () => void;
  }[] = [];
  suggestions.recursos.forEach((r) =>
    items.push({
      type: "recurso",
      id: r.id,
      label: r.titulo,
      sub: `${r.materia.codigo} - ${r.materia.nombre}`,
      onClick: () => selectRecurso(r),
    }),
  );
  suggestions.materias.forEach((m) =>
    items.push({
      type: "materia",
      id: m.id,
      label: `${m.codigo} - ${m.nombre}`,
      sub: m.carrera?.universidad?.siglas,
      onClick: () => selectMateria(m.id),
    }),
  );
  suggestions.universidades.forEach((u) =>
    items.push({
      type: "universidad",
      id: u.id,
      label: u.nombre,
      sub: u.siglas,
      onClick: selectUniversidad,
    }),
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || totalItems === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => (h + 1) % totalItems);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => (h - 1 + totalItems) % totalItems);
    } else if (e.key === "Enter" && items[highlight]) {
      e.preventDefault();
      items[highlight].onClick();
    }
  };

  const dropdown = showDropdown && panelRect && mounted ? (
    <div
      ref={panelRef}
      id="header-search-listbox"
      role="listbox"
      className="rounded-lg border border-white/10 bg-[var(--mygreen)] shadow-xl overflow-y-auto"
      style={{
        position: "fixed",
        top: panelRect.top,
        left: panelRect.left,
        width: panelRect.width,
        maxHeight: panelRect.maxHeight,
        zIndex: PANEL_Z,
      }}
    >
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-6 text-white/70">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Buscando...</span>
        </div>
      ) : (
        <>
          {suggestions.recursos.length > 0 && (
            <div className="py-1">
              <div className="px-3 py-1.5 text-xs font-semibold text-[var(--accent-hex)] uppercase tracking-wider">
                Caletas
              </div>
              {suggestions.recursos.map((r) => {
                const idx = items.findIndex((x) => x.type === "recurso" && x.id === r.id);
                const isHighlight = idx === highlight;
                return (
                  <button
                    key={`recurso-${r.id}`}
                    type="button"
                    role="option"
                    aria-selected={isHighlight}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => selectRecurso(r)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-none hover:bg-white/10 ${isHighlight ? "bg-white/10" : ""} text-white`}
                  >
                    <FileText className="h-4 w-4 text-[var(--accent-hex)] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{r.titulo}</div>
                      <div className="text-xs text-white/60 truncate">
                        {r.materia.codigo} - {r.materia.nombre}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {suggestions.materias.length > 0 && (
            <div className="py-1 border-t border-white/5">
              <div className="px-3 py-1.5 text-xs font-semibold text-[var(--accent-hex)] uppercase tracking-wider">
                Materias
              </div>
              {suggestions.materias.map((m) => {
                const idx = items.findIndex((x) => x.type === "materia" && x.id === m.id);
                const isHighlight = idx === highlight;
                return (
                  <button
                    key={`materia-${m.id}`}
                    type="button"
                    role="option"
                    aria-selected={isHighlight}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={() => selectMateria(m.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-none hover:bg-white/10 ${isHighlight ? "bg-white/10" : ""} text-white`}
                  >
                    <BookOpen className="h-4 w-4 text-[var(--accent-hex)] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">
                        {m.codigo} - {m.nombre}
                      </div>
                      {m.carrera?.universidad?.siglas && (
                        <div className="text-xs text-white/60">{m.carrera.universidad.siglas}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {suggestions.universidades.length > 0 && (
            <div className="py-1 border-t border-white/5">
              <div className="px-3 py-1.5 text-xs font-semibold text-[var(--accent-hex)] uppercase tracking-wider">
                Universidades
              </div>
              {suggestions.universidades.map((u) => {
                const idx = items.findIndex((x) => x.type === "universidad" && x.id === u.id);
                const isHighlight = idx === highlight;
                return (
                  <button
                    key={`uni-${u.id}`}
                    type="button"
                    role="option"
                    aria-selected={isHighlight}
                    onMouseEnter={() => setHighlight(idx)}
                    onClick={selectUniversidad}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-none hover:bg-white/10 ${isHighlight ? "bg-white/10" : ""} text-white`}
                  >
                    <Building2 className="h-4 w-4 text-[var(--accent-hex)] flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{u.nombre}</div>
                      <div className="text-xs text-white/60">{u.siglas}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {!loading && query.trim().length >= 2 && totalItems === 0 && (
            <div className="px-3 py-4 text-center text-white/60 text-sm">
              No hay resultados para &quot;{query}&quot;
            </div>
          )}
        </>
      )}
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className="relative mx-auto flex w-full min-w-0 max-w-none justify-center md:max-w-lg md:flex-1"
    >
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 h-4 w-4 md:h-5 md:w-5 pointer-events-none z-10" />
      <input
        ref={inputRef}
        type="text"
        placeholder="Buscar caletas, materias… (Ctrl+K o ⌘+K)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full min-w-0 max-w-full pl-8 pr-2 py-2 text-sm placeholder:text-white/55 border border-white/10 bg-white/10 text-white focus:border-[var(--accent-hex)] focus:outline-none md:pl-10 md:pr-4 md:text-base"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="header-search-listbox"
        role="combobox"
      />
      {mounted && dropdown ? createPortal(dropdown, document.body) : null}
    </div>
  );
}
