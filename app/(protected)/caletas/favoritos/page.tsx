"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Heart, 
  Download, 
  FileText, 
  BookOpen, 
  GraduationCap,
  Eye,
  Calendar,
  User,
  ArrowLeft
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

export default function FavoritosPage() {
  const [caletas, setCaletas] = useState<Caleta[]>([]);
  const [filteredCaletas, setFilteredCaletas] = useState<Caleta[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  // Cargar caletas favoritas al montar el componente
  useEffect(() => {
    const cargarFavoritos = async () => {
      try {
        const response = await fetch("/api/caletas");
        if (response.ok) {
          const data = await response.json();
          // Filtrar solo las caletas que son favoritas
          const favoritas = data.filter((caleta: Caleta) => caleta.isFavorita);
          setCaletas(favoritas);
          setFilteredCaletas(favoritas);
        }
      } catch (error) {
        console.error("Error cargando favoritos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar tus favoritos",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    cargarFavoritos();
  }, [toast]);

  // Filtrar caletas cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = caletas.filter(caleta =>
        caleta.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caleta.tema.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caleta.materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        caleta.materia.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCaletas(filtered);
    } else {
      setFilteredCaletas(caletas);
    }
  }, [caletas, searchTerm]);

  const toggleFavorito = async (caletaId: string) => {
    setIsLoadingFavorites(caletaId);
    
    try {
      const response = await fetch(`/api/caletas/${caletaId}/favorito`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remover la caleta de la lista local
        setCaletas(prev => prev.filter(c => c.id !== caletaId));
        
        toast({
          title: "Removida de favoritos",
          description: "La caleta ha sido removida de tus favoritos",
        });
      } else {
        throw new Error("Error al remover de favoritos");
      }
    } catch (error) {
      console.error("Error removiendo favorito:", error);
      toast({
        title: "Error",
        description: "No se pudo remover de favoritos",
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
          <p>Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 bg-gradient-to-t from-mygreen to-mygreen-light min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold mb-2">Mis Favoritos</h1>
              <p className="text-muted-foreground">
                Tus caletas guardadas para acceso rápido
              </p>
            </div>
          </div>
          <Button onClick={() => router.push("/caletas")} variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Ver Todas las Caletas
          </Button>
        </div>

        {/* Búsqueda */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Buscar en favoritos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar en tus favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resultados */}
      <div className="mb-4">
        <p className="text-muted-foreground">
          {filteredCaletas.length} caleta{filteredCaletas.length !== 1 ? 's' : ''} favorita{filteredCaletas.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Lista de caletas favoritas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCaletas.map((caleta) => (
          <Card key={caleta.id} className="hover:shadow-lg transition-shadow border-2 border-[#203324] bg-[#354B3A] text-white">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2 line-clamp-2">{caleta.nombre}</CardTitle>
                  <CardDescription className="line-clamp-2">{caleta.tema}</CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorito(caleta.id)}
                  disabled={isLoadingFavorites === caleta.id}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  {isLoadingFavorites === caleta.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  ) : (
                    <Heart className="h-4 w-4 fill-current" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {/* Información del archivo */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-2xl">{getFileIcon(caleta.tipoArchivo)}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium">{caleta.tipoArchivo.toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(caleta.tamanio)}</p>
                </div>
              </div>

              {/* Materia y carrera */}
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">{caleta.materia.codigo} - {caleta.materia.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{caleta.materia.carrera.nombre}</span>
                </div>
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{caleta.materia.carrera.universidad.nombre}</span>
                </div>
              </div>

              {/* Información del usuario y fecha */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <User className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{caleta.usuario.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">{formatDate(caleta.createdAt)}</span>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => window.open(caleta.urlArchivo, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Ver
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
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
        <Card className="text-center py-12">
          <CardContent>
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? "No se encontraron favoritos" : "No tienes favoritos aún"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? "Intenta ajustar tu búsqueda"
                : "Explora las caletas disponibles y agrega las que te interesen a tus favoritos"
              }
            </p>
            <Button onClick={() => router.push("/caletas")}>
              <FileText className="h-4 w-4 mr-2" />
              Explorar Caletas
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 