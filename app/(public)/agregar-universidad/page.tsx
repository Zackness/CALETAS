"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { PublicPageShell } from "@/app/(public)/components/PublicPageShell";
import { PublicPageHero } from "@/app/(public)/components/PublicPageHero";
import {
  CATEGORIAS_INSTITUCION,
  CARACTERES_INSTITUCION,
  getEtiquetasInstitucion,
  type CategoriaInstitucion,
  type CaracterInstitucion,
} from "@/lib/instituciones-educativas";
import { 
  GraduationCap, 
  Users, 
  FileText, 
  Building2,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react";

interface Estudiante {
  id: string;
  nombre: string;
  email: string;
  carnet: string;
}

export default function AgregarUniversidadPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [estudiantes, setEstudiantes] = useState<Estudiante[]>([
    { id: "1", nombre: "", email: "", carnet: "" }
  ]);
  const [categoriaInstitucion, setCategoriaInstitucion] =
    useState<CategoriaInstitucion>("UNIVERSIDAD");
  const [caracterInstitucion, setCaracterInstitucion] =
    useState<CaracterInstitucion>("PUBLICA");
  const [institucion, setInstitucion] = useState("");
  const [siglasInstitucion, setSiglasInstitucion] = useState("");
  const [programa, setPrograma] = useState("");
  const [descripcionPrograma, setDescripcionPrograma] = useState("");
  const [pensum, setPensum] = useState<File | null>(null);

  const etiquetas = getEtiquetasInstitucion(categoriaInstitucion);
  
  const { toast } = useToast();

  const agregarEstudiante = () => {
    if (estudiantes.length >= 10) {
      toast({
        title: "Límite alcanzado",
        description: "Máximo 10 estudiantes por solicitud",
        variant: "destructive",
      });
      return;
    }
    
    const nuevoId = (estudiantes.length + 1).toString();
    setEstudiantes([...estudiantes, { id: nuevoId, nombre: "", email: "", carnet: "" }]);
  };

  const eliminarEstudiante = (id: string) => {
    if (estudiantes.length <= 1) {
      toast({
        title: "Mínimo requerido",
        description: "Se requiere al menos 1 estudiante",
        variant: "destructive",
      });
      return;
    }
    
    setEstudiantes(estudiantes.filter(est => est.id !== id));
  };

  const actualizarEstudiante = (id: string, campo: keyof Estudiante, valor: string) => {
    setEstudiantes(estudiantes.map(est => 
      est.id === id ? { ...est, [campo]: valor } : est
    ));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Tipo de archivo no válido",
          description: "Solo se permiten archivos PDF",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast({
          title: "Archivo demasiado grande",
          description: "El archivo no puede superar los 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setPensum(file);
    }
  };

  const validarFormulario = () => {
    if (!institucion.trim()) {
      toast({
        title: "Nombre requerido",
        description: `Por favor ingresa ${etiquetas.institucion.toLowerCase()}`,
        variant: "destructive",
      });
      return false;
    }

    if (!siglasInstitucion.trim()) {
      toast({
        title: "Siglas requeridas",
        description: `Por favor ingresa ${etiquetas.siglas.toLowerCase()}`,
        variant: "destructive",
      });
      return false;
    }

    if (!programa.trim()) {
      toast({
        title: "Programa requerido",
        description: `Por favor ingresa ${etiquetas.programa.toLowerCase()}`,
        variant: "destructive",
      });
      return false;
    }

    if (!pensum) {
      toast({
        title: "Pensum requerido",
        description: "Por favor sube el pensum de la carrera en PDF",
        variant: "destructive",
      });
      return false;
    }

    // Validar que todos los estudiantes tengan datos completos
    for (let i = 0; i < estudiantes.length; i++) {
      const est = estudiantes[i];
      if (!est.nombre.trim() || !est.email.trim() || !est.carnet.trim()) {
        toast({
          title: "Datos incompletos",
          description: `Por favor completa todos los datos del estudiante ${i + 1}`,
          variant: "destructive",
        });
        return false;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(est.email)) {
        toast({
          title: "Email inválido",
          description: `El email del estudiante ${i + 1} no es válido`,
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validarFormulario()) return;

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("universidad", institucion);
      formData.append("siglasUniversidad", siglasInstitucion);
      formData.append("categoriaInstitucion", categoriaInstitucion);
      formData.append("caracterInstitucion", caracterInstitucion);
      formData.append("carrera", programa);
      formData.append("descripcionCarrera", descripcionPrograma);
      formData.append("pensum", pensum!);
      formData.append("estudiantes", JSON.stringify(estudiantes));

      const response = await fetch("/api/universidades/solicitar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "¡Integración exitosa!",
          description: `Tu ${etiquetas.entidad} ha sido integrada. Los estudiantes pueden acceder con su carnet como contraseña inicial.`,
        });
        
        setInstitucion("");
        setSiglasInstitucion("");
        setCaracterInstitucion("PUBLICA");
        setPrograma("");
        setDescripcionPrograma("");
        setPensum(null);
        setEstudiantes([{ id: "1", nombre: "", email: "", carnet: "" }]);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Error al enviar la solicitud");
      }
    } catch (error) {
      console.error("Error enviando solicitud:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al enviar la solicitud",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageShell>
      <PublicPageHero
        label="Integración automática"
        labelIcon={GraduationCap}
        title="AGREGA TU INSTITUCIÓN EDUCATIVA"
        description="¿Tu universidad, colegio, liceo, instituto u otra unidad educativa no está en Caletas? Con al menos 10 estudiantes interesados y el programa de estudios en PDF, se integrará automáticamente a la plataforma."
      />

      <div className="chalk-container min-w-0 pb-14 sm:pb-16 md:pb-20">
        <div className="mx-auto max-w-4xl">
          {/* Información del proceso */}
          <Card className="chalk-card mb-8 chalk-card-featured">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[var(--caleta-accent)] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold mb-3">¿Cómo funciona?</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                        <span>Reúne al menos 10 estudiantes interesados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                        <span>Proporciona el programa de estudios en PDF</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                        <span>Envía el formulario</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                        <span>¡Integración automática inmediata!</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                        <span>Cuentas creadas automáticamente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[var(--caleta-accent)]" />
                        <span>¡Listo para usar Caletas!</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Tipo de unidad educativa */}
            <Card className="chalk-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-[var(--caleta-accent)]" />
                  Tipo de unidad educativa
                </CardTitle>
                <CardDescription className="text-white/70">
                  Elige qué tipo de institución quieres agregar. El formulario se adapta según tu selección.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {CATEGORIAS_INSTITUCION.map((item) => {
                    const selected = categoriaInstitucion === item.value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        onClick={() => setCategoriaInstitucion(item.value)}
                        className={`rounded-xl border p-4 text-left transition-colors ${
                          selected
                            ? "border-[var(--caleta-accent)] bg-[color-mix(in_oklab,var(--caleta-accent)_14%,transparent)]"
                            : "border-white/10 bg-[var(--mygreen-dark)] hover:border-white/20"
                        }`}
                      >
                        <p className="font-semibold text-white">{item.label}</p>
                        <p className="mt-1 text-xs leading-relaxed text-white/65">{item.descripcion}</p>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Información de la institución y programa */}
            <Card className="chalk-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[var(--caleta-accent)]" />
                  Información de la institución y programa
                </CardTitle>
                <CardDescription className="text-white/70">
                  Datos básicos de la unidad educativa y del programa que quieres agregar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="institucion" className="text-white/80">{etiquetas.institucion} *</Label>
                    <Input
                      id="institucion"
                      value={institucion}
                      onChange={(e) => setInstitucion(e.target.value)}
                      placeholder={etiquetas.institucionPlaceholder}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--caleta-accent)] focus:ring-[var(--caleta-accent)] rounded-lg mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="siglasInstitucion" className="text-white/80">{etiquetas.siglas} *</Label>
                    <Input
                      id="siglasInstitucion"
                      value={siglasInstitucion}
                      onChange={(e) => setSiglasInstitucion(e.target.value.toUpperCase())}
                      placeholder={etiquetas.siglasPlaceholder}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--caleta-accent)] focus:ring-[var(--caleta-accent)] rounded-lg mt-1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="caracterInstitucion" className="text-white/80">Carácter de la institución *</Label>
                  <Select
                    value={caracterInstitucion}
                    onValueChange={(value) => setCaracterInstitucion(value as CaracterInstitucion)}
                  >
                    <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--caleta-accent)] focus:ring-[var(--caleta-accent)] rounded-lg mt-1">
                      <SelectValue placeholder="Selecciona el carácter" />
                    </SelectTrigger>
                    <SelectContent>
                      {CARACTERES_INSTITUCION.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="programa" className="text-white/80">{etiquetas.programa} *</Label>
                  <Input
                    id="programa"
                    value={programa}
                    onChange={(e) => setPrograma(e.target.value)}
                    placeholder={etiquetas.programaPlaceholder}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--caleta-accent)] focus:ring-[var(--caleta-accent)] rounded-lg mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="descripcionPrograma" className="text-white/80">Descripción del programa (opcional)</Label>
                  <Textarea
                    id="descripcionPrograma"
                    value={descripcionPrograma}
                    onChange={(e) => setDescripcionPrograma(e.target.value)}
                    placeholder={etiquetas.programaDescripcion}
                    rows={3}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--caleta-accent)] focus:ring-[var(--caleta-accent)] rounded-lg mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="pensum" className="text-white/80">{etiquetas.documento} *</Label>
                  <Input
                    id="pensum"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="bg-white/10 border-white/20 text-white file:text-white file:bg-[var(--caleta-accent)] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[var(--caleta-accent)] focus:ring-[var(--caleta-accent)] rounded-lg mt-1"
                    required
                  />
                  {pensum && (
                    <div className="text-[var(--caleta-accent)] text-sm mt-1 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Archivo seleccionado: {pensum.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de estudiantes */}
            <Card className="chalk-card">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-[var(--caleta-accent)]" />
                  Estudiantes Interesados ({estudiantes.length}/10)
                </CardTitle>
                <CardDescription className="text-white/70">
                  {etiquetas.estudiantesHint}. Mínimo 1, máximo 10.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {estudiantes.map((estudiante, index) => (
                  <div key={estudiante.id} className="bg-[var(--mygreen-dark)] border border-white/10 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-white font-medium">Estudiante {index + 1}</h4>
                      {estudiantes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarEstudiante(estudiante.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-3 gap-3">
                      <div>
                        <Label className="text-white/70 text-sm">Nombre completo *</Label>
                        <Input
                          value={estudiante.nombre}
                          onChange={(e) => actualizarEstudiante(estudiante.id, "nombre", e.target.value)}
                          placeholder="Nombre y apellido"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--caleta-accent)] focus:ring-[var(--caleta-accent)] rounded-lg mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm">Email *</Label>
                        <Input
                          type="email"
                          value={estudiante.email}
                          onChange={(e) => actualizarEstudiante(estudiante.id, "email", e.target.value)}
                          placeholder="correo@ejemplo.com"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--caleta-accent)] focus:ring-[var(--caleta-accent)] rounded-lg mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm">Carnet/Expediente *</Label>
                        <Input
                          value={estudiante.carnet}
                          onChange={(e) => actualizarEstudiante(estudiante.id, "carnet", e.target.value)}
                          placeholder="Número de carnet"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[var(--caleta-accent)] focus:ring-[var(--caleta-accent)] rounded-lg mt-1"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button
                  type="button"
                  onClick={agregarEstudiante}
                  variant="outline"
                  className="w-full border-[var(--caleta-accent)] text-[var(--caleta-accent)] hover:bg-[color-mix(in_oklab,var(--caleta-accent)_10%,transparent)]"
                  disabled={estudiantes.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Estudiante
                </Button>
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card className="chalk-card chalk-card-featured">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[var(--caleta-accent)] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Integración Automática</h3>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• Se crearán cuentas automáticamente para todos los estudiantes listados</li>
                      <li>• La contraseña inicial será el número de carnet/expediente (hasheada)</li>
                      <li>• Los correos se marcarán como verificados automáticamente</li>
                      <li>• No será necesario completar el onboarding</li>
                      <li>• Podrán cambiar su contraseña al ingresar por primera vez</li>
                      <li>• La institución y el programa estarán disponibles inmediatamente</li>
                      <li>• El documento PDF se procesará para extraer materias automáticamente</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botón enviar */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[var(--caleta-accent)] hover:bg-[color-mix(in_oklab,var(--caleta-accent)_80%,transparent)] text-white font-bold text-lg py-4 rounded-xl shadow-lg"
            >
              {isSubmitting ? "Integrando..." : etiquetas.submit}
            </Button>
          </form>
        </div>
      </div>
    </PublicPageShell>
  );
} 