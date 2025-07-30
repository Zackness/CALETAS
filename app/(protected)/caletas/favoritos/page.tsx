"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Heart, 
  FileText, 
  BookOpen, 
  GraduationCap,
  Calendar,
  User,
  ArrowLeft
} from "lucide-react";

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  archivoUrl?: string;
  createdAt: string;
  esFavorito: boolean;
  autor: {
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
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [filteredRecursos, setFilteredRecursos] = useState<Recurso[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState<string | null>(null);
  
  const { toast } = useToast();
  const router = useRouter();

  // Cargar recursos favoritos al montar el componente
  useEffect(() => {
    const cargarFavoritos = async () => {
      try {
        const response = await fetch("/api/caletas/recursos?favoritos=true");
        if (response.ok) {
          const data = await response.json();
          setRecursos(data);
          setFilteredRecursos(data);
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

  // Filtrar recursos cuando cambia el término de búsqueda
  useEffect(() => {
    if (searchTerm) {
      const filtered = recursos.filter(recurso =>
        recurso.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recurso.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recurso.materia.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recurso.materia.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredRecursos(filtered);
    } else {
      setFilteredRecursos(recursos);
    }
  }, [recursos, searchTerm]);

  const toggleFavorito = async (recursoId: string) => {
    setIsLoadingFavorites(recursoId);
    
    try {
      const response = await fetch(`/api/caletas/recursos/${recursoId}/favorito`, {
        method: "DELETE",
      });

      if (response.ok) {
        // Remover el recurso de la lista local
        setRecursos(prev => prev.filter(r => r.id !== recursoId));
        
        toast({
          title: "Removido de favoritos",
          description: "El recurso ha sido removido de tus favoritos",
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40C9A9] mx-auto mb-4"></div>
          <p className="text-white/80">Cargando favoritos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-2">
      <div className="w-full max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-white hover:bg-white/10 cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <div>
                <h1 className="text-3xl md:text-4xl font-special text-[#40C9A9] mb-2">Mis Favoritos</h1>
                <p className="text-white/70 text-base md:text-lg">
                  Tus recursos guardados para acceso rápido
                </p>
              </div>
            </div>
            <Button onClick={() => router.push("/recursos")} variant="outline" className="border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9]/10 cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              Ver Todas las Caletas
            </Button>
          </div>

          {/* Búsqueda */}
          <div className="bg-[#354B3A] border border-white/10 rounded-2xl shadow-xl p-4 md:p-6 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="h-5 w-5 text-[#40C9A9]" />
              <span className="font-special text-lg text-[#40C9A9]">Buscar en favoritos</span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/50" />
              <Input
                placeholder="Buscar en tus favoritos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Resultados */}
        <div className="mb-4">
          <p className="text-[#40C9A9] font-bold">
            {filteredRecursos.length} recurso{filteredRecursos.length !== 1 ? 's' : ''} favorito{filteredRecursos.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Lista de recursos favoritos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecursos.map((recurso) => (
            <div key={recurso.id} className="bg-[#354B3A] border border-white/10 rounded-2xl shadow-xl p-4 flex flex-col justify-between text-white hover:shadow-2xl transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h2 className="text-lg font-special text-[#40C9A9] mb-1 line-clamp-2">{recurso.titulo}</h2>
                  <p className="text-white/70 text-sm line-clamp-2 mb-1">{recurso.descripcion}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleFavorito(recurso.id)}
                  disabled={isLoadingFavorites === recurso.id}
                  className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                >
                  {isLoadingFavorites === recurso.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                  ) : (
                    <Heart className="h-4 w-4 fill-current" />
                  )}
                </Button>
              </div>
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center gap-2 text-white/80 text-xs">
                  <BookOpen className="h-4 w-4 text-[#40C9A9]" />
                  <span>{recurso.materia.nombre}</span>
                  <span className="text-white/40">|</span>
                  <GraduationCap className="h-4 w-4 text-[#40C9A9]" />
                  <span>{recurso.materia.carrera.nombre}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80 text-xs">
                  <User className="h-4 w-4 text-[#40C9A9]" />
                  <span>{recurso.autor.name}</span>
                  <span className="text-white/40">|</span>
                  <Calendar className="h-4 w-4 text-[#40C9A9]" />
                  <span>{formatDate(recurso.createdAt)}</span>
                </div>
              </div>
              {recurso.archivoUrl && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl">{getFileIcon(recurso.tipo)}</span>
                  <a
                    href={recurso.archivoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-[#40C9A9] hover:underline text-sm font-bold cursor-pointer"
                  >
                    Ver archivo
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 