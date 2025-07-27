"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Filter, 
  Heart, 
  HeartOff, 
  Download, 
  FileText, 
  BookOpen, 
  GraduationCap,
  Upload,
  Eye,
  Calendar,
  User
} from "lucide-react";

interface Caleta {
  id: string;
  nombre: string;
  tema: string;
  urlArchivo: string;
  tipoArchivo: string;
  tamanio: number;
  createdAt: string;
  isFavorita: boolean;
  usuario: {
    id: string;
    name: string;
    image: string;
  };
  materia: {
    id: string;
    nombre: string;
    codigo: string;
    carrera: {
      id: string;
      nombre: string;
      universidad: {
        id: string;
        nombre: string;
      };
    };
  };
}

interface Universidad {
  id: string;
  nombre: string;
  carreras: Carrera[];
}

interface Carrera {
  id: string;
  nombre: string;
  materias: Materia[];
}

interface Materia {
  id: string;
  nombre: string;
  codigo: string;
}

export default function CaletasPage() {
  const [caletas, setCaletas] = useState<Caleta[]>([]);
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [filteredCaletas, setFilteredCaletas] = useState<Caleta[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUniversidad, setSelectedUniversidad] = useState<string>("all");
  const [selectedCarrera, setSelectedCarrera] = useState<string>("all");
  const [selectedMateria, setSelectedMateria] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  // Cargar caletas y universidades al montar el componente
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [caletasResponse, universidadesResponse] = await Promise.all([
          fetch("/api/caletas"),
          fetch("/api/universidades")
        ]);

        if (caletasResponse.ok && universidadesResponse.ok) {
          const [caletasData, universidadesData] = await Promise.all([
            caletasResponse.json(),
            universidadesResponse.json()
          ]);
          
          setCaletas(caletasData);
          setFilteredCaletas(caletasData);
          setUniversidades(universidadesData);
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las caletas",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    cargarDatos();
  }, [toast]);

  // Cargar carreras cuando se selecciona una universidad
  useEffect(() => {
    if (selectedUniversidad !== "all") {
      const universidad = universidades.find(u => u.id === selectedUniversidad);
      if (universidad) {
        setCarreras(universidad.carreras);
        setSelectedCarrera("all");
        setSelectedMateria("all");
        setMaterias([]);
      }
    } else {
      setCarreras([]);
      setMaterias([]);
    }
  }, [selectedUniversidad, universidades]);

  // Cargar materias cuando se selecciona una carrera
  useEffect(() => {
    if (selectedCarrera !== "all") {
      const carrera = carreras.find(c => c.id === selectedCarrera);
      if (carrera) {
        setMaterias(carrera.materias);
        setSelectedMateria("all");
      }
    } else {
      setMaterias([]);
    }
  }, [selectedCarrera, carreras]);

  // Filtrar caletas cuando cambian los filtros
  useEffect(() => {
    let filtered = caletas;

    // Filtro por búsqueda
    if (searchTerm) {
      filtered = filtered.filter(caleta =>
        caleta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caleta.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caleta.materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caleta.materia.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por universidad
    if (selectedUniversidad !== "all") {
      filtered = filtered.filter(caleta =>
        caleta.materia.carrera.universidad.id === selectedUniversidad
      );
    }

    // Filtro por carrera
    if (selectedCarrera !== "all") {
      filtered = filtered.filter(caleta =>
        caleta.materia.carrera.id === selectedCarrera
      );
    }

    // Filtro por materia
    if (selectedMateria !== "all") {
      filtered = filtered.filter(caleta =>
        caleta.materia.id === selectedMateria
      );
    }

    setFilteredCaletas(filtered);
  }, [caletas, searchTerm, selectedUniversidad, selectedCarrera, selectedMateria]);

  const toggleFavorito = async (caletaId: string) => {
    setIsLoadingFavorites(caletaId);
    
    try {
      const caleta = caletas.find(c => c.id === caletaId);
      const isFavorita = caleta?.isFavorita;
      
      const response = await fetch(`/api/caletas/${caletaId}/favorito`, {
        method: isFavorita ? "DELETE" : "POST",
      });

      if (response.ok) {
        setCaletas(prev => prev.map(c => 
          c.id === caletaId 
            ? { ...c, isFavorita: !c.isFavorita }
            : c
        ));
        
        toast({
          title: isFavorita ? "Removida de favoritos" : "Agregada a favoritos",
          description: isFavorita 
            ? "La caleta ha sido removida de tus favoritos"
            : "La caleta ha sido agregada a tus favoritos",
        });
      } else {
        throw new Error("Error al actualizar favoritos");
      }
    } catch (error) {
      console.error("Error toggleando favorito:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el favorito",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFavorites(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const getFileIcon = (tipoArchivo: string) => {
    if (tipoArchivo.includes("pdf")) return "📄";
    if (tipoArchivo.includes("image")) return "🖼️";
    return "📎";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando caletas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 space-y-6 bg-gradient-to-t from-mygreen to-mygreen-light">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-special text-white">📚 Caletas</h1>
        <p className="text-white/70">
              Encuentra y comparte materiales de estudio con otros estudiantes
            </p>
          </div>

      {/* Acción rápida */}
      <div className="flex justify-end">
          <Button 
            onClick={() => router.push("/caletas/subir")} 
          className="bg-[#40C9A9] hover:bg-[#3AB89A] text-white border-0 shadow-lg"
          >
          <Upload className="h-5 w-5 mr-2" />
            Subir Caleta
          </Button>
        </div>

        {/* Filtros */}
        <Card className="bg-[#354B3A] border-white/10 text-white shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white font-special">
              <Filter className="h-5 w-5 text-[#40C9A9]" />
              FILTROS DE BÚSQUEDA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Búsqueda */}
              <div>
                <Label htmlFor="search" className="text-white/70 font-medium">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
                  <Input
                    id="search"
                    placeholder="Buscar caletas..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:bg-white/20 focus:border-[#40C9A9]"
                  />
                </div>
              </div>

              {/* Universidad */}
              <div>
                <Label htmlFor="universidad" className="text-white/70">Universidad</Label>
                <Select value={selectedUniversidad} onValueChange={setSelectedUniversidad}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9]">
                    <SelectValue placeholder="Todas las universidades" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#354B3A] border-white/10">
                    <SelectItem value="all" className="text-white hover:bg-white/10">Todas las universidades</SelectItem>
                    {universidades.map((universidad) => (
                      <SelectItem key={universidad.id} value={universidad.id} className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          {universidad.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Carrera */}
              <div>
                <Label htmlFor="carrera" className="text-white/70">Carrera</Label>
                <Select 
                  value={selectedCarrera} 
                  onValueChange={setSelectedCarrera}
                  disabled={!selectedUniversidad}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9] disabled:opacity-50">
                    <SelectValue placeholder="Todas las carreras" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#354B3A] border-white/10">
                    <SelectItem value="all" className="text-white hover:bg-white/10">Todas las carreras</SelectItem>
                    {carreras.map((carrera) => (
                      <SelectItem key={carrera.id} value={carrera.id} className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {carrera.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Materia */}
              <div>
                <Label htmlFor="materia" className="text-white/70">Materia</Label>
                <Select 
                  value={selectedMateria} 
                  onValueChange={setSelectedMateria}
                  disabled={!selectedCarrera}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9] disabled:opacity-50">
                    <SelectValue placeholder="Todas las materias" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#354B3A] border-white/10">
                    <SelectItem value="all" className="text-white hover:bg-white/10">Todas las materias</SelectItem>
                    {materias.map((materia) => (
                      <SelectItem key={materia.id} value={materia.id} className="text-white hover:bg-white/10">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          {materia.codigo} - {materia.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      

      {/* Resultados */}
      <div className="mb-4">
        <p className="text-white/70">
          {filteredCaletas.length} caleta{filteredCaletas.length !== 1 ? 's' : ''} encontrada{filteredCaletas.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lista de caletas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCaletas.map((caleta) => (
          <Card key={caleta.id} className="bg-[#354B3A] border-white/10 text-white hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 line-clamp-2 text-white">{caleta.nombre}</CardTitle>
                  <CardDescription className="line-clamp-2 text-white/70">{caleta.tema}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorito(caleta.id)}
                  disabled={isLoadingFavorites === caleta.id}
                  className="ml-2 text-white hover:bg-white/10"
                >
                  {isLoadingFavorites === caleta.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#40C9A9]"></div>
                  ) : caleta.isFavorita ? (
                    <Heart className="h-4 w-4 text-red-400 fill-current" />
                  ) : (
                    <Heart className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Información del archivo */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{getFileIcon(caleta.tipoArchivo)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-white">{caleta.tipoArchivo.toUpperCase()}</p>
                  <p className="text-xs text-white/70">{formatFileSize(caleta.tamanio)}</p>
                </div>
              </div>

              {/* Materia y carrera */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-white/50" />
                  <span className="text-sm font-medium text-white">{caleta.materia.codigo} - {caleta.materia.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3 text-white/50" />
                  <span className="text-sm text-white/70">{caleta.materia.carrera.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3 w-3 text-white/50" />
                  <span className="text-sm text-white/70">{caleta.materia.carrera.universidad.nombre}</span>
                </div>
              </div>

              {/* Información del usuario y fecha */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-white/50" />
                  <span className="text-xs text-white/70">{caleta.usuario.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-white/50" />
                  <span className="text-xs text-white/70">{formatDate(caleta.createdAt)}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                  onClick={() => window.open(caleta.urlArchivo, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9] hover:text-white"
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = caleta.urlArchivo;
                    link.download = caleta.nombre;
                    link.click();
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Descargar
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vacío */}
      {filteredCaletas.length === 0 && !isLoading && (
        <Card className="text-center py-12 bg-[#354B3A] border-white/10 text-white">
          <CardContent>
            <FileText className="h-12 w-12 text-white/30 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-white">No se encontraron caletas</h3>
            <p className="text-white/70 mb-4">
              {searchTerm || selectedUniversidad !== "all" || selectedCarrera !== "all" || selectedMateria !== "all"
                ? "Intenta ajustar los filtros de búsqueda"
                : "Sé el primero en subir una caleta"}
            </p>
            <Button 
              onClick={() => router.push("/caletas/subir")}
              className="bg-[#40C9A9] hover:bg-[#3AB89A] text-white"
            >
              <Upload className="h-4 w-4 mr-2" />
              Subir Caleta
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 