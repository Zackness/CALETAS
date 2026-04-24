"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { Upload, FileText, BookOpen, GraduationCap, Shield, AlertTriangle, CheckCircle, Search } from "lucide-react";

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
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [materiasOptions, setMateriasOptions] = useState<Array<{value: string, label: string, semestre?: string}>>([]);
  const [selectedMateria, setSelectedMateria] = useState<string>("");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState<string>("DOCUMENTO");
  const [tags, setTags] = useState("");
  const [esAnonimo, setEsAnonimo] = useState(false);
  
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
  const [userUniversidadId, setUserUniversidadId] = useState<string | null>(null);
  const [userUniversidadNombre, setUserUniversidadNombre] = useState("");

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

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const userRes = await fetch("/api/user");
        if (userRes.ok) {
          const data = await userRes.json();
          const uid = data.user?.universidadId ?? null;
          setUserUniversidadId(uid);
          setUserUniversidadNombre(data.user?.universidad?.nombre || "");
          if (uid) {
            const mRes = await fetch("/api/user/academico/materias");
            if (mRes.ok) {
              const md = await mRes.json();
              const list = Array.isArray(md.materias) ? md.materias : [];
              setMaterias(list);
              setMateriasOptions(
                list.map((materia: Materia & { semestre?: string }) => ({
                  label: `${materia.codigo} - ${materia.nombre}`,
                  value: materia.id,
                  semestre: materia.semestre || "Sin semestre",
                })),
              );
            } else {
              toast({
                title: "Perfil académico incompleto",
                description: "Necesitas carrera asignada para subir caletas de tu universidad.",
                variant: "destructive",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error cargando perfil:", error);
        toast({
          title: "Error",
          description: "No se pudo cargar tu perfil",
          variant: "destructive",
        });
      } finally {
        setIsLoadingData(false);
      }
    };

    void cargarPerfil();
  }, [toast]);

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
    
    if (!archivoSubida || !titulo || !descripcion) {
      toast({
        title: "Campos requeridos",
        description: "Completa título, descripción y archivo",
        variant: "destructive",
      });
      return;
    }

    if (userUniversidadId && !selectedMateria) {
      toast({
        title: "Materia requerida",
        description: "Debes elegir la materia de tu carrera (obligatorio con universidad).",
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
      if (selectedMateria) {
        formData.append("materiaId", selectedMateria);
      }
      formData.append("tags", tags);
      formData.append("esAnonimo", esAnonimo.toString());
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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-hex)] mx-auto mb-4"></div>
          <p className="text-white/80">Cargando universidades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-2 py-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-special text-[var(--accent-hex)] mb-2">Compartir Recurso</h1>
          <p className="text-white/70 text-base md:text-lg">
            Comparte tus apuntes, exámenes y materiales de estudio con otros estudiantes
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Paso 1: Análisis del Contenido */}
          <Card className="bg-[var(--mygreen-light)] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="h-5 w-5 text-[var(--accent-hex)]" />
                Paso 1: Análisis del Contenido
              </CardTitle>
              <CardDescription className="text-white/70">
                Selecciona el archivo para que la IA analice su contenido y verifique que sea apropiado para la plataforma
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Aviso de moderación */}
              <div className="bg-[var(--mygreen-dark)] border border-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)] rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[var(--accent-hex)] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Moderación de Contenido</h3>
                    <p className="text-white/70 text-sm mb-3">
                      Todos los archivos son revisados por IA para asegurar que contengan solo contenido académico apropiado.
                    </p>
                    {moderacionEstado === 'verificando' && (
                      <div className="flex items-center gap-2 text-[var(--accent-hex)]">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--accent-hex)]"></div>
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
                  className="bg-white/10 border-white/20 text-white file:text-white file:bg-[var(--accent-hex)] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1"
                />
                {archivoAnalisis && (
                  <div className="text-[var(--accent-hex)] text-sm mt-1">Archivo seleccionado: {archivoAnalisis.name}</div>
                )}
              </div>

              {/* Botón analizar */}
              <Button
                onClick={handleAnalizar}
                disabled={isAnalizando || !archivoAnalisis}
                className="w-full bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white font-bold py-3 rounded-xl shadow-lg transition-colors"
              >
                {isAnalizando ? "Analizando..." : "Analizar Contenido"}
              </Button>
            </CardContent>
          </Card>

          {/* Paso 2: Subida del Recurso */}
          <Card className="bg-[var(--mygreen-light)] border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-[var(--accent-hex)]" />
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
                    className="bg-white/10 border-white/20 text-white file:text-white file:bg-[var(--accent-hex)] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1 disabled:opacity-50"
                  />
                  {archivoSubida && (
                    <div className="text-[var(--accent-hex)] text-sm mt-1">Archivo seleccionado: {archivoSubida.name}</div>
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1"
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1"
                  />
                </div>

                {/* Tipo de recurso */}
                <div>
                  <Label htmlFor="tipo" className="text-white/80">Tipo de recurso *</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1">
                      <SelectValue placeholder="Selecciona el tipo de recurso" />
                    </SelectTrigger>
                    <SelectContent className="bg-[var(--mygreen)] text-white">
                      <SelectItem value="DOCUMENTO" className="hover:bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)]">Documento</SelectItem>
                      <SelectItem value="ANOTACION" className="hover:bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)]">Anotación</SelectItem>
                      <SelectItem value="RESUMEN" className="hover:bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)]">Resumen</SelectItem>
                      <SelectItem value="GUIA_ESTUDIO" className="hover:bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)]">Guía de Estudio</SelectItem>
                      <SelectItem value="EJERCICIOS" className="hover:bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)]">Ejercicios</SelectItem>
                      <SelectItem value="PRESENTACION" className="hover:bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)]">Presentación</SelectItem>
                      <SelectItem value="TIP" className="hover:bg-[color-mix(in_oklab,var(--accent-hex)_10%,transparent)]">Tip/Consejo</SelectItem>
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
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--accent-hex)] focus:ring-[var(--accent-hex)] rounded-lg mt-1"
                  />
                </div>

                {/* Privacidad */}
                <div className="bg-[var(--mygreen-dark)] border border-white/10 rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-white font-semibold">Privacidad</div>
                      <div className="text-white/70 text-sm">
                        Puedes compartir el recurso mostrando tu usuario o publicarlo como anónimo.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <div className="text-white/80 text-sm font-medium">
                      Publicar como anónimo
                    </div>
                    <Switch
                      checked={esAnonimo}
                      onCheckedChange={setEsAnonimo}
                      className="data-[state=checked]:bg-[var(--accent-hex)] data-[state=unchecked]:bg-white/20"
                    />
                  </div>
                </div>

                {userUniversidadId ? (
                  <div className="space-y-4 rounded-lg border border-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)] bg-[var(--mygreen-dark)] p-4">
                    <div className="flex gap-3 items-start">
                      <GraduationCap
                        className="h-5 w-5 text-[var(--accent-hex)] shrink-0 mt-0.5"
                        aria-hidden
                      />
                      <p className="text-sm text-white/85 min-w-0 flex-1 leading-relaxed">
                        Tu caleta se publica asociada a{" "}
                        <span className="text-[var(--accent-hex)] font-medium break-words">
                          {userUniversidadNombre || "tu universidad"}
                        </span>
                        . Debes elegir la materia de tu carrera.
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="materia" className="text-white/80">Materia *</Label>
                      <Combobox
                        options={materiasOptions}
                        value={selectedMateria}
                        onChange={setSelectedMateria}
                        placeholder="Buscar materia de tu carrera..."
                        variant="academic"
                        disabled={materiasOptions.length === 0}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-white/10 bg-[var(--mygreen-dark)] p-4 text-sm text-white/80">
                    <p>
                      Esta caleta es <span className="text-[var(--accent-hex)] font-medium">genérica</span>: visible para todos los
                      usuarios y no queda ligada a una universidad. Si en tu perfil registras una universidad, al subir
                      caletas deberás elegir siempre materia de tu carrera.
                    </p>
                  </div>
                )}

                {/* Botón subir */}
                <Button
                  type="submit"
                  disabled={isSubiendo || moderacionEstado !== 'aprobado' || !archivoSubida}
                  className="w-full bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white font-bold text-lg py-3 rounded-xl mt-2 shadow-lg transition-colors"
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