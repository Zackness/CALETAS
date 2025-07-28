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
import { Upload, FileText, BookOpen, GraduationCap, Shield, AlertTriangle, CheckCircle } from "lucide-react";
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
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<string>("DOCUMENTO");
  const [tags, setTags] = useState("");
  const [esPublico, setEsPublico] = useState(true);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [fileKey, setFileKey] = useState(0); // Key única para forzar re-renderizado
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [moderacionEstado, setModeracionEstado] = useState<'pendiente' | 'verificando' | 'aprobado' | 'rechazado'>('pendiente');
  const [moderacionMensaje, setModeracionMensaje] = useState("");
  
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log("🔄 Archivo seleccionado:", file?.name, "Tipo:", file?.type, "Tamaño:", file?.size);
    
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
      setFileKey(prevKey => prevKey + 1); // Incrementar key para forzar re-renderizado
      
      // Análisis automático del contenido
      setModeracionEstado('verificando');
      setModeracionMensaje("Analizando contenido del archivo...");
      
      console.log("🔍 Iniciando análisis de contenido para:", file.name);
      
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("titulo", titulo);
        formData.append("descripcion", descripcion);

        const response = await fetch("/api/ia/analizar-contenido", {
          method: "POST",
          body: formData,
        });

        if (response.ok) {
          const resultado = await response.json();
          console.log("✅ Resultado del análisis:", resultado);
          
          if (resultado.esApropiado) {
            setModeracionEstado('aprobado');
            setModeracionMensaje("✅ Contenido aprobado: " + resultado.razon);
          } else {
            setModeracionEstado('rechazado');
            setModeracionMensaje("❌ Contenido rechazado: " + resultado.razon);
          }
        } else {
          const error = await response.json();
          console.error("❌ Error en análisis:", error);
          setModeracionEstado('rechazado');
          setModeracionMensaje("Error en análisis: " + (error.error || "Error desconocido"));
        }
      } catch (error) {
        console.error("❌ Error en análisis automático:", error);
        setModeracionEstado('rechazado');
        setModeracionMensaje("Error al analizar el contenido");
      }
    } else {
      console.log("⚠️ No se seleccionó ningún archivo");
      setArchivo(null);
      setModeracionEstado('verificando');
      setModeracionMensaje("Selecciona un archivo para analizar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!archivo || !selectedMateria || !titulo || !descripcion) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    // Verificar que el contenido fue aprobado
    if (moderacionEstado !== 'aprobado') {
      toast({
        title: "Contenido no aprobado",
        description: "El contenido debe ser aprobado antes de subir",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("descripcion", descripcion);
      formData.append("tipo", tipo);
      formData.append("materiaId", selectedMateria);
      formData.append("tags", tags);
      formData.append("esPublico", esPublico.toString());
      formData.append("file", archivo);

      const response = await fetch("/api/caletas/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "¡Recurso subido exitosamente!",
          description: "Tu recurso ha sido verificado y está disponible para otros estudiantes",
        });
        router.push("/caletas");
      } else {
        const error = await response.json();
        throw new Error(error.error || "Error al subir el recurso");
      }
    } catch (error) {
      console.error("Error subiendo recurso:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al subir el recurso",
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
          <h1 className="text-3xl md:text-4xl font-special text-[#40C9A9] mb-2">Compartir Recurso</h1>
          <p className="text-white/70 text-base md:text-lg">
            Comparte tus apuntes, exámenes y materiales de estudio con otros estudiantes
          </p>
        </div>
        <form onSubmit={handleSubmit} className="bg-[#354B3A] border border-white/10 rounded-2xl shadow-xl p-6 md:p-10 space-y-6">
          {/* Aviso de moderación */}
          <div className="bg-[#1C2D20] border border-[#40C9A9]/20 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#40C9A9] mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-white font-semibold mb-2">Moderación de Contenido</h3>
                <p className="text-white/70 text-sm mb-3">
                  Todos los archivos son revisados por IA para asegurar que contengan solo contenido académico apropiado. 
                  No se permiten memes, contenido ofensivo, fotos personales o material no educativo.
                </p>
                {moderacionEstado === 'verificando' && (
                  <div className="flex items-center gap-2 text-[#40C9A9]">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#40C9A9]"></div>
                    <span className="text-sm">Verificando contenido...</span>
                  </div>
                )}
                {moderacionEstado === 'aprobado' && (
                  <div className="flex items-center gap-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Contenido aprobado</span>
                  </div>
                )}
                {moderacionEstado === 'rechazado' && (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">{moderacionMensaje}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Información básica */}
          <div className="space-y-4">
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
              key={fileKey} // Key única para forzar re-renderizado
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
            {isLoading ? "Verificando y subiendo..." : "Compartir Recurso"}
          </Button>
        </form>
      </div>
    </div>
  );
} 