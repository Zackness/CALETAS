"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { 
  FileText, 
  Search, 
  Edit, 
  Trash2, 
  Eye, 
  Download, 
  Star, 
  Calendar,
  Filter,
  SortAsc,
  SortDesc,
  Plus
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  contenido: string;
  archivoUrl: string | null;
  esPublico: boolean;
  tags: string | null;
  calificacion: number;
  numCalificaciones: number;
  numVistas: number;
  numDescargas: number;
  createdAt: string;
  updatedAt: string;
  materia: {
    id: string;
    nombre: string;
    codigo: string;
  };
}

// Función para formatear fechas de manera consistente
const formatDate = (dateString: string) => {
  if (!dateString) return "";
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "";
    
    // Formato consistente: DD/MM/YYYY
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    return "";
  }
};

export default function MisRecursosPage() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTipo, setFilterTipo] = useState<string>("TODOS");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  
  const router = useRouter();

  // Marcar como montado para evitar errores de hidratación
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Cargar recursos del usuario
  useEffect(() => {
    if (isMounted) {
      fetchRecursos();
    }
  }, [isMounted]);

  const fetchRecursos = async () => {
    try {
      const response = await fetch("/api/caletas/recursos?misRecursos=true");
      if (response.ok) {
        const data = await response.json();
        // Verificar que data.recursos existe y es un array
        if (data.recursos && Array.isArray(data.recursos)) {
          setRecursos(data.recursos);
        } else {
          console.error("Formato de respuesta inesperado:", data);
          setRecursos([]);
        }
      } else {
        throw new Error("Error al cargar recursos");
      }
    } catch (error) {
      console.error("Error fetching recursos:", error);
      toast.error("No se pudieron cargar tus recursos");
      setRecursos([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrar y ordenar recursos
  const filteredAndSortedRecursos = (Array.isArray(recursos) ? recursos : [])
    .filter((recurso) => {
      const matchesSearch = recurso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recurso.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           recurso.materia.nombre.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesTipo = filterTipo === "TODOS" || recurso.tipo === filterTipo;
      return matchesSearch && matchesTipo;
    })
    .sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case "titulo":
          aValue = a.titulo.toLowerCase();
          bValue = b.titulo.toLowerCase();
          break;
        case "materia":
          aValue = a.materia.nombre.toLowerCase();
          bValue = b.materia.nombre.toLowerCase();
          break;
        case "calificacion":
          aValue = a.calificacion;
          bValue = b.calificacion;
          break;
        case "vistas":
          aValue = a.numVistas;
          bValue = b.numVistas;
          break;
        case "descargas":
          aValue = a.numDescargas;
          bValue = b.numDescargas;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Eliminar recurso
  const handleDelete = async (recursoId: string) => {
    try {
      const response = await fetch(`/api/caletas/recursos/${recursoId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("El recurso ha sido eliminado exitosamente");
        fetchRecursos(); // Recargar lista
      } else {
        throw new Error("Error al eliminar el recurso");
      }
    } catch (error) {
      console.error("Error deleting recurso:", error);
      toast.error("No se pudo eliminar el recurso");
    }
  };

  // Obtener icono y color del tipo de recurso
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "DOCUMENTO":
        return <FileText className="w-4 h-4" />;
      case "ANOTACION":
        return <FileText className="w-4 h-4" />;
      case "RESUMEN":
        return <FileText className="w-4 h-4" />;
      case "GUIA_ESTUDIO":
        return <FileText className="w-4 h-4" />;
      case "EJERCICIOS":
        return <FileText className="w-4 h-4" />;
      case "PRESENTACION":
        return <FileText className="w-4 h-4" />;
      case "TIP":
        return <FileText className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "DOCUMENTO":
        return "bg-blue-500/10 text-blue-300 border-blue-500/20";
      case "ANOTACION":
        return "bg-green-500/10 text-green-300 border-green-500/20";
      case "RESUMEN":
        return "bg-purple-500/10 text-purple-300 border-purple-500/20";
      case "GUIA_ESTUDIO":
        return "bg-orange-500/10 text-orange-300 border-orange-500/20";
      case "EJERCICIOS":
        return "bg-red-500/10 text-red-300 border-red-500/20";
      case "PRESENTACION":
        return "bg-pink-500/10 text-pink-300 border-pink-500/20";
      case "TIP":
        return "bg-yellow-500/10 text-yellow-300 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-300 border-gray-500/20";
    }
  };

  const getTipoNombre = (tipo: string) => {
    switch (tipo) {
      case "DOCUMENTO":
        return "Documento";
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
      case "TIP":
        return "Tip/Consejo";
      default:
        return tipo;
    }
  };

  // Evitar renderizado hasta que el componente esté montado
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40C9A9] mx-auto mb-4"></div>
          <p className="text-white/80">Cargando...</p>
        </div>
      </div>
    );
  }

  // Renderizar contenido solo cuando esté montado y no esté cargando
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40C9A9] mx-auto mb-4"></div>
          <p className="text-white/80">Cargando tus recursos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-4 py-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-special text-[#40C9A9] mb-2">Mis Recursos</h1>
              <p className="text-white/70 text-base md:text-lg">
                Gestiona todos los recursos que has compartido
              </p>
            </div>
            <Button
              onClick={() => router.push("/caletas/crear")}
              className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Compartir Nuevo Recurso
            </Button>
          </div>
        </div>

        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-[#354B3A] border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Total Recursos</p>
                  <p className="text-white text-2xl font-bold">{Array.isArray(recursos) ? recursos.length : 0}</p>
                </div>
                <FileText className="w-8 h-8 text-[#40C9A9]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#354B3A] border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Total Vistas</p>
                  <p className="text-white text-2xl font-bold">
                    {Array.isArray(recursos) ? recursos.reduce((sum, r) => sum + r.numVistas, 0) : 0}
                  </p>
                </div>
                <Eye className="w-8 h-8 text-[#40C9A9]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#354B3A] border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Total Descargas</p>
                  <p className="text-white text-2xl font-bold">
                    {Array.isArray(recursos) ? recursos.reduce((sum, r) => sum + r.numDescargas, 0) : 0}
                  </p>
                </div>
                <Download className="w-8 h-8 text-[#40C9A9]" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#354B3A] border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm">Promedio Calificación</p>
                  <p className="text-white text-2xl font-bold">
                    {Array.isArray(recursos) && recursos.length > 0 
                      ? (recursos.reduce((sum, r) => sum + r.calificacion, 0) / recursos.length).toFixed(1)
                      : "0.0"
                    }
                  </p>
                </div>
                <Star className="w-8 h-8 text-[#40C9A9]" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros y búsqueda */}
        <Card className="bg-[#354B3A] border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/50 w-4 h-4" />
                <Input
                  placeholder="Buscar recursos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg pl-10"
                />
              </div>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filtrar por tipo" />
                </SelectTrigger>
                <SelectContent className="bg-[#203324] text-white">
                  <SelectItem value="TODOS" className="hover:bg-[#40C9A9]/10">Todos los tipos</SelectItem>
                  <SelectItem value="DOCUMENTO" className="hover:bg-[#40C9A9]/10">Documento</SelectItem>
                  <SelectItem value="ANOTACION" className="hover:bg-[#40C9A9]/10">Anotación</SelectItem>
                  <SelectItem value="RESUMEN" className="hover:bg-[#40C9A9]/10">Resumen</SelectItem>
                  <SelectItem value="GUIA_ESTUDIO" className="hover:bg-[#40C9A9]/10">Guía de Estudio</SelectItem>
                  <SelectItem value="EJERCICIOS" className="hover:bg-[#40C9A9]/10">Ejercicios</SelectItem>
                  <SelectItem value="PRESENTACION" className="hover:bg-[#40C9A9]/10">Presentación</SelectItem>
                  <SelectItem value="TIP" className="hover:bg-[#40C9A9]/10">Tip/Consejo</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg">
                  <SortAsc className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent className="bg-[#203324] text-white">
                  <SelectItem value="createdAt" className="hover:bg-[#40C9A9]/10">Fecha de creación</SelectItem>
                  <SelectItem value="titulo" className="hover:bg-[#40C9A9]/10">Título</SelectItem>
                  <SelectItem value="materia" className="hover:bg-[#40C9A9]/10">Materia</SelectItem>
                  <SelectItem value="calificacion" className="hover:bg-[#40C9A9]/10">Calificación</SelectItem>
                  <SelectItem value="vistas" className="hover:bg-[#40C9A9]/10">Vistas</SelectItem>
                  <SelectItem value="descargas" className="hover:bg-[#40C9A9]/10">Descargas</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                {sortOrder === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de recursos */}
        {filteredAndSortedRecursos.length === 0 ? (
          <Card className="bg-[#354B3A] border-white/10">
            <CardContent className="p-8 text-center">
              <FileText className="w-16 h-16 text-white/30 mx-auto mb-4" />
              <h3 className="text-white text-lg font-semibold mb-2">
                {Array.isArray(recursos) && recursos.length === 0 ? "No tienes recursos compartidos" : "No se encontraron recursos"}
              </h3>
              <p className="text-white/70 mb-4">
                {Array.isArray(recursos) && recursos.length === 0 
                  ? "Comienza compartiendo tu primer recurso académico"
                  : "Intenta ajustar los filtros de búsqueda"
                }
              </p>
              {Array.isArray(recursos) && recursos.length === 0 && (
                <Button
                  onClick={() => router.push("/caletas/crear")}
                  className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Compartir Primer Recurso
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedRecursos.map((recurso) => (
              <Card key={recurso.id} className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-white text-lg line-clamp-2 mb-2">
                        {recurso.titulo}
                      </CardTitle>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={`text-xs ${getTipoColor(recurso.tipo)}`}>
                          {getTipoIcon(recurso.tipo)}
                          <span className="ml-1">{getTipoNombre(recurso.tipo)}</span>
                        </Badge>
                        <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                          {recurso.esPublico ? "Público" : "Privado"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-white/70 text-sm line-clamp-3 mb-4">
                    {recurso.descripcion}
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Materia:</span>
                      <span className="text-white font-medium">{recurso.materia.nombre}</span>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Calificación:</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-white">{recurso.calificacion.toFixed(1)}</span>
                        <span className="text-white/50">({recurso.numCalificaciones})</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Vistas:</span>
                      <div className="flex items-center gap-1">
                        <Eye className="w-3 h-3 text-white/60" />
                        <span className="text-white">{recurso.numVistas}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Descargas:</span>
                      <div className="flex items-center gap-1">
                        <Download className="w-3 h-3 text-white/60" />
                        <span className="text-white">{recurso.numDescargas}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Creado:</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-white/60" />
                        <span className="text-white">
                          {formatDate(recurso.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-white/10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => router.push(`/caletas/${recurso.id}`)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => router.push(`/caletas/editar/${recurso.id}`)}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-500/10 border-red-500/20 text-red-300 hover:bg-red-500/20"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="bg-[#203324] border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white">¿Eliminar recurso?</AlertDialogTitle>
                          <AlertDialogDescription className="text-white/70">
                            Esta acción no se puede deshacer. El recurso será eliminado permanentemente.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                            Cancelar
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(recurso.id)}
                            className="bg-red-500 hover:bg-red-600 text-white"
                          >
                            Eliminar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 