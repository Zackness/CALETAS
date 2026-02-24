"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Edit, ArrowLeft, Save, FileText, BookOpen, GraduationCap } from "lucide-react";

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

interface Recurso {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: string;
  contenido: string;
  archivoUrl: string | null;
  esAnonimo?: boolean;
  tags: string | null;
  materiaId: string;
  materia: {
    id: string;
    nombre: string;
    codigo: string;
  };
}

export default function EditarRecursoPage({ params }: { params: Promise<{ id: string }> }) {
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [selectedUniversidad, setSelectedUniversidad] = useState<string>("");
  const [selectedCarrera, setSelectedCarrera] = useState<string>("");
  const [selectedMateria, setSelectedMateria] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<string>("DOCUMENTO");
  const [tags, setTags] = useState("");
  const [esAnonimo, setEsAnonimo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [recurso, setRecurso] = useState<Recurso | null>(null);
  const [recursoId, setRecursoId] = useState<string>("");
  
  const { toast } = useToast();
  const router = useRouter();

  // Resolver params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setRecursoId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Cargar datos iniciales
  useEffect(() => {
    if (!recursoId) return;
    
    const cargarDatos = async () => {
      try {
        // Cargar universidades
        const universidadesResponse = await fetch("/api/universidades");
        if (universidadesResponse.ok) {
          const universidadesData = await universidadesResponse.json();
          setUniversidades(universidadesData);
        }

        // Cargar recurso
        const recursoResponse = await fetch(`/api/caletas/recursos/${recursoId}`);
        if (recursoResponse.ok) {
          const recursoData = await recursoResponse.json();
          setRecurso(recursoData);
          setTitulo(recursoData.titulo);
          setDescripcion(recursoData.descripcion);
          setTipo(recursoData.tipo);
          setTags(recursoData.tags || "");
          setEsAnonimo(!!recursoData.esAnonimo);
          setSelectedMateria(recursoData.materiaId);
        } else {
          throw new Error("Recurso no encontrado");
        }
      } catch (error) {
        console.error("Error cargando datos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos del recurso",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    cargarDatos();
  }, [recursoId, toast]);

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

  // Encontrar la universidad y carrera del recurso actual
  useEffect(() => {
    if (recurso && universidades.length > 0) {
      for (const universidad of universidades) {
        for (const carrera of universidad.carreras) {
          const materia = carrera.materias.find(m => m.id === recurso.materiaId);
          if (materia) {
            setSelectedUniversidad(universidad.id);
            setSelectedCarrera(carrera.id);
            break;
          }
        }
      }
    }
  }, [recurso, universidades]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedMateria || !titulo || !descripcion) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/caletas/recursos/${recursoId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          titulo,
          descripcion,
          tipo,
          materiaId: selectedMateria,
          tags,
          esAnonimo,
          contenido: descripcion,
        }),
      });

      if (response.ok) {
        toast({
          title: "¡Recurso actualizado exitosamente!",
          description: "Los cambios han sido guardados",
        });
        router.push("/caletas/mis-recursos");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Error al actualizar el recurso");
      }
    } catch (error) {
      console.error("Error updating recurso:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al actualizar el recurso",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#40C9A9] mx-auto mb-4"></div>
          <p className="text-white/80">Cargando recurso...</p>
        </div>
      </div>
    );
  }

  if (!recurso) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
        <div className="text-center">
          <p className="text-white/80">Recurso no encontrado</p>
          <Button
            onClick={() => router.push("/caletas/mis-recursos")}
            className="mt-4 bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
          >
            Volver a Mis Recursos
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              onClick={() => router.push("/caletas/mis-recursos")}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
          <h1 className="text-3xl md:text-4xl font-special text-[#40C9A9] mb-2">Editar Recurso</h1>
          <p className="text-white/70 text-base md:text-lg">
            Modifica la información de tu recurso académico
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información básica */}
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Edit className="w-5 h-5 text-[#40C9A9]" />
                Información del Recurso
              </CardTitle>
              <CardDescription className="text-white/70">
                Datos principales del recurso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="titulo" className="text-white/80">Título del recurso *</Label>
                <Input
                  id="titulo"
                  value={titulo}
                  onChange={(e) => setTitulo(e.target.value)}
                  placeholder="Ej: Examen parcial de Cálculo I"
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                />
              </div>
              <div>
                <Label htmlFor="descripcion" className="text-white/80">Descripción *</Label>
                <Textarea
                  id="descripcion"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe brevemente el contenido del recurso"
                  rows={3}
                  required
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo" className="text-white/80">Tipo de recurso *</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1">
                      <SelectValue placeholder="Selecciona el tipo de recurso" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#203324] text-white">
                      <SelectItem value="DOCUMENTO" className="hover:bg-[#40C9A9]/10">Documento</SelectItem>
                      <SelectItem value="ANOTACION" className="hover:bg-[#40C9A9]/10">Anotación</SelectItem>
                      <SelectItem value="RESUMEN" className="hover:bg-[#40C9A9]/10">Resumen</SelectItem>
                      <SelectItem value="GUIA_ESTUDIO" className="hover:bg-[#40C9A9]/10">Guía de Estudio</SelectItem>
                      <SelectItem value="EJERCICIOS" className="hover:bg-[#40C9A9]/10">Ejercicios</SelectItem>
                      <SelectItem value="PRESENTACION" className="hover:bg-[#40C9A9]/10">Presentación</SelectItem>
                      <SelectItem value="TIP" className="hover:bg-[#40C9A9]/10">Tip/Consejo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="tags" className="text-white/80">Tags (opcional)</Label>
                  <Input
                    id="tags"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Ej: examen, parcial, calculo, derivadas"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selección de materia */}
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <BookOpen className="w-5 h-5 text-[#40C9A9]" />
                Materia Asociada
              </CardTitle>
              <CardDescription className="text-white/70">
                Selecciona la materia a la que pertenece este recurso
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            </CardContent>
          </Card>

          {/* Privacidad */}
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <FileText className="w-5 h-5 text-[#40C9A9]" />
                Privacidad
              </CardTitle>
              <CardDescription className="text-white/70">
                Puedes mostrar tu usuario o publicarlo como anónimo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between rounded-lg p-4 bg-white/5 border border-white/10">
                <div className="space-y-1">
                  <Label className="text-white/80">Publicar como anónimo</Label>
                  <p className="text-white/60 text-sm">
                    Si lo activas, los demás verán “Anónimo” como autor
                  </p>
                </div>
                <Switch 
                  checked={esAnonimo}
                  onCheckedChange={setEsAnonimo}
                  className="data-[state=checked]:bg-[#40C9A9] data-[state=unchecked]:bg-white/20"
                />
              </div>
            </CardContent>
          </Card>

          {/* Botón de guardar */}
          <Button
            type="submit"
            className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </div>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                Guardar Cambios
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
} 