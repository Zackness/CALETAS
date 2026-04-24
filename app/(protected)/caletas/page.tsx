"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Download, Eye, Search, Star, LayoutGrid, List } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { shareOrCopyUrl } from "@/lib/share";
import {
  CaletaExploreGridCard,
  recursoToExploreHref,
} from "@/components/caletas/caleta-explore-grid-card";
import { CaletaExploreListCard } from "@/components/caletas/caleta-explore-list-card";

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  contenido: string;
  archivoUrl?: string;
  calificacion: number;
  numCalificaciones: number;
  numVistas: number;
  numDescargas: number;
  numFavoritos?: number;
  tags: string;
  createdAt: string;
  isFavorito?: boolean;
  materia: {
    id: string;
    codigo: string;
    nombre: string;
    semestre: string;
    carrera?: {
      universidadId?: string;
    };
  } | null;
  autor: {
    id: string;
    username?: string | null;
    name: string;
    email: string;
  };
}

interface Materia {
  id: string;
  codigo: string;
  nombre: string;
  semestre: string;
}

/** Valores del select "Filtrar por tipo" (alineados con la API). */
const TIPO_FILTRO_OPCIONES: { value: string; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "ANOTACION", label: "Anotación" },
  { value: "RESUMEN", label: "Resumen" },
  { value: "GUIA_ESTUDIO", label: "Guía" },
  { value: "EJERCICIOS", label: "Ejercicios" },
  { value: "PRESENTACION", label: "Presentación" },
  { value: "VIDEO", label: "Video" },
  { value: "AUDIO", label: "Audio" },
  { value: "DOCUMENTO", label: "Documento" },
  { value: "ENLACE", label: "Enlace" },
  { value: "TIP", label: "Tip" },
];

export default function CaletasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = authClient.useSession();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMateria, setFilterMateria] = useState<string>("todas");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<string>("recientes");
  const [fullCaletasPlanLocked, setFullCaletasPlanLocked] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  useEffect(() => {
    try {
      const stored = localStorage.getItem("caletas-feed-view");
      if (stored === "list" || stored === "grid") setViewMode(stored);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("caletas-feed-view", viewMode);
    } catch {
      /* ignore */
    }
  }, [viewMode]);

  useEffect(() => {
    const materiaId = searchParams?.get("materia");
    if (materiaId) setFilterMateria(materiaId);
  }, [searchParams]);

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.replace("/login");
      return;
    }

    fetchRecursos();
    fetchMaterias();
  }, [session, isPending, router]);

  const fetchRecursos = async () => {
    try {
      const response = await axios.get("/api/caletas/recursos");
      const recursos = response.data.recursos;
      const restricted =
        !!response.data?.restrictions?.fullCaletasPlanLocked ||
        !!response.data?.restrictions?.crossUniversityLocked;

      setRecursos(recursos);
      setFullCaletasPlanLocked(restricted);
    } catch (error) {
      console.error("Error fetching recursos:", error);
      toast.error("Error al cargar los recursos");
    } finally {
      setLoading(false);
    }
  };

  const fetchMaterias = async () => {
    try {
      const response = await axios.get("/api/user/academico/materias");
      if (response.status === 200 && Array.isArray(response.data?.materias)) {
        setMaterias(response.data.materias);
      } else {
        setMaterias([]);
      }
    } catch {
      setMaterias([]);
    }
  };

  const toggleFavorito = async (recursoId: string) => {
    try {
      const recurso = recursos.find(r => r.id === recursoId);
      if (!recurso) return;

      if (recurso.isFavorito) {
        // Quitar de favoritos
        await axios.delete(`/api/caletas/favoritos?recursoId=${recursoId}`);
        toast.success("Eliminado de favoritos");
      } else {
        // Agregar a favoritos
        await axios.post("/api/caletas/favoritos", { recursoId });
        toast.success("Agregado a favoritos");
      }

      // Actualizar estado local
      setRecursos(prev => prev.map(r => 
        r.id === recursoId 
          ? { 
              ...r, 
              isFavorito: !r.isFavorito,
              numFavoritos: Math.max(
                0,
                (r.numFavoritos ?? 0) + (r.isFavorito ? -1 : 1),
              ),
            }
          : r
      ));
    } catch (error) {
      console.error("Error toggling favorito:", error);
      toast.error("Error al actualizar favoritos");
    }
  };

  const shareRecurso = async (recurso: Recurso) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/caletas/${recurso.id}`;
    try {
      const res = await shareOrCopyUrl({
        title: recurso.titulo,
        text: recurso.descripcion?.slice(0, 140) || "Caleta en Caletas",
        url,
      });
      if (!res.shared) toast.success("Link copiado al portapapeles");
    } catch {
      toast.error("No se pudo compartir/copiar el enlace");
    }
  };

  const registrarVista = async (recursoId: string) => {
    // Optimistic: sube 1 y luego sincroniza con el servidor si responde
    setRecursos((prev) =>
      prev.map((r) => (r.id === recursoId ? { ...r, numVistas: r.numVistas + 1 } : r)),
    );
    try {
      const { data } = await axios.post(`/api/caletas/recursos/${recursoId}/view`);
      if (typeof data?.numVistas === "number") {
        setRecursos((prev) =>
          prev.map((r) => (r.id === recursoId ? { ...r, numVistas: data.numVistas } : r)),
        );
      }
    } catch (error) {
      console.error("Error registrando vista:", error);
      // Rollback suave: no molestamos al usuario; el contador se corregirá al recargar.
    }
  };

  // Filtrar y ordenar recursos
  const filteredRecursos = recursos
    .filter(recurso => {
      const matchesSearch = recurso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recurso.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recurso.tags.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMateria =
        filterMateria === "todas" ||
        (filterMateria === "genericas" && !recurso.materia) ||
        (!!recurso.materia && recurso.materia.id === filterMateria);
      const matchesTipo = filterTipo === "todos" || recurso.tipo === filterTipo;
      return matchesSearch && matchesMateria && matchesTipo;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "recientes":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "populares":
          return b.numVistas - a.numVistas;
        case "mejor-calificados":
          return b.calificacion - a.calificacion;
        case "mas-descargados":
          return b.numDescargas - a.numDescargas;
        default:
          return 0;
      }
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Cargando recursos de Caletas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[var(--accent-hex)]" />
            Caletas
          </h1>
        <p className="max-w-2xl text-white/70">
            Tu feed colaborativo: explora lo que subió la comunidad, guarda en favoritos y comparte
            enlaces como en una red social.
          </p>
          {fullCaletasPlanLocked ? (
            <div className="mt-3 rounded-lg border border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] bg-[var(--mygreen-dark)] px-4 py-3 text-sm text-white/85">
              Para ver caletas de otras universidades necesitas Caleta Pro (plan de $7). Los planes de $3 incluyen tu universidad y las caletas genéricas.
            </div>
          ) : null}
          </div>

        {/* Estadísticas */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
          <Card className="bg-[var(--mygreen-light)] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Total Recursos
              </CardTitle>
              <BookOpen className="h-4 w-4 text-[var(--accent-hex)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {recursos.length}
              </div>
              <p className="text-xs text-white/70 mt-1">
                Recursos compartidos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--mygreen-light)] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Total Vistas
              </CardTitle>
              <Eye className="h-4 w-4 text-[var(--accent-hex)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {recursos.reduce((sum, r) => sum + r.numVistas, 0)}
              </div>
              <p className="text-xs text-white/70 mt-1">
                Visualizaciones
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--mygreen-light)] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Promedio Calificación
              </CardTitle>
              <Star className="h-4 w-4 text-[var(--accent-hex)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {recursos.length > 0
                  ? (
                      recursos.reduce((sum, r) => sum + r.calificacion, 0) /
                      recursos.length
                    ).toFixed(1)
                  : "0.0"}
              </div>
              <p className="text-xs text-white/70 mt-1">
                Calificación promedio
              </p>
            </CardContent>
          </Card>

          <Card className="bg-[var(--mygreen-light)] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Total Descargas
              </CardTitle>
              <Download className="h-4 w-4 text-[var(--accent-hex)]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {recursos.reduce((sum, r) => sum + r.numDescargas, 0)}
              </div>
              <p className="text-xs text-white/70 mt-1">
                Descargas realizadas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Controles de búsqueda y filtros */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1 md:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              placeholder="Buscar caletas por título, descripción o tags…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-white/10 bg-[var(--mygreen-light)] pl-10 text-white placeholder:text-white/50"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            className="bg-[var(--mygreen-light)] border-white/10 text-white hover:bg-white/10 md:hidden"
            onClick={() => setShowFilters((v) => !v)}
          >
            <Search className="h-4 w-4 mr-2" />
            {showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          </Button>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("list")}
              className={cn(
                "flex-1 border-white/10 bg-[var(--mygreen-light)] text-white hover:bg-white/10",
                viewMode === "list" &&
                  "border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_15%,transparent)]",
              )}
              title="Vista lista"
              aria-pressed={viewMode === "list"}
            >
              <List className="mx-auto h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("grid")}
              className={cn(
                "flex-1 border-white/10 bg-[var(--mygreen-light)] text-white hover:bg-white/10",
                viewMode === "grid" &&
                  "border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_15%,transparent)]",
              )}
              title="Vista cuadrícula"
              aria-pressed={viewMode === "grid"}
            >
              <LayoutGrid className="mx-auto h-4 w-4" />
            </Button>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("list")}
              className={cn(
                "border-white/10 bg-[var(--mygreen-light)] text-white hover:bg-white/10",
                viewMode === "list" && "border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_15%,transparent)]",
              )}
              title="Vista lista"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode("grid")}
              className={cn(
                "border-white/10 bg-[var(--mygreen-light)] text-white hover:bg-white/10",
                viewMode === "grid" && "border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_15%,transparent)]",
              )}
              title="Vista tipo Pinterest"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>

          </div>

          <div
            className={cn(
              "grid grid-cols-1 gap-3 md:grid-cols-3",
              !showFilters && "hidden md:grid",
            )}
          >
            <Select value={filterMateria} onValueChange={setFilterMateria}>
              <SelectTrigger className="w-full border-white/10 bg-[var(--mygreen-light)] text-white">
                <SelectValue placeholder="Materia" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[var(--mygreen)] text-white">
                <SelectItem value="todas" className="focus:bg-white/10">
                  Todas las materias
                </SelectItem>
                <SelectItem value="genericas" className="focus:bg-white/10">
                  Solo genéricas (sin universidad)
                </SelectItem>
                {materias.map((materia) => (
                  <SelectItem key={materia.id} value={materia.id} className="focus:bg-white/10">
                    {materia.codigo} — {materia.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className="w-full border-white/10 bg-[var(--mygreen-light)] text-white">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent className="max-h-72 border-white/10 bg-[var(--mygreen)] text-white">
                {TIPO_FILTRO_OPCIONES.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="focus:bg-white/10">
                    {opt.value === "todos" ? "Todos los tipos" : opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full border-white/10 bg-[var(--mygreen-light)] text-white">
                <SelectValue placeholder="Ordenar" />
              </SelectTrigger>
              <SelectContent className="border-white/10 bg-[var(--mygreen)] text-white">
                <SelectItem value="recientes" className="focus:bg-white/10">
                  Más recientes
                </SelectItem>
                <SelectItem value="populares" className="focus:bg-white/10">
                  Más vistas
                </SelectItem>
                <SelectItem value="mejor-calificados" className="focus:bg-white/10">
                  Mejor calificados
                </SelectItem>
                <SelectItem value="mas-descargados" className="focus:bg-white/10">
                  Más descargados
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Feed de caletas (lista detallada · grid tipo home) */}
        {filteredRecursos.length > 0 ? (
          <p className="mb-3 text-xs text-white/55">
            <span className="font-medium text-white/80">{filteredRecursos.length}</span>{" "}
            {filteredRecursos.length === 1 ? "caleta" : "caletas"}
            {viewMode === "grid" ? (
              <span className="text-white/45"> · tarjetas compactas</span>
            ) : null}
          </p>
        ) : null}

        <div
          className={cn(
            viewMode === "list"
              ? "space-y-4"
              : "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3",
          )}
        >
          {filteredRecursos.map((recurso) =>
            viewMode === "list" ? (
              <CaletaExploreListCard
                key={recurso.id}
                recurso={{
                  id: recurso.id,
                  titulo: recurso.titulo,
                  descripcion: recurso.descripcion,
                  tipo: recurso.tipo,
                  tags: recurso.tags,
                  createdAt: recurso.createdAt,
                  numVistas: recurso.numVistas,
                  numDescargas: recurso.numDescargas,
                  numFavoritos: recurso.numFavoritos,
                  isFavorito: recurso.isFavorito,
                  materia: recurso.materia,
                  autor: { id: recurso.autor.id, username: recurso.autor.username, name: recurso.autor.name },
                }}
                href={recursoToExploreHref(recurso)}
                onOpen={() => void registrarVista(recurso.id)}
                onToggleFavorito={() => void toggleFavorito(recurso.id)}
                onShare={() => void shareRecurso(recurso)}
              />
            ) : (
              <CaletaExploreGridCard
                key={recurso.id}
                recurso={{
                  id: recurso.id,
                  titulo: recurso.titulo,
                  tipo: recurso.tipo,
                  createdAt: recurso.createdAt,
                  numVistas: recurso.numVistas,
                  numDescargas: recurso.numDescargas,
                  numFavoritos: recurso.numFavoritos,
                  isFavorito: recurso.isFavorito,
                  materia: recurso.materia,
                  autor: { id: recurso.autor.id, username: recurso.autor.username, name: recurso.autor.name },
                }}
                href={recursoToExploreHref(recurso)}
                onRegistrarVista={() => void registrarVista(recurso.id)}
                onToggleFavorito={() => void toggleFavorito(recurso.id)}
                onShare={() => void shareRecurso(recurso)}
              />
            )
          )}
          
          {filteredRecursos.length === 0 && (
            <div className="text-center py-12 text-white/70">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <h3 className="text-xl font-medium text-white mb-2">
                {searchTerm || filterMateria !== "todas" || filterTipo !== "todos"
                  ? "No se encontraron recursos" 
                  : "Aún no hay caletas"
                }
              </h3>
              <p className="text-white/70">
                {searchTerm || filterMateria !== "todas" || filterTipo !== "todos"
                ? "Intenta ajustar los filtros de búsqueda"
                  : "Sé el primero en compartir una caleta"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 