"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, FileText, BookOpen, Building2, Loader2 } from "lucide-react";

type RecursoItem = {
  id: string;
  titulo: string;
  tipo: string;
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

const DEBOUNCE_MS = 280;

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
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const totalItems = suggestions.recursos.length + suggestions.materias.length + suggestions.universidades.length;

  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.length < 2) {
      setSuggestions({ recursos: [], materias: [], universidades: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
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
      fetchSuggestions(query.trim());
      setOpen(true);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectRecurso = (id: string) => {
    router.push(`/caletas/${id}`);
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

  const items: { type: "recurso" | "materia" | "universidad"; id: string; label: string; sub?: string; onClick: () => void }[] = [];
  suggestions.recursos.forEach((r) =>
    items.push({
      type: "recurso",
      id: r.id,
      label: r.titulo,
      sub: `${r.materia.codigo} - ${r.materia.nombre}`,
      onClick: () => selectRecurso(r.id),
    })
  );
  suggestions.materias.forEach((m) =>
    items.push({
      type: "materia",
      id: m.id,
      label: `${m.codigo} - ${m.nombre}`,
      sub: m.carrera?.universidad?.siglas,
      onClick: () => selectMateria(m.id),
    })
  );
  suggestions.universidades.forEach((u) =>
    items.push({
      type: "universidad",
      id: u.id,
      label: u.nombre,
      sub: u.siglas,
      onClick: selectUniversidad,
    })
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
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
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  const hasAny = totalItems > 0;
  const showDropdown = open && (query.trim().length >= 2 && (loading || hasAny));

  return (
    <div ref={containerRef} className="relative flex-1 max-w-lg mx-auto flex justify-center">
      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 h-4 w-4 md:h-5 md:w-5 pointer-events-none z-10" />
      <input
        type="text"
        placeholder="Buscar caletas, materias, universidades..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => query.trim().length >= 2 && setOpen(true)}
        onKeyDown={handleKeyDown}
        className="w-full pl-8 md:pl-10 pr-2 md:pr-4 py-2 rounded-lg bg-white/10 text-white placeholder:text-white/60 border border-white/10 focus:outline-none focus:border-[#40C9A9] text-sm md:text-base"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        role="combobox"
      />

      {showDropdown && (
        <div
          className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-white/10 bg-[#203324] shadow-xl z-50 max-h-[min(400px,70vh)] overflow-y-auto"
          role="listbox"
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
                  <div className="px-3 py-1.5 text-xs font-semibold text-[#40C9A9] uppercase tracking-wider">
                    Caletas
                  </div>
                  {suggestions.recursos.map((r, i) => {
                    const idx = items.findIndex((x) => x.type === "recurso" && x.id === r.id);
                    const isHighlight = idx === highlight;
                    return (
                      <button
                        key={`recurso-${r.id}`}
                        type="button"
                        role="option"
                        aria-selected={isHighlight}
                        onMouseEnter={() => setHighlight(idx)}
                        onClick={() => selectRecurso(r.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 text-left rounded-none hover:bg-white/10 ${isHighlight ? "bg-white/10" : ""} text-white`}
                      >
                        <FileText className="h-4 w-4 text-[#40C9A9] flex-shrink-0" />
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
                  <div className="px-3 py-1.5 text-xs font-semibold text-[#40C9A9] uppercase tracking-wider">
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
                        <BookOpen className="h-4 w-4 text-[#40C9A9] flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{m.codigo} - {m.nombre}</div>
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
                  <div className="px-3 py-1.5 text-xs font-semibold text-[#40C9A9] uppercase tracking-wider">
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
                        <Building2 className="h-4 w-4 text-[#40C9A9] flex-shrink-0" />
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
      )}
    </div>
  );
}
