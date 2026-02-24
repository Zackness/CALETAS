"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  MessageCircle,
  Filter,
  TrendingUp,
  Clock,
  Award,
  Users,
  FileText,
  Video,
  Link,
  Lightbulb
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";

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
  tags: string;
  createdAt: string;
  isFavorito?: boolean;
  materia: {
    id: string;
    codigo: string;
      nombre: string;
    semestre: string;
  };
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

export default function CaletasPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterMateria, setFilterMateria] = useState<string>("todas");
  const [filterTipo, setFilterTipo] = useState<string>("todos");
  const [sortBy, setSortBy] = useState<string>("recientes");

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

      // `isFavorito` viene resuelto desde el backend (evitamos N+1 requests)
      setRecursos(recursos);
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
      setMaterias(response.data.materias);
    } catch (error) {
      console.error("Error fetching materias:", error);
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
          ? { ...r, isFavorito: !r.isFavorito }
          : r
      ));
    } catch (error) {
      console.error("Error toggling favorito:", error);
      toast.error("Error al actualizar favoritos");
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
        return <Link className="w-4 h-4" />;
      case "TIP":
        return <Lightbulb className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "ANOTACION":
        return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "RESUMEN":
        return "bg-green-500/10 text-green-300 border-green-500/20";
      case "GUIA_ESTUDIO":
        return "bg-purple-500/10 text-purple-300 border-purple-500/20";
      case "EJERCICIOS":
        return "bg-orange-500/10 text-orange-300 border-orange-500/20";
      case "PRESENTACION":
        return "bg-red-500/10 text-red-300 border-red-500/20";
      case "VIDEO":
        return "bg-pink-500/10 text-pink-300 border-pink-500/20";
      case "AUDIO":
        return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
      case "DOCUMENTO":
        return "bg-gray-500/10 text-gray-300 border-gray-500/20";
      case "ENLACE":
        return "bg-cyan-500/10 text-cyan-300 border-cyan-500/20";
      case "TIP":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-300 border-gray-500/20";
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
      const matchesMateria = filterMateria === "todas" || recurso.materia.id === filterMateria;
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
          </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  ? (recursos.reduce((sum, r) => sum + r.calificacion, 0) / recursos.length).toFixed(1)
                  : "0.0"
                }
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
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
                <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                  <Input
                placeholder="Buscar recursos por título, descripción o tags..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-[#354B3A] border-white/10 text-white placeholder:text-white/50"
                  />
                </div>
              </div>

          <Select value={filterMateria} onValueChange={setFilterMateria}>
            <SelectTrigger className="w-full md:w-48 bg-[#354B3A] border-white/10 text-white">
              <SelectValue placeholder="Filtrar por materia" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#354B3A] border-white/10">
              <SelectItem value="todas" className="text-white">Todas las materias</SelectItem>
              {materias.map((materia) => (
                <SelectItem key={materia.id} value={materia.id} className="text-white">
                  {materia.codigo} - {materia.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-full md:w-48 bg-[#354B3A] border-white/10 text-white">
              <SelectValue placeholder="Filtrar por tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#354B3A] border-white/10">
              <SelectItem value="todos" className="text-white">Todos los tipos</SelectItem>
              <SelectItem value="ANOTACION" className="text-white">Anotaciones</SelectItem>
              <SelectItem value="RESUMEN" className="text-white">Resúmenes</SelectItem>
              <SelectItem value="GUIA_ESTUDIO" className="text-white">Guías de Estudio</SelectItem>
              <SelectItem value="EJERCICIOS" className="text-white">Ejercicios</SelectItem>
              <SelectItem value="PRESENTACION" className="text-white">Presentaciones</SelectItem>
              <SelectItem value="VIDEO" className="text-white">Videos</SelectItem>
              <SelectItem value="AUDIO" className="text-white">Audios</SelectItem>
              <SelectItem value="DOCUMENTO" className="text-white">Documentos</SelectItem>
              <SelectItem value="ENLACE" className="text-white">Enlaces</SelectItem>
              <SelectItem value="TIP" className="text-white">Tips</SelectItem>
                  </SelectContent>
                </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full md:w-48 bg-[#354B3A] border-white/10 text-white">
              <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#354B3A] border-white/10">
              <SelectItem value="recientes" className="text-white">Más recientes</SelectItem>
              <SelectItem value="populares" className="text-white">Más populares</SelectItem>
              <SelectItem value="mejor-calificados" className="text-white">Mejor calificados</SelectItem>
              <SelectItem value="mas-descargados" className="text-white">Más descargados</SelectItem>
                  </SelectContent>
                </Select>

          <Button
            onClick={() => window.location.href = "/caletas/crear"}
            className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Compartir Recurso
          </Button>
      </div>

        {/* Lista de recursos */}
        <div className="space-y-4">
          {filteredRecursos.map((recurso) => (
            <Card key={recurso.id} className="bg-[#354B3A] border-white/10 hover:bg-[#1C2D20] transition-colors">
              <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getTipoIcon(recurso.tipo)}
                      <h3 className="text-lg font-semibold text-white">
                        {recurso.titulo}
                      </h3>
                      <Badge className={getTipoColor(recurso.tipo)}>
                        {getTipoNombre(recurso.tipo)}
                      </Badge>
                </div>
                    <p className="text-white/70 mb-3">
                      {recurso.descripcion}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-white/60">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-4 h-4" />
                        {recurso.materia.codigo} - {recurso.materia.nombre}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(recurso.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {recurso.autor.name}
                      </span>
                </div>
              </div>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400" />
                      {recurso.calificacion.toFixed(1)} ({recurso.numCalificaciones})
                    </span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {recurso.numVistas}
                    </span>

                </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    {recurso.tags && (
                      <div className="flex gap-1">
                        {recurso.tags.split(',').map((tag, index) => (
                          <Badge key={index} className="bg-white/10 text-white/70 border-white/20">
                            {tag.trim()}
                          </Badge>
                        ))}
                </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (recurso.archivoUrl) {
                      // Extraer el nombre del archivo de la URL
                      const urlParts = recurso.archivoUrl.split('/');
                      const filename = urlParts[urlParts.length - 1];
                      // Redirigir a la página de visualización de PDF
                      window.location.href = `/view-pdf/${encodeURIComponent(filename)}`;
                    } else {
                      // Si no hay archivo, ir a la página de detalles
                      window.location.href = `/caletas/${recurso.id}`;
                    }
                  }}
                  className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                >
                  Ver Caleta
                </Button>
                    <Button
                      size="sm"
                      variant={recurso.isFavorito ? "default" : "outline"}
                      onClick={() => toggleFavorito(recurso.id)}
                      className={
                        recurso.isFavorito 
                          ? "bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500" 
                          : "border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                      }
                    >
                      <Star className={`w-4 h-4 mr-2 ${recurso.isFavorito ? 'fill-current' : ''}`} />
                      {recurso.isFavorito ? 'Favorito' : 'Favorito'}
                    </Button>
                  </div>
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