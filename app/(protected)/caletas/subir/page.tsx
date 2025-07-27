"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Upload, FileText, BookOpen, GraduationCap } from "lucide-react";
import { auth } from "@/auth";

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

export default function SubirCaletaPage() {
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [selectedUniversidad, setSelectedUniversidad] = useState<string>("");
  const [selectedCarrera, setSelectedCarrera] = useState<string>("");
  const [selectedMateria, setSelectedMateria] = useState<string>("");
  const [nombre, setNombre] = useState("");
  const [tema, setTema] = useState("");
  const [archivo, setArchivo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const { toast } = useToast();
  const router = useRouter();

  // Cargar universidades al montar el componente
  useEffect(() => {
    const cargarUniversidades = async () => {
      try {
        const response = await fetch("/api/universidades");
        if (response.ok) {
          const data = await response.json();
          setUniversidades(data);
        }
      } catch (error) {
        console.error("Error cargando universidades:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las universidades",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    cargarUniversidades();
  }, [toast]);

  // Cargar carreras cuando se selecciona una universidad
  useEffect(() => {
    if (selectedUniversidad) {
      const universidad = universidades.find(u => u.id === selectedUniversidad);
      if (universidad) {
        setCarreras(universidad.carreras);
        setSelectedCarrera("");
        setSelectedMateria("");
        setMaterias([]);
      }
    } else {
      setCarreras([]);
      setMaterias([]);
    }
  }, [selectedUniversidad, universidades]);

  // Cargar materias cuando se selecciona una carrera
  useEffect(() => {
    if (selectedCarrera) {
      const carrera = carreras.find(c => c.id === selectedCarrera);
      if (carrera) {
        setMaterias(carrera.materias);
        setSelectedMateria("");
      }
    } else {
      setMaterias([]);
    }
  }, [selectedCarrera, carreras]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos PDF, JPG, JPEG y PNG",
          variant: "destructive",
        });
        return;
      }
      
      // Validar tamaño (máximo 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Archivo demasiado grande",
          description: "El archivo no puede superar los 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setArchivo(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!archivo || !selectedMateria || !nombre || !tema) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("tema", tema);
      formData.append("materiaId", selectedMateria);
      formData.append("archivo", archivo);

      const response = await fetch("/api/caletas", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "¡Caleta subida exitosamente!",
          description: "Tu caleta ha sido guardada y está disponible para otros estudiantes",
        });
        router.push("/caletas");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Error al subir la caleta");
      }
    } catch (error) {
      console.error("Error subiendo caleta:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir la caleta",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40C9A9] mx-auto mb-4"></div>
          <p className="text-white/80">Cargando universidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-2">
      <div className="w-full max-w-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-special text-[#40C9A9] mb-2">Subir Caleta</h1>
          <p className="text-white/70 text-base md:text-lg">
            Comparte tus apuntes, exámenes y materiales de estudio con otros estudiantes
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#354B3A] border border-white/10 rounded-2xl shadow-xl p-6 md:p-10 space-y-6">
          {/* Información básica */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="nombre" className="text-white/80">Nombre de la caleta *</Label>
              <Input
                id="nombre"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Examen parcial de Cálculo I"
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
              />
            </div>
            <div>
              <Label htmlFor="tema" className="text-white/80">Tema o descripción *</Label>
              <Textarea
                id="tema"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Describe brevemente el contenido de la caleta"
                rows={3}
                required
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
              />
            </div>
          </div>

          {/* Selección de universidad, carrera y materia */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="universidad" className="text-white/80">Universidad</Label>
              <Select value={selectedUniversidad} onValueChange={setSelectedUniversidad}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1">
                  <SelectValue placeholder="Selecciona una universidad" />
                </SelectTrigger>
                <SelectContent className="bg-[#203324] text-white">
                  {universidades.map((universidad) => (
                    <SelectItem key={universidad.id} value={universidad.id} className="hover:bg-[#40C9A9]/10">
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-[#40C9A9]" />
                        {universidad.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="carrera" className="text-white/80">Carrera</Label>
              <Select value={selectedCarrera} onValueChange={setSelectedCarrera} disabled={!selectedUniversidad}>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1 disabled:opacity-50">
                  <SelectValue placeholder="Selecciona una carrera" />
                </SelectTrigger>
                <SelectContent className="bg-[#203324] text-white">
                  {carreras.map((carrera) => (
                    <SelectItem key={carrera.id} value={carrera.id} className="hover:bg-[#40C9A9]/10">
                      <BookOpen className="h-4 w-4 text-[#40C9A9] mr-1" />
                      {carrera.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="materia" className="text-white/80">Materia *</Label>
              <Select value={selectedMateria} onValueChange={setSelectedMateria} disabled={!selectedCarrera} required>
                <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1 disabled:opacity-50">
                  <SelectValue placeholder="Selecciona una materia" />
                </SelectTrigger>
                <SelectContent className="bg-[#203324] text-white">
                  {materias.map((materia) => (
                    <SelectItem key={materia.id} value={materia.id} className="hover:bg-[#40C9A9]/10">
                      <FileText className="h-4 w-4 text-[#40C9A9] mr-1" />
                      {materia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Subir archivo */}
          <div className="space-y-2">
            <Label htmlFor="archivo" className="text-white/80">Archivo (PDF, JPG, PNG) *</Label>
            <Input
              id="archivo"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              required
              className="bg-white/10 border-white/20 text-white file:text-white file:bg-[#40C9A9] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
            />
            {archivo && (
              <div className="text-[#40C9A9] text-sm mt-1">Archivo seleccionado: {archivo.name}</div>
            )}
          </div>

          {/* Botón enviar */}
          <Button
            type="submit"
            className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold text-lg py-3 rounded-xl mt-2 shadow-lg transition-colors"
            disabled={isLoading}
          >
            {isLoading ? "Subiendo..." : "Subir Caleta"}
          </Button>
        </form>
      </div>
    </div>
  );
} 