"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Upload, FileText, BookOpen, GraduationCap, Shield, AlertTriangle, CheckCircle, Search, ArrowRight } from "lucide-react";

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
  semestre?: string;
}

interface ArchivoAnalizado {
  file: File;
  titulo: string;
  descripcion: string;
  hash: string; // Para validar que sea el mismo archivo
}

export default function SubirCaletaPage() {
  const [universidades, setUniversidades] = useState<Universidad[]>([]);
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiasOptions, setMateriasOptions] = useState<Array<{value: string, label: string, semestre?: string}>>([]);
  const [selectedUniversidad, setSelectedUniversidad] = useState<string>("");
  const [selectedCarrera, setSelectedCarrera] = useState<string>("");
  const [selectedMateria, setSelectedMateria] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<string>("DOCUMENTO");
  const [tags, setTags] = useState("");
  const [esPublico, setEsPublico] = useState(true);
  
  // Estados para el análisis
  const [archivoAnalisis, setArchivoAnalisis] = useState<File | null>(null);
  const [isAnalizando, setIsAnalizando] = useState(false);
  const [moderacionEstado, setModeracionEstado] = useState<'pendiente' | 'verificando' | 'aprobado' | 'rechazado'>('pendiente');
  const [moderacionMensaje, setModeracionMensaje] = useState("");
  const [archivoAnalizado, setArchivoAnalizado] = useState<ArchivoAnalizado | null>(null);
  
  // Estados para la subida
  const [archivoSubida, setArchivoSubida] = useState<File | null>(null);
  const [isSubiendo, setIsSubiendo] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  const { toast } = useToast();
  const router = useRouter();

  // Función para generar hash del archivo
  const generateFileHash = async (file: File): Promise<string> => {
    const buffer = await file.arrayBuffer();
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Función para validar que los archivos coincidan
  const validateFileMatch = async (file1: File, file2: File): Promise<boolean> => {
    if (file1.name !== file2.name || file1.size !== file2.size || file1.type !== file2.type) {
      return false;
    }
    const hash1 = await generateFileHash(file1);
    const hash2 = await generateFileHash(file2);
    return hash1 === hash2;
  };

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
        
        // Convertir materias a formato para Combobox
        const options = carrera.materias.map((materia: any) => ({
          label: `${materia.codigo} - ${materia.nombre}`,
          value: materia.id,
          semestre: (materia as any).semestre || "Sin semestre",
        }));
        setMateriasOptions(options);
        
        setSelectedMateria("");
      }
    } else {
      setMaterias([]);
      setMateriasOptions([]);
    }
  }, [selectedCarrera, carreras]);

  // Función para manejar la selección de archivo para análisis
  const handleFileChangeAnalisis = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      
      setArchivoAnalisis(file);
      setModeracionEstado('pendiente');
      setModeracionMensaje("Archivo seleccionado. Completa el título y descripción para analizar.");
    }
  };

  // Función para manejar la selección de archivo para subida
  const handleFileChangeSubida = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que coincida con el archivo analizado
      if (archivoAnalizado) {
        const coincide = await validateFileMatch(archivoAnalizado.file, file);
        if (!coincide) {
          toast({
            title: "Archivo diferente",
            description: "Debes seleccionar el mismo archivo que fue analizado",
            variant: "destructive",
          });
          return;
        }
      }
      
      setArchivoSubida(file);
    }
  };

  // Función para analizar el contenido
  const handleAnalizar = async () => {
    if (!archivoAnalisis) {
      toast({
        title: "Archivo requerido",
        description: "Selecciona un archivo para analizar",
        variant: "destructive",
      });
      return;
    }

    setIsAnalizando(true);
    setModeracionEstado('verificando');
    setModeracionMensaje("Analizando contenido del archivo...");

    try {
      const formData = new FormData();
      formData.append("file", archivoAnalisis);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 segundos timeout

      try {
        const response = await fetch("/api/ia/analizar-contenido", {
          method: "POST",
          body: formData,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const resultado = await response.json();
          
          if (resultado.esApropiado) {
            setModeracionEstado('aprobado');
            setModeracionMensaje("✅ Contenido aprobado: " + resultado.razon);
            
            // Guardar información del archivo analizado
            const hash = await generateFileHash(archivoAnalisis);
            setArchivoAnalizado({
              file: archivoAnalisis,
              titulo: "", // No se usa en análisis
              descripcion: "", // No se usa en análisis
              hash
            });
            
            toast({
              title: "Contenido aprobado",
              description: "Puedes proceder a completar el formulario de subida",
            });
          } else {
            setModeracionEstado('rechazado');
            setModeracionMensaje("❌ Contenido rechazado: " + resultado.razon);
          }
        } else {
          const error = await response.json();
          setModeracionEstado('rechazado');
          setModeracionMensaje("Error en análisis: " + (error.error || "Error desconocido"));
        }
      } catch (error) {
        clearTimeout(timeoutId);
        console.error("Error en análisis:", error);
        setModeracionEstado('rechazado');
        
        if (error instanceof Error && error.name === 'AbortError') {
          setModeracionMensaje("❌ Timeout: El análisis tardó demasiado tiempo");
        } else {
          setModeracionMensaje("Error al analizar el contenido");
        }
      } finally {
        setIsAnalizando(false);
      }
    } catch (error) {
      console.error("Error general en análisis:", error);
      setModeracionEstado('rechazado');
      setModeracionMensaje("Error al analizar el contenido");
      setIsAnalizando(false);
    }
  };

  // Función para subir el recurso
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!archivoSubida || !selectedMateria || !titulo || !descripcion) {
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

    // Verificar que el archivo coincide con el analizado
    if (archivoAnalizado) {
      const coincide = await validateFileMatch(archivoAnalizado.file, archivoSubida);
      if (!coincide) {
        toast({
          title: "Archivo diferente",
          description: "Debes seleccionar el mismo archivo que fue analizado",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubiendo(true);

    try {
      const formData = new FormData();
      formData.append("titulo", titulo);
      formData.append("descripcion", descripcion);
      formData.append("tipo", tipo);
      formData.append("materiaId", selectedMateria);
      formData.append("tags", tags);
      formData.append("esPublico", esPublico.toString());
      formData.append("file", archivoSubida);

      const response = await fetch("/api/caletas/upload-cpanel", {
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
      setIsSubiendo(false);
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-2 py-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-special text-[#40C9A9] mb-2">Compartir Recurso</h1>
          <p className="text-white/70 text-base md:text-lg">
            Comparte tus apuntes, exámenes y materiales de estudio con otros estudiantes
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Paso 1: Análisis del Contenido */}
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-[#40C9A9]" />
                Paso 1: Análisis del Contenido
              </CardTitle>
              <CardDescription className="text-white/70">
                Selecciona el archivo para que la IA analice su contenido y verifique que sea apropiado para la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aviso de moderación */}
              <div className="bg-[#1C2D20] border border-[#40C9A9]/20 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#40C9A9] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Moderación de Contenido</h3>
                    <p className="text-white/70 text-sm mb-3">
                      Todos los archivos son revisados por IA para asegurar que contengan solo contenido académico apropiado.
                    </p>
                    {moderacionEstado === 'verificando' && (
                      <div className="flex items-center gap-2 text-[#40C9A9]">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#40C9A9]"></div>
                        <span className="text-sm">Verificando contenido...</span>
                      </div>
                    )}
                    {moderacionEstado === 'aprobado' && (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">{moderacionMensaje}</span>
                      </div>
                    )}
                    {moderacionEstado === 'rechazado' && (
                      <div className="flex items-center gap-2 text-red-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span className="text-sm">{moderacionMensaje}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Archivo para análisis */}
              <div>
                <Label htmlFor="archivoAnalisis" className="text-white/80">Archivo para análisis *</Label>
                <Input
                  id="archivoAnalisis"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChangeAnalisis}
                  className="bg-white/10 border-white/20 text-white file:text-white file:bg-[#40C9A9] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                />
                {archivoAnalisis && (
                  <div className="text-[#40C9A9] text-sm mt-1">Archivo seleccionado: {archivoAnalisis.name}</div>
                )}
              </div>

              {/* Botón analizar */}
              <Button
                onClick={handleAnalizar}
                disabled={isAnalizando || !archivoAnalisis}
                className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
              >
                {isAnalizando ? "Analizando..." : "Analizar Contenido"}
              </Button>
            </CardContent>
          </Card>

          {/* Paso 2: Subida del Recurso */}
          <Card className="bg-[#354B3A] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-[#40C9A9]" />
                Paso 2: Subida del Recurso
              </CardTitle>
              <CardDescription className="text-white/70">
                Completa la información del recurso y sube el archivo aprobado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Archivo para subida */}
                <div>
                  <Label htmlFor="archivoSubida" className="text-white/80">Archivo para subida *</Label>
                  <Input
                    id="archivoSubida"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleFileChangeSubida}
                    disabled={moderacionEstado !== 'aprobado'}
                    className="bg-white/10 border-white/20 text-white file:text-white file:bg-[#40C9A9] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1 disabled:opacity-50"
                  />
                  {archivoSubida && (
                    <div className="text-[#40C9A9] text-sm mt-1">Archivo seleccionado: {archivoSubida.name}</div>
                  )}
                  {moderacionEstado !== 'aprobado' && (
                    <div className="text-orange-400 text-sm mt-1">Primero debes analizar y aprobar el contenido</div>
                  )}
                </div>

                {/* Título */}
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

                {/* Descripción */}
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

                {/* Tipo de recurso */}
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

                {/* Tags */}
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
                    <Combobox
                      options={materiasOptions}
                      value={selectedMateria}
                      onChange={setSelectedMateria}
                      placeholder="Buscar materia..."
                      variant="academic"
                      disabled={!selectedCarrera}
                    />
                  </div>
                </div>

                {/* Botón subir */}
                <Button
                  type="submit"
                  disabled={isSubiendo || moderacionEstado !== 'aprobado' || !archivoSubida}
                  className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold text-lg py-3 rounded-xl mt-2 shadow-lg transition-colors"
                >
                  {isSubiendo ? "Subiendo..." : "Subir Recurso"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 