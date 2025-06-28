"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, User } from "lucide-react";
import { OnboardingStatus, EstadoDeResidencia, TipoEmpresa } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";
import { useOnboarding } from "../(protected)/home/hooks/use-onboarding";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Step = 'company-selection' | 'titular' | 'conyuge' | 'direccion';

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('company-selection');
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<{
    cedula?: string;
    nombre?: string;
    nombre2?: string;
    apellido?: string;
    apellido2?: string;
    fechaNacimiento?: string;
    estadoCivil?: string;
    fechaVencimiento?: string;
  } | null>(null);
  const [spouseFile, setSpouseFile] = useState<File | null>(null);
  const [spouseData, setSpouseData] = useState<{
    cedula?: string;
    nombre?: string;
    nombre2?: string;
    apellido?: string;
    apellido2?: string;
    fechaNacimiento?: string;
  } | null>(null);
  const [direccion, setDireccion] = useState("");
  const [telefono, setTelefono] = useState("");
  const [estado, setEstado] = useState<EstadoDeResidencia>(EstadoDeResidencia.Carabobo);
  const [ciudad, setCiudad] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [codigoEmpresa, setCodigoEmpresa] = useState("");
  const [empresas, setEmpresas] = useState<{ id: string; nombre: string; tipo: TipoEmpresa }[]>([]);
  const [showEmpresaSelection, setShowEmpresaSelection] = useState(false);
  const [userType, setUserType] = useState<'independent' | 'allied' | null>(null);
  const { onboardingStatus, isLoading: isLoadingStatus } = useOnboarding();

  useEffect(() => {
    if (onboardingStatus === OnboardingStatus.FINALIZADO) {
      router.push("/home");
    }
  }, [onboardingStatus, router]);

  // Cargar empresas al montar el componente
  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const response = await axios.get("/api/user/onboarding/empresas");
        setEmpresas(response.data);
      } catch (error) {
        console.error("Error fetching empresas:", error);
      }
    };
    fetchEmpresas();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setError(null);
      await analyzeDocument(selectedFile);
    }
  };

  const handleSpouseFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setSpouseFile(selectedFile);
      await analyzeSpouseDocument(selectedFile);
    }
  };

  const analyzeDocument = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/api/user/onboarding/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;

      // Verificar si el usuario es menor de edad
      const fechaNacimiento = new Date(data.fechaNacimiento);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
      const mes = hoy.getMonth() - fechaNacimiento.getMonth();
      
      const edadAjustada = mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate()) 
        ? edad - 1 
        : edad;

      if (edadAjustada < 18) {
        toast({
          title: "Usuario menor de edad",
          description: `Estimado/a ${data.nombre}, lamentamos informarte que debes ser mayor de edad para utilizar este servicio. Por favor, vuelve cuando tengas 18 años o más.`,
          variant: "destructive",
        });
        setError("Debes ser mayor de edad para utilizar este servicio");
        return;
      }

      // Verificar si la cédula está vencida
      if (data.fechaVencimiento) {
        const vencimiento = new Date(data.fechaVencimiento);
        const hoy = new Date();
        
        if (vencimiento < hoy) {
          toast({
            title: "Cédula vencida",
            description: "Tu cédula de identidad está vencida. Por favor, renueva tu documento.",
            variant: "destructive",
          });
          setError("Tu cédula de identidad está vencida. Por favor, renueva tu documento.");
          return;
        }
      }

      // Si pasa todas las validaciones, mostrar los datos
      setExtractedData(data);
    } catch (error) {
      console.error("Error analyzing document:", error);
      setError("Error al analizar el documento. Por favor, intenta de nuevo.");
      toast({
        title: "Error",
        description: "Hubo un error al procesar el documento. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const analyzeSpouseDocument = async (file: File) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post("/api/user/onboarding/analyze", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const data = response.data;

      // Verificar si la cédula del cónyuge está vencida
      if (data.fechaVencimiento) {
        const vencimiento = new Date(data.fechaVencimiento);
        const hoy = new Date();
        
        if (vencimiento < hoy) {
          toast({
            title: "Cédula del cónyuge vencida",
            description: "La cédula de identidad de tu cónyuge está vencida. Por favor, renueva el documento.",
            variant: "destructive",
          });
          setError("La cédula de identidad de tu cónyuge está vencida. Por favor, renueva el documento.");
          return;
        }
      }

      // Si pasa la validación, mostrar los datos
      setSpouseData(data);
    } catch (error) {
      console.error("Error analyzing spouse document:", error);
      setError("Error al analizar el documento del cónyuge. Por favor, intenta de nuevo.");
      toast({
        title: "Error",
        description: "Hubo un error al procesar el documento del cónyuge. Por favor, intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = async () => {
    setIsLoading(true);
    try {
      await axios.post("/api/user/onboarding/skip");
      router.push("/home");
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      setError("Error al saltar el onboarding. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = () => {
    if (currentStep === 'company-selection') {
      if (userType === 'independent') {
        setCurrentStep('titular');
      } else if (userType === 'allied' && empresa) {
        setCurrentStep('titular');
      }
    } else if (currentStep === 'titular') {
      if (extractedData?.estadoCivil?.toLowerCase() === "casado") {
        setCurrentStep('conyuge');
      } else {
        setCurrentStep('direccion');
      }
    } else if (currentStep === 'conyuge') {
      setCurrentStep('direccion');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!file) {
        throw new Error("Por favor, selecciona un documento");
      }

      if (currentStep === 'titular') {
        if (extractedData?.estadoCivil?.toLowerCase() === "casado") {
          setCurrentStep('conyuge');
        } else {
          setCurrentStep('direccion');
        }
        return;
      }

      if (currentStep === 'conyuge') {
        if (!spouseFile) {
          throw new Error("Por favor, sube la cédula de tu cónyuge");
        }
        setCurrentStep('direccion');
        return;
      }

      // Último paso: datos de residencia
      if (!telefono) {
        throw new Error("Por favor, ingresa tu teléfono");
      }

      if (!ciudad) {
        throw new Error("Por favor, ingresa tu ciudad de residencia");
      }

      // Completamos el onboarding con todos los datos
      await axios.post("/api/user/onboarding/complete", {
        userData: extractedData,
        spouseData: spouseData,
        telefono,
        estado,
        ciudad,
        empresa: userType === 'allied' ? empresa : null,
        codigoEmpresa: userType === 'allied' ? codigoEmpresa : null
      });

      toast({
        title: "¡Onboarding completado!",
        description: "Tus datos han sido registrados exitosamente.",
      });

      router.push("/home");
    } catch (error) {
      console.error("Error submitting onboarding:", error);
      setError(error instanceof Error ? error.message : "Error al completar el onboarding");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingStatus) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 'company-selection':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card 
                className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-lg hover:scale-105 ${
                  userType === 'independent' 
                    ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300 shadow-md' 
                    : 'border-gray-200 hover:border-blue-300 shadow-sm'
                }`}
                onClick={() => {
                  setUserType('independent');
                  setEmpresa('');
                  setCodigoEmpresa('');
                  setShowEmpresaSelection(false);
                }}
              >
                <CardHeader className="text-center pb-4">
                  <User className="h-12 w-12 mx-auto text-blue-600 mb-2" />
                  <CardTitle className="text-lg">Particular</CardTitle>
                  <CardDescription className="text-sm">
                    Si no estás suscrito a ninguna empresa aliada
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card 
                className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-lg hover:scale-105 ${
                  userType === 'allied' 
                    ? 'ring-2 ring-green-500 bg-green-50 border-green-300 shadow-md' 
                    : 'border-gray-200 hover:border-green-300 shadow-sm'
                }`}
                onClick={() => {
                  setUserType('allied');
                  setShowEmpresaSelection(true);
                }}
              >
                <CardHeader className="text-center pb-4">
                  <Building2 className="h-12 w-12 mx-auto text-green-600 mb-2" />
                  <CardTitle className="text-lg">Empresa Aliada</CardTitle>
                  <CardDescription className="text-sm">
                    Si estás suscrito a alguna empresa aliada
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>

            {showEmpresaSelection && userType === 'allied' && (
              <div className="space-y-4 p-4 border-2 border-green-200 rounded-lg bg-green-50">
                <Label htmlFor="empresa" className="text-foreground font-medium">
                  Selecciona tu empresa aliada
                </Label>
                <Select
                  value={empresa}
                  onValueChange={(value) => {
                    setEmpresa(value);
                    setCodigoEmpresa('');
                  }}
                >
                  <SelectTrigger className="border-green-300 bg-white">
                    <SelectValue placeholder="Selecciona tu empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {empresas.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {empresa && (
                  <div className="space-y-2">
                    <Label htmlFor="codigoEmpresa" className="text-foreground font-medium">
                      Código de Empresa
                    </Label>
                    <Input
                      id="codigoEmpresa"
                      type="text"
                      value={codigoEmpresa}
                      onChange={(e) => setCodigoEmpresa(e.target.value)}
                      placeholder="Ingresa tu código de empresa"
                      disabled={isLoading}
                      className="border-green-300 bg-white"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        );
      case 'titular':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="document" className="text-foreground">
                Documento de Identificación (en formato JPEG o JPG no mayor a 2MB)
              </Label>
              <Input
                id="document"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                disabled={isLoading}
                className="border-2 border-red-500 rounded-md"
              />
            </div>

            {extractedData && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Datos extraídos:</h3>
                <p>Cédula: {extractedData.cedula}</p>
                <p>Nombre: {extractedData.nombre} {extractedData.nombre2}</p>
                <p>Apellidos: {extractedData.apellido} {extractedData.apellido2}</p>
                <p>Fecha de Nacimiento: {extractedData.fechaNacimiento}</p>
                <p>Estado Civil: {extractedData.estadoCivil}</p>
              </div>
            )}
          </>
        );
      case 'conyuge':
        return (
          <>
            <div className="space-y-2">
              <Label htmlFor="spouseDocument" className="text-foreground">
                Documento de Identificación del Cónyuge
              </Label>
              <Input
                id="spouseDocument"
                type="file"
                accept="image/*,.pdf"
                onChange={handleSpouseFileChange}
                disabled={isLoading}
              />
            </div>

            {spouseData && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Datos del cónyuge:</h3>
                <p>Cédula: {spouseData.cedula}</p>
                <p>Nombre: {spouseData.nombre} {spouseData.nombre2}</p>
                <p>Apellidos: {spouseData.apellido} {spouseData.apellido2}</p>
                <p>Fecha de Nacimiento: {spouseData.fechaNacimiento}</p>
              </div>
            )}
          </>
        );
      case 'direccion':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-foreground">
                Teléfono
              </Label>
              <Input
                id="telefono"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="0412-123-4567"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ciudad" className="text-foreground">
                Ciudad de Residencia
              </Label>
              <Input
                id="ciudad"
                type="text"
                value={ciudad}
                onChange={(e) => setCiudad(e.target.value)}
                placeholder="Ej: Valencia"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado" className="text-foreground">
                Estado de Residencia
              </Label>
              <Select
                value={estado}
                onValueChange={(value) => setEstado(value as EstadoDeResidencia)}
              >
                <SelectTrigger>
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
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bienvenido a Global Legal</CardTitle>
          <CardDescription>
            {currentStep === 'company-selection' && "Para comenzar, por favor selecciona la opción que mejor se adapte a tu situación"}
            {currentStep === 'titular' && "Por favor, sube tu cedula de identidad (en formato JPEG o JPG no mayor a 5MB)."}
            {currentStep === 'conyuge' && "Por favor, sube la cedula de identidad de tu cónyuge (en formato JPEG o JPG no mayor a 5MB)."}
            {currentStep === 'direccion' && "Por último, ingresa tu dirección de residencia."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {renderStepContent()}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <Button 
                type={currentStep === 'direccion' ? "submit" : "button"}
                onClick={currentStep !== 'direccion' ? handleNext : undefined}
                disabled={Boolean(isLoading || 
                  (currentStep === 'company-selection' && (!userType || (userType === 'allied' && !empresa))) ||
                  (currentStep === 'titular' && !file) || 
                  (currentStep === 'conyuge' && !spouseFile) ||
                  (currentStep === 'direccion' && (
                    !telefono || 
                    !ciudad
                  )))}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : currentStep === 'direccion' ? (
                  "Completar Onboarding"
                ) : (
                  "Siguiente"
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleSkip}
                disabled={isLoading}
                className="text-foreground"
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