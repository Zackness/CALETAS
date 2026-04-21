"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  BookOpen,
  Plus,
  Search, 
  Star,
  Eye,
  Download,
  TrendingUp,
  Clock,
  Award,
  Users,
  FileText,
  Video,
  Link as LinkIcon,
  Lightbulb
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    const materiaId = searchParams.get("materia");
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

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "ANOTACION":
        return <FileText className="w-4 h-4" />;
      case "RESUMEN":
        return <BookOpen className="w-4 h-4" />;
      case "GUIA_ESTUDIO":
        return <Award className="w-4 h-4" />;
      case "EJERCICIOS":
        return <TrendingUp className="w-4 h-4" />;
      case "PRESENTACION":
        return <Video className="w-4 h-4" />;
      case "VIDEO":
        return <Video className="w-4 h-4" />;
      case "AUDIO":
        return <Video className="w-4 h-4" />;
      case "DOCUMENTO":
        return <FileText className="w-4 h-4" />;
      case "ENLACE":
        return <LinkIcon className="w-4 h-4" />;
      case "TIP":
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  /** Categoría (tipo) en tarjetas: variaciones dentro de la paleta oscura + acento mint. */
  const getTipoBadgeClass = (tipo: string) => {
    const base =
      "shrink-0 rounded-full border px-2.5 py-1 text-xs font-medium bg-[#1C2D20]";
    switch (tipo) {
      case "ANOTACION":
        return cn(base, "border-[#40C9A9]/50 text-[#40C9A9]");
      case "RESUMEN":
        return cn(base, "border-[#40C9A9]/35 text-emerald-200/95");
      case "GUIA_ESTUDIO":
        return cn(base, "border-white/20 text-[#40C9A9]/90");
      case "EJERCICIOS":
        return cn(base, "border-[#40C9A9]/30 text-white/90");
      case "PRESENTACION":
        return cn(base, "border-emerald-400/35 text-emerald-100/90");
      case "VIDEO":
        return cn(base, "border-[#40C9A9]/45 text-[#40C9A9]");
      case "AUDIO":
        return cn(base, "border-white/15 text-white/85");
      case "DOCUMENTO":
        return cn(base, "border-white/20 text-white/80");
      case "ENLACE":
        return cn(base, "border-[#40C9A9]/40 text-[#40C9A9]/95");
      case "TIP":
        return cn(base, "border-amber-400/25 text-amber-100/90");
      default:
        return cn(base, "border-white/15 text-white/75");
    }
  };

  const getTipoNombre = (tipo: string) => {
    switch (tipo) {
      case "ANOTACION":
        return "Anotación";
      case "RESUMEN":
        return "Resumen";
      case "GUIA_ESTUDIO":
        return "Guía de Estudio";
      case "EJERCICIOS":
        return "Ejercicios";
      case "PRESENTACION":
        return "Presentación";
      case "VIDEO":
        return "Video";
      case "AUDIO":
        return "Audio";
      case "DOCUMENTO":
        return "Documento";
      case "ENLACE":
        return "Enlace";
      case "TIP":
        return "Tip";
      default:
        return tipo;
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
            <BookOpen className="w-8 h-8 text-[#40C9A9]" />
            Caletas - Recursos Colaborativos
          </h1>
        <p className="text-white/70">
            Comparte y descubre recursos académicos con otros estudiantes
            </p>
          {fullCaletasPlanLocked ? (
            <div className="mt-3 rounded-lg border border-[#40C9A9]/40 bg-[#1C2D20] px-4 py-3 text-sm text-white/85">
              Para ver caletas de otras universidades necesitas Caleta Pro (plan de $7). Los planes de $3 incluyen tu universidad y las caletas genéricas.
            </div>
          ) : null}
          </div>

        {/* Estadísticas */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-4">
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Total Recursos
              </CardTitle>
              <BookOpen className="h-4 w-4 text-[#40C9A9]" />
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

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Total Vistas
              </CardTitle>
              <Eye className="h-4 w-4 text-[#40C9A9]" />
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

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Promedio Calificación
              </CardTitle>
              <Star className="h-4 w-4 text-[#40C9A9]" />
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

          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white/70">
                Total Descargas
              </CardTitle>
              <Download className="h-4 w-4 text-[#40C9A9]" />
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
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:flex-wrap">
          <div className="relative min-w-0 flex-1 md:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/50" />
            <Input
              placeholder="Buscar recursos por título, descripción o tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-white/10 bg-[#354B3A] pl-10 text-white placeholder:text-white/50"
            />
          </div>

          <Select value={filterMateria} onValueChange={setFilterMateria}>
            <SelectTrigger className="w-full border-white/10 bg-[#354B3A] text-white md:w-48">
              <SelectValue placeholder="Filtrar por materia" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#203324] text-white">
              <SelectItem value="todas" className="focus:bg-white/10">
                Todas las materias
              </SelectItem>
              <SelectItem value="genericas" className="focus:bg-white/10">
                Solo genéricas (sin universidad)
              </SelectItem>
              {materias.map((materia) => (
                <SelectItem
                  key={materia.id}
                  value={materia.id}
                  className="focus:bg-white/10"
                >
                  {materia.codigo} — {materia.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full border-white/10 bg-[#354B3A] text-white md:w-48">
              <SelectValue placeholder="Filtrar por tipo" />
            </SelectTrigger>
            <SelectContent className="max-h-72 border-white/10 bg-[#203324] text-white">
              {TIPO_FILTRO_OPCIONES.map((opt) => (
                <SelectItem
                  key={opt.value}
                  value={opt.value}
                  className="focus:bg-white/10"
                >
                  {opt.value === "todos" ? "Todos los tipos" : opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full border-white/10 bg-[#354B3A] text-white md:w-48">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent className="border-white/10 bg-[#203324] text-white">
              <SelectItem value="recientes" className="focus:bg-white/10">
                Más recientes
              </SelectItem>
              <SelectItem value="populares" className="focus:bg-white/10">
                Más populares
              </SelectItem>
              <SelectItem value="mejor-calificados" className="focus:bg-white/10">
                Mejor calificados
              </SelectItem>
              <SelectItem value="mas-descargados" className="focus:bg-white/10">
                Más descargados
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            asChild
            className="w-full shrink-0 bg-[#40C9A9] text-white hover:bg-[#40C9A9]/80 md:ml-auto md:w-auto"
          >
            <Link
              href="/caletas/crear"
              className="inline-flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Compartir recurso
            </Link>
          </Button>
        </div>

        {/* Lista de recursos */}
        <div className="space-y-4">
          {filteredRecursos.map((recurso) => (
            <Card
              key={recurso.id}
              className="border-white/10 bg-[#354B3A] transition-colors hover:border-[#40C9A9]/25"
            >
              <CardHeader className="space-y-3 pb-2">
                <h3 className="font-special text-lg leading-snug text-white sm:text-xl">
                  {recurso.titulo}
                </h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5",
                      getTipoBadgeClass(recurso.tipo),
                    )}
                  >
                    <span className="shrink-0 text-[#40C9A9]">
                      {getTipoIcon(recurso.tipo)}
                    </span>
                    {getTipoNombre(recurso.tipo)}
                  </span>
                  <Badge
                    variant="outline"
                    className="rounded-full border-white/15 bg-[#203324] px-2.5 py-1 text-xs font-normal text-white/80"
                  >
                    <BookOpen className="mr-1 inline h-3.5 w-3.5 text-[#40C9A9]" />
                    {recurso.materia
                      ? `${recurso.materia.codigo} · ${recurso.materia.nombre}`
                      : "Caleta genérica"}
                  </Badge>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-sm",
                      recurso.isFavorito ? "text-white/85" : "text-white/55",
                    )}
                    title={
                      recurso.isFavorito
                        ? "Este recurso está en tus favoritos"
                        : "Aún no está en tus favoritos"
                    }
                  >
                    <Star
                      className={cn(
                        "h-4 w-4 shrink-0",
                        recurso.isFavorito
                          ? "fill-[#40C9A9] text-[#40C9A9]"
                          : "text-white/45",
                      )}
                    />
                    <span className="font-medium text-white/85">
                      {recurso.numFavoritos ?? 0}
                    </span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-white/65">
                    <Eye className="h-4 w-4 shrink-0 text-[#40C9A9]" />
                    {recurso.numVistas}
                  </span>
                </div>
                <div className="flex flex-wrap content-start gap-1.5">
                  {(() => {
                    const tags = (recurso.tags ?? "")
                      .split(",")
                      .map((t) => t.trim())
                      .filter(Boolean);
                    if (tags.length === 0) {
                      return (
                        <span className="text-xs text-white/40">
                          Sin etiquetas
                        </span>
                      );
                    }
                    return tags.map((tag, index) => (
                      <span
                        key={`${recurso.id}-tag-${index}`}
                        className="inline-flex max-w-full items-center rounded-full border border-white/10 bg-[#1C2D20] px-2.5 py-0.5 text-xs leading-5 text-white/80"
                      >
                        <span className="truncate">{tag}</span>
                      </span>
                    ));
                  })()}
                </div>
                <p className="text-sm leading-relaxed text-white/70">
                  {recurso.descripcion}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-white/55">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-[#40C9A9]/80" />
                    {new Date(recurso.createdAt).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 shrink-0 text-[#40C9A9]/80" />
                    {recurso.autor.name}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="border-t border-white/10 pt-4">
                <div className="flex w-full flex-wrap items-center justify-stretch gap-2 sm:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      className="h-9 min-h-9 w-full border-[#40C9A9]/40 bg-[#1C2D20] text-sm font-medium text-[#40C9A9] shadow-none hover:bg-white/10 hover:text-[#40C9A9] sm:w-auto"
                      onClick={() => {
                        void registrarVista(recurso.id);
                        if (recurso.archivoUrl) {
                          const urlParts = recurso.archivoUrl.split("/");
                          const filename = urlParts[urlParts.length - 1];
                          window.location.href = `/view-pdf/${encodeURIComponent(filename)}`;
                        } else {
                          window.location.href = `/caletas/${recurso.id}`;
                        }
                      }}
                    >
                      Ver caleta
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => toggleFavorito(recurso.id)}
                      className={cn(
                        "h-9 min-h-9 w-full text-sm font-medium shadow-none sm:w-auto",
                        recurso.isFavorito
                          ? "border-[#40C9A9]/50 bg-[#40C9A9]/20 text-white hover:bg-[#40C9A9]/30 hover:text-white"
                          : "border-[#40C9A9]/40 bg-[#1C2D20] text-[#40C9A9] hover:bg-white/10 hover:text-[#40C9A9]",
                      )}
                    >
                      <Star
                        className={cn(
                          "mr-1.5 h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4",
                          recurso.isFavorito && "fill-[#40C9A9] text-[#40C9A9]",
                        )}
                      />
                      <span className="sm:hidden">
                        {recurso.isFavorito ? "Guardado" : "Favorito"}
                      </span>
                      <span className="hidden sm:inline">
                        {recurso.isFavorito
                          ? "En favoritos"
                          : "Añadir a favoritos"}
                      </span>
                    </Button>
                </div>
              </CardContent>
            </Card>
        ))}
          
          {filteredRecursos.length === 0 && (
            <div className="text-center py-12 text-white/70">
              <BookOpen className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <h3 className="text-xl font-medium text-white mb-2">
                {searchTerm || filterMateria !== "todas" || filterTipo !== "todos"
                  ? "No se encontraron recursos" 
                  : "No hay recursos disponibles"
                }
              </h3>
              <p className="text-white/70">
                {searchTerm || filterMateria !== "todas" || filterTipo !== "todos"
                ? "Intenta ajustar los filtros de búsqueda"
                  : "Sé el primero en compartir un recurso académico"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 