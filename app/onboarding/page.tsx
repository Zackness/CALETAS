"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, User, GraduationCap, MapPin, FileText, BookOpen } from "lucide-react";
import { OnboardingStatus, EstadoDeResidencia } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useOnboarding } from "../(protected)/home/hooks/use-onboarding";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/multi-select";

type Step = 'company-selection' | 'carnet-semestre' | 'direccion' | 'materias-actuales';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('company-selection');
  const [error, setError] = useState<string | null>(null);
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<EstadoDeResidencia>(EstadoDeResidencia.Carabobo);
  const [ciudad, setCiudad] = useState("");
  const [universidad, setUniversidad] = useState("");
  const [universidades, setUniversidades] = useState<{ id: string; nombre: string; siglas: string; tipo: string; estado: string; ciudad: string; ranking: number | null }[]>([]);
  const [showUniversidadSelection, setShowUniversidadSelection] = useState(false);
  const [userType, setUserType] = useState<'independent' | 'allied' | null>(null);
  const { onboardingStatus, isLoading: isLoadingStatus } = useOnboarding();
  const [carnetFile, setCarnetFile] = useState<File | null>(null);
  const [carnetData, setCarnetData] = useState<any>(null);
  const [semestreActual, setSemestreActual] = useState<string>("");
  const [materiasActuales, setMateriasActuales] = useState<string[]>([]);

  // Materias de ejemplo para el paso final
  const materiasEjemplo = [
    { id: "1", codigo: "MAT-101", nombre: "Matemáticas I", semestre: "S1" },
    { id: "2", codigo: "FIS-101", nombre: "Física I", semestre: "S1" },
    { id: "3", codigo: "QUI-101", nombre: "Química General", semestre: "S1" },
    { id: "4", codigo: "PRO-101", nombre: "Programación I", semestre: "S2" },
    { id: "5", codigo: "MAT-102", nombre: "Matemáticas II", semestre: "S2" },
    { id: "6", codigo: "FIS-102", nombre: "Física II", semestre: "S2" },
    { id: "7", codigo: "EST-101", nombre: "Estadística", semestre: "S3" },
    { id: "8", codigo: "PRO-102", nombre: "Programación II", semestre: "S3" },
    { id: "9", codigo: "MAT-103", nombre: "Matemáticas III", semestre: "S3" },
    { id: "10", codigo: "BD-101", nombre: "Bases de Datos", semestre: "S4" },
    { id: "11", codigo: "RED-101", nombre: "Redes de Computadoras", semestre: "S4" },
    { id: "12", codigo: "ALG-101", nombre: "Análisis de Algoritmos", semestre: "S4" },
    { id: "13", codigo: "SO-101", nombre: "Sistemas Operativos", semestre: "S5" },
    { id: "14", codigo: "ISW-101", nombre: "Ingeniería de Software", semestre: "S5" },
    { id: "15", codigo: "BD-102", nombre: "Bases de Datos II", semestre: "S5" },
    { id: "16", codigo: "IA-101", nombre: "Inteligencia Artificial", semestre: "S6" },
    { id: "17", codigo: "WEB-101", nombre: "Desarrollo Web", semestre: "S6" },
    { id: "18", codigo: "MOB-101", nombre: "Desarrollo Móvil", semestre: "S6" },
  ];

  // Convertir materias a formato para MultiSelect con iconos
  const materiasOptions = materiasEjemplo.map(materia => ({
    label: `${materia.codigo} - ${materia.nombre}`,
    value: materia.id,
    icon: BookOpen, // Icono de libro para todas las materias
  }));

  useEffect(() => {
    if (onboardingStatus === OnboardingStatus.FINALIZADO) {
      router.push("/home");
    }
  }, [onboardingStatus, router]);

  // Cargar universidades al montar el componente
  useEffect(() => {
    const fetchUniversidades = async () => {
      try {
        const response = await axios.get("/api/user/onboarding/universidades");
        setUniversidades(response.data);
      } catch (error) {
        console.error("Error fetching universidades:", error);
      }
    };
    fetchUniversidades();
  }, []);

  const handleSkip = async () => {
    try {
      // Redirigir directamente al home sin llamar a la API eliminada
      router.push("/home");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
    }
  };

  const handleNext = () => {
    if (currentStep === 'company-selection') {
      if (userType === 'independent') {
        setCurrentStep('direccion');
      } else if (userType === 'allied' && universidad) {
        setCurrentStep('carnet-semestre');
      }
    } else if (currentStep === 'carnet-semestre') {
      setCurrentStep('direccion');
    } else if (currentStep === 'direccion') {
      setCurrentStep('materias-actuales');
    }
  };

  const handleBack = () => {
    // Limpiar errores al retroceder
      setError(null);
    
    if (currentStep === 'materias-actuales') {
      setCurrentStep('direccion');
    } else if (currentStep === 'direccion') {
      if (userType === 'independent') {
        setCurrentStep('company-selection');
      } else {
        setCurrentStep('carnet-semestre');
      }
    } else if (currentStep === 'carnet-semestre') {
      setCurrentStep('company-selection');
    }
  };

  const canGoBack = () => {
    return currentStep !== 'company-selection';
  };

  const getStepNumber = (step: Step) => {
    switch (step) {
      case 'company-selection': return 1;
      case 'carnet-semestre': return 2;
      case 'direccion': return userType === 'independent' ? 2 : 3;
      case 'materias-actuales': return userType === 'independent' ? 3 : 4;
    }
  };

  const getTotalSteps = () => {
    return userType === 'independent' ? 3 : 4;
  };

  const getStepProgress = () => {
    const currentStepNumber = getStepNumber(currentStep);
    const totalSteps = getTotalSteps();
    return (currentStepNumber / totalSteps) * 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("userType", userType || "");
      formData.append("universidad", universidad);
      formData.append("telefono", telefono);
      formData.append("estado", estado);
      formData.append("ciudad", ciudad);
      formData.append("semestreActual", semestreActual);
      formData.append("materiasActuales", JSON.stringify(materiasActuales));
      
      if (carnetData) {
        formData.append("carnetData", JSON.stringify(carnetData));
      }

      await axios.post("/api/user/onboarding/complete", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

        toast({
        title: "¡Perfil completado!",
        description: "Tu información ha sido guardada correctamente.",
      });

      router.push("/home");
    } catch (error) {
      console.error("Error completing onboarding:", error);
      setError("Error al completar el perfil. Por favor, intenta de nuevo.");
      toast({
        title: "Error",
        description: "Hubo un error al completar tu perfil. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCarnetChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setCarnetFile(selectedFile);
      setError(null);
      await analyzeCarnet(selectedFile);
    }
  };

  const analyzeCarnet = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/api/user/onboarding/analyze-carnet", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;
      setCarnetData(data);
        
          toast({
        title: "Carnet analizado",
        description: "Se ha procesado tu carnet universitario correctamente.",
      });
    } catch (error) {
      console.error("Error analyzing carnet:", error);
      setError("Error al analizar el carnet universitario. Por favor, intenta de nuevo.");
      toast({
        title: "Error",
        description: "Hubo un error al procesar el carnet universitario. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'company-selection':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-lg hover:scale-105 ${
                  userType === 'independent' 
                    ? 'ring-2 ring-mygreen bg-mygreen/10 border-mygreen shadow-md' 
                    : 'border-white/20 hover:border-mygreen/50 shadow-sm bg-white/5'
                }`}
                onClick={() => {
                  setUserType('independent');
                  setUniversidad('');
                  setShowUniversidadSelection(false);
                }}
              >
                <CardHeader className="text-center pb-4">
                  <User className="h-12 w-12 mx-auto text-mygreen mb-2" />
                  <CardTitle className="text-lg text-white">Estudiante Independiente</CardTitle>
                  <CardDescription className="text-sm text-white/70">
                    Si no estás afiliado a ninguna institución educativa
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-lg hover:scale-105 ${
                  userType === 'allied' 
                    ? 'ring-2 ring-mygreen bg-mygreen/10 border-mygreen shadow-md' 
                    : 'border-white/20 hover:border-mygreen/50 shadow-sm bg-white/5'
                }`}
                onClick={() => {
                  setUserType('allied');
                  setShowUniversidadSelection(true);
                }}
              >
                <CardHeader className="text-center pb-4">
                  <Building2 className="h-12 w-12 mx-auto text-mygreen mb-2" />
                  <CardTitle className="text-lg text-white">Universidad</CardTitle>
                  <CardDescription className="text-sm text-white/70">
                    Si perteneces a una universidad aliada
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {showUniversidadSelection && userType === 'allied' && (
              <div className="space-y-4 p-4 border-2 border-mygreen/30 rounded-lg bg-mygreen/10">
                <Label htmlFor="universidad" className="text-white font-medium">
                  Selecciona tu universidad
                </Label>
                <Select
                  value={universidad}
                  onValueChange={(value) => {
                    setUniversidad(value);
                    setCarnetFile(null);
                    setCarnetData(null);
                    setSemestreActual("");
                  }}
                >
                  <SelectTrigger className="border-mygreen/30 bg-white/10 text-white">
                    <SelectValue placeholder="Selecciona tu universidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {universidades.map((uni) => (
                      <SelectItem key={uni.id} value={uni.id}>
                        {uni.siglas} - {uni.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );
      case 'carnet-semestre':
        return (
          <div className="space-y-4 p-4 border-2 border-mygreen/30 rounded-lg bg-mygreen/10">
                      <div className="space-y-2 mt-2">
            <Label htmlFor="carnet" className="text-white font-medium">
              Sube una foto de tu carnet universitario (opcional)
              </Label>
              <Input
              id="carnet"
                type="file"
                accept="image/*,.pdf"
              onChange={handleCarnetChange}
                disabled={isLoading}
              className="border-2 border-mygreen/30 bg-white/10 text-white"
            />
            <p className="text-xs text-white/60 mt-1">
              💡 Solo necesitas seleccionar tu semestre actual para continuar. El carnet es opcional por ahora.
            </p>
              {carnetData && (
                <div className="space-y-2 p-2 bg-white/5 rounded-lg border border-white/10 mt-2">
                  <p className="text-white/80 text-xs">Nombre: {carnetData.nombre}</p>
                  <p className="text-white/80 text-xs">Expediente: {carnetData.expediente}</p>
                  <p className="text-white/80 text-xs">Carrera: {carnetData.carrera}</p>
                  <p className="text-white/80 text-xs">Semestre sugerido: {carnetData.semestre}</p>
                </div>
              )}
            </div>
            <div className="space-y-2 mt-4">
              <Label htmlFor="semestreActual" className="text-white font-medium">
                ¿En qué semestre estás actualmente?
              </Label>
              <Select
                value={semestreActual}
                onValueChange={setSemestreActual}
              >
                <SelectTrigger className="border-mygreen/30 bg-white/10 text-white">
                  <SelectValue placeholder="Selecciona tu semestre actual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S1">1er semestre</SelectItem>
                  <SelectItem value="S2">2do semestre</SelectItem>
                  <SelectItem value="S3">3er semestre</SelectItem>
                  <SelectItem value="S4">4to semestre</SelectItem>
                  <SelectItem value="S5">5to semestre</SelectItem>
                  <SelectItem value="S6">6to semestre</SelectItem>
                  <SelectItem value="S7">7mo semestre</SelectItem>
                  <SelectItem value="S8">8vo semestre</SelectItem>
                  <SelectItem value="S9">9no semestre</SelectItem>
                  <SelectItem value="S10">10mo semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
              </div>
        );
      case 'direccion':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-white">
                Teléfono
              </Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="0412-123-4567"
                disabled={isLoading}
                className="border-2 border-mygreen/30 bg-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ciudad" className="text-white">
                Ciudad de Residencia
              </Label>
              <Input
                id="ciudad"
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ej: Valencia"
                disabled={isLoading}
                className="border-2 border-mygreen/30 bg-white/10 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado" className="text-white">
                Estado de Residencia
              </Label>
              <Select
                value={estado}
                onValueChange={(value) => setEstado(value as EstadoDeResidencia)}
              >
                <SelectTrigger className="border-2 border-mygreen/30 bg-white/10 text-white">
                  <SelectValue placeholder="Selecciona tu estado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(EstadoDeResidencia).map((estado) => (
                    <SelectItem key={estado} value={estado}>
                      {estado.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );
      case 'materias-actuales':
        return (
          <div className="space-y-4 p-4 border-2 border-mygreen/30 rounded-lg bg-mygreen/10">
            {/* Resumen de información */}
            <div className="mb-4 p-3 bg-white/5 rounded-lg border border-white/10">
              <h3 className="text-white font-medium mb-2">📋 Resumen de tu información:</h3>
              <div className="space-y-1 text-sm text-white/80">
                <p><strong>Tipo de usuario:</strong> {userType === 'independent' ? 'Estudiante Independiente' : 'Universidad'}</p>
                {userType === 'allied' && universidad && (
                  <p><strong>Universidad:</strong> {universidades.find(u => u.id === universidad)?.nombre}</p>
                )}
                {carnetData && (
                  <>
                    <p><strong>Nombre:</strong> {carnetData.nombre}</p>
                    <p><strong>Expediente:</strong> {carnetData.expediente}</p>
                    <p><strong>Carrera:</strong> {carnetData.carrera}</p>
                  </>
                )}
                {semestreActual && (
                  <p><strong>Semestre actual:</strong> {semestreActual}</p>
                )}
                {telefono && (
                  <p><strong>Teléfono:</strong> {telefono}</p>
                )}
                {ciudad && (
                  <p><strong>Ciudad:</strong> {ciudad}</p>
                )}
                {estado && (
                  <p><strong>Estado:</strong> {estado.replace(/_/g, ' ')}</p>
                )}
                {materiasActuales.length > 0 && (
                  <p><strong>Materias seleccionadas:</strong> {materiasActuales.length} materia(s)</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white font-medium">
                ¿Qué materias estás cursando actualmente?
              </Label>
              <MultiSelect
                options={materiasOptions}
                onValueChange={setMateriasActuales}
                defaultValue={materiasActuales}
                placeholder="Busca y selecciona las materias que estás cursando..."
                className="bg-white/10 border-mygreen/30 text-white hover:bg-white/20"
                maxCount={4}
                variant="secondary"
                animation={0.5}
              />
              <p className="text-xs text-white/60 mt-1">
                💡 Escribe en el campo para buscar materias por nombre o código. Puedes seleccionar múltiples materias de cualquier semestre.
              </p>
            </div>
          </div>
        );
    }
  };

  const getStepIcon = () => {
    switch (currentStep) {
      case 'company-selection':
        return <GraduationCap className="h-6 w-6" />;
      case 'carnet-semestre':
        return <FileText className="h-6 w-6" />;
      case 'direccion':
        return <MapPin className="h-6 w-6" />;
      case 'materias-actuales':
        return <BookOpen className="h-6 w-6" />;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'company-selection':
        return "Tipo de Usuario";
      case 'carnet-semestre':
        return "Información Universitaria";
      case 'direccion':
        return "Información de Contacto";
      case 'materias-actuales':
        return "Materias Actuales";
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-sm border-white/20">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            {getStepIcon()}
            <CardTitle className="text-2xl font-special text-white">
              {getStepTitle()}
            </CardTitle>
          </div>
          
          {/* Indicador de progreso */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-white/70">
                Paso {getStepNumber(currentStep)} de {getTotalSteps()}
              </span>
              <span className="text-sm text-white/70">
                {Math.round(getStepProgress())}% completado
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-2">
              <div 
                className="bg-mygreen h-2 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${getStepProgress()}%` }}
              ></div>
            </div>
          </div>

          <CardDescription className="text-white/80">
            {currentStep === 'company-selection' && "Para comenzar, selecciona la opción que mejor se adapte a tu situación"}
            {currentStep === 'carnet-semestre' && "Sube tu carnet universitario (opcional) y selecciona tu semestre actual"}
            {currentStep === 'direccion' && "Ingresa tu información de contacto"}
            {currentStep === 'materias-actuales' && "Selecciona las materias que estás cursando actualmente"}
          </CardDescription>
          
          {currentStep === 'materias-actuales' && (
            <div className="mt-4 p-3 bg-mygreen/20 border border-mygreen/30 rounded-lg">
              <p className="text-sm text-mygreen font-medium">
                ✅ Último paso - Revisa tu información antes de completar
              </p>
              <p className="text-xs text-white/70 mt-1">
                Puedes usar el botón "Atrás" para modificar cualquier dato si es necesario
              </p>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderStepContent()}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <p className="text-sm text-red-300">{error}</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {canGoBack() && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="text-mygreen border-mygreen/30 hover:bg-mygreen/10 transition-all duration-200 hover:scale-105"
                >
                  ← Atrás
                </Button>
              )}
              <Button 
                type={currentStep === 'materias-actuales' ? "submit" : "button"}
                onClick={currentStep !== 'materias-actuales' ? handleNext : undefined}
                disabled={Boolean(isLoading || 
                  (currentStep === 'company-selection' && (
                    !userType || 
                    (userType === 'allied' && !universidad)
                  )) ||
                  (currentStep === 'carnet-semestre' && !semestreActual) ||
                  (currentStep === 'direccion' && (
                    !telefono || 
                    !ciudad
                  )) ||
                  (currentStep === 'materias-actuales' && materiasActuales.length === 0))}
                className="bg-mygreen hover:bg-mygreen-light text-white font-special"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : currentStep === 'materias-actuales' ? (
                  "Completar Perfil"
                ) : (
                  "Siguiente"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                className="text-mygreen border-mygreen/30 hover:bg-mygreen/10"
              >
                Saltar por ahora
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 