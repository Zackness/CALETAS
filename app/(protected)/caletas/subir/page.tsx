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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando universidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl bg-gradient-to-t from-mygreen to-mygreen-light min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-2">Subir Caleta</h1>
        <p className="text-muted-foreground text-center">
          Comparte tus apuntes, exámenes y materiales de estudio con otros estudiantes
        </p>
      </div>

      <Card className="bg-[#354B3A] text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Nueva Caleta
          </CardTitle>
          <CardDescription>
            Completa la información de tu caleta para que otros estudiantes puedan encontrarla
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="nombre">Nombre de la caleta *</Label>
                <Input
                  id="nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Ej: Examen parcial de Cálculo I"
                  required
                />
              </div>

              <div>
                <Label htmlFor="tema">Tema o descripción *</Label>
                <Textarea
                  id="tema"
                  value={tema}
                  onChange={(e) => setTema(e.target.value)}
                  placeholder="Describe brevemente el contenido de la caleta"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Selección de universidad, carrera y materia */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="universidad">Universidad</Label>
                <Select value={selectedUniversidad} onValueChange={setSelectedUniversidad}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una universidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {universidades.map((universidad) => (
                      <SelectItem key={universidad.id} value={universidad.id}>
                        <div className="flex items-center gap-2">
                          <GraduationCap className="h-4 w-4" />
                          {universidad.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="carrera">Carrera</Label>
                <Select 
                  value={selectedCarrera} 
                  onValueChange={setSelectedCarrera}
                  disabled={!selectedUniversidad}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una carrera" />
                  </SelectTrigger>
                  <SelectContent>
                    {carreras.map((carrera) => (
                      <SelectItem key={carrera.id} value={carrera.id}>
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          {carrera.nombre}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="materia">Materia *</Label>
                <Select 
                  value={selectedMateria} 
                  onValueChange={setSelectedMateria}
                  disabled={!selectedCarrera}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una materia" />
                  </SelectTrigger>
                  <SelectContent>
                    {materias.map((materia) => (
                      <SelectItem key={materia.id} value={materia.id}>
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

            {/* Subida de archivo */}
            <div>
              <Label htmlFor="archivo">Archivo *</Label>
              <div className="mt-2">
                <Input
                  id="archivo"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  required
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Formatos permitidos: PDF, JPG, JPEG, PNG. Máximo 10MB.
                </p>
                {archivo && (
                  <div className="mt-2 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">Archivo seleccionado:</p>
                    <p className="text-sm text-muted-foreground">
                      {archivo.name} ({(archivo.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1">
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Subir Caleta
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 