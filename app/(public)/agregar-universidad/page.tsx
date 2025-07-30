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
import { Header } from "../(root)/components/Header";
import { 
  GraduationCap, 
  Users, 
  FileText, 
  Mail, 
  User, 
  Building2,
  BookOpen,
  Upload,
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
  const [universidad, setUniversidad] = useState("");
  const [siglasUniversidad, setSiglasUniversidad] = useState("");
  const [tipoUniversidad, setTipoUniversidad] = useState<string>("PUBLICA");
  const [carrera, setCarrera] = useState("");
  const [descripcionCarrera, setDescripcionCarrera] = useState("");
  const [pensum, setPensum] = useState<File | null>(null);
  
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
    if (!universidad.trim()) {
      toast({
        title: "Universidad requerida",
        description: "Por favor ingresa el nombre de la universidad",
        variant: "destructive",
      });
      return false;
    }

    if (!siglasUniversidad.trim()) {
      toast({
        title: "Siglas requeridas",
        description: "Por favor ingresa las siglas de la universidad",
        variant: "destructive",
      });
      return false;
    }

    if (!carrera.trim()) {
      toast({
        title: "Carrera requerida",
        description: "Por favor ingresa el nombre de la carrera",
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
      formData.append("universidad", universidad);
      formData.append("siglasUniversidad", siglasUniversidad);
      formData.append("tipoUniversidad", tipoUniversidad);
      formData.append("carrera", carrera);
      formData.append("descripcionCarrera", descripcionCarrera);
      formData.append("pensum", pensum!);
      formData.append("estudiantes", JSON.stringify(estudiantes));

      const response = await fetch("/api/universidades/solicitar", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        toast({
          title: "¡Integración exitosa!",
          description: "Tu universidad ha sido integrada automáticamente. Los estudiantes pueden acceder inmediatamente con su carnet como contraseña.",
        });
        
        // Limpiar formulario
        setUniversidad("");
        setSiglasUniversidad("");
        setTipoUniversidad("PUBLICA");
        setCarrera("");
        setDescripcionCarrera("");
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
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <Header />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#40C9A9]/20 text-[#40C9A9] px-4 py-2 rounded-full text-sm font-medium mb-6">
              <GraduationCap className="h-4 w-4" />
              Integración Automática
            </div>
            
            <h1 className="text-4xl md:text-5xl font-special text-white mb-6">
              Agrega tu Universidad
            </h1>
            
            <p className="text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              ¿Tu universidad no está en Caletas? ¡Agrégala automáticamente! 
              Con al menos 10 estudiantes interesados y el pensum de la carrera, 
              tu universidad se integrará inmediatamente a la plataforma.
            </p>
          </div>

          {/* Información del proceso */}
          <Card className="bg-[#354B3A] border-[#40C9A9]/30 mb-8">
            <CardContent className="p-6">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-[#40C9A9] mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="text-white font-semibold mb-3">¿Cómo funciona?</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-white/80">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                        <span>Reúne al menos 10 estudiantes interesados</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                        <span>Proporciona el pensum de la carrera</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                        <span>Envía el formulario</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                        <span>¡Integración automática inmediata!</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
                        <span>Cuentas creadas automáticamente</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-[#40C9A9]" />
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
            {/* Información de la universidad y carrera */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-[#40C9A9]" />
                  Información de la Universidad y Carrera
                </CardTitle>
                <CardDescription className="text-white/70">
                  Datos básicos de la universidad y carrera que quieres agregar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="universidad" className="text-white/80">Nombre de la Universidad *</Label>
                    <Input
                      id="universidad"
                      value={universidad}
                      onChange={(e) => setUniversidad(e.target.value)}
                      placeholder="Ej: Universidad Central de Venezuela"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="siglasUniversidad" className="text-white/80">Siglas de la Universidad *</Label>
                    <Input
                      id="siglasUniversidad"
                      value={siglasUniversidad}
                      onChange={(e) => setSiglasUniversidad(e.target.value)}
                      placeholder="Ej: UCV"
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="tipoUniversidad" className="text-white/80">Tipo de Universidad *</Label>
                  <Select onValueChange={(value) => setTipoUniversidad(value)} defaultValue="PUBLICA">
                    <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PUBLICA">Pública</SelectItem>
                      <SelectItem value="PRIVADA">Privada</SelectItem>
                      <SelectItem value="OTRA">Otra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="carrera" className="text-white/80">Nombre de la Carrera *</Label>
                  <Input
                    id="carrera"
                    value={carrera}
                    onChange={(e) => setCarrera(e.target.value)}
                    placeholder="Ej: Ingeniería Informática"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="descripcionCarrera" className="text-white/80">Descripción de la Carrera (opcional)</Label>
                  <Textarea
                    id="descripcionCarrera"
                    value={descripcionCarrera}
                    onChange={(e) => setDescripcionCarrera(e.target.value)}
                    placeholder="Información adicional sobre la carrera, especializaciones, etc."
                    rows={3}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="pensum" className="text-white/80">Pensum de la Carrera (PDF) *</Label>
                  <Input
                    id="pensum"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="bg-white/10 border-white/20 text-white file:text-white file:bg-[#40C9A9] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                    required
                  />
                  {pensum && (
                    <div className="text-[#40C9A9] text-sm mt-1 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Archivo seleccionado: {pensum.name}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de estudiantes */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#40C9A9]" />
                  Estudiantes Interesados ({estudiantes.length}/10)
                </CardTitle>
                <CardDescription className="text-white/70">
                  Lista de estudiantes que quieren que se agregue su universidad. Mínimo 1, máximo 10.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {estudiantes.map((estudiante, index) => (
                  <div key={estudiante.id} className="bg-[#1C2D20] border border-white/10 rounded-lg p-4">
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
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
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
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label className="text-white/70 text-sm">Carnet/Expediente *</Label>
                        <Input
                          value={estudiante.carnet}
                          onChange={(e) => actualizarEstudiante(estudiante.id, "carnet", e.target.value)}
                          placeholder="Número de carnet"
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg mt-1"
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
                  className="w-full border-[#40C9A9] text-[#40C9A9] hover:bg-[#40C9A9]/10"
                  disabled={estudiantes.length >= 10}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Estudiante
                </Button>
              </CardContent>
            </Card>

            {/* Información adicional */}
            <Card className="bg-[#1C2D20] border-[#40C9A9]/30">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-[#40C9A9] mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold mb-2">Integración Automática</h3>
                    <ul className="text-white/70 text-sm space-y-1">
                      <li>• Se crearán cuentas automáticamente para todos los estudiantes listados</li>
                      <li>• La contraseña inicial será el número de carnet/expediente (hasheada)</li>
                      <li>• Los correos se marcarán como verificados automáticamente</li>
                      <li>• No será necesario completar el onboarding</li>
                      <li>• Podrán cambiar su contraseña al ingresar por primera vez</li>
                      <li>• La universidad y carrera estarán disponibles inmediatamente</li>
                      <li>• El pensum se procesará para extraer materias automáticamente</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Botón enviar */}
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold text-lg py-4 rounded-xl shadow-lg"
            >
              {isSubmitting ? "Integrando..." : "Integrar Universidad"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
} 