"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useOnboarding } from "@/app/(protected)/home/hooks/use-onboarding";
import { OnboardingStatus } from "@prisma/client";
import { useToast } from "@/components/ui/use-toast";
import axios from "axios";

export default function OnboardingPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
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
  const [needsSpouseId, setNeedsSpouseId] = useState(false);
  const [spouseFile, setSpouseFile] = useState<File | null>(null);
  const [spouseData, setSpouseData] = useState<{
    cedula?: string;
    nombre?: string;
    nombre2?: string;
    apellido?: string;
    apellido2?: string;
    fechaNacimiento?: string;
  } | null>(null);
  const { onboardingStatus, isLoading: isLoadingStatus } = useOnboarding();

  useEffect(() => {
    // Si el onboarding ya está finalizado, redirigir a la página principal
    if (onboardingStatus === OnboardingStatus.FINALIZADO) {
      router.push("/home");
    }
  }, [onboardingStatus, router]);

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

      setExtractedData(response.data);

      // Verificar si la cédula está vencida
      if (response.data.fechaVencimiento) {
        const vencimiento = new Date(response.data.fechaVencimiento);
        const hoy = new Date();
        
        if (vencimiento < hoy) {
          toast({
            title: "Cédula vencida",
            description: "Tu cédula de identidad está vencida. Por favor, renueva tu documento.",
            variant: "destructive",
          });
          return;
        }
      }

      // Si está casado, solicitar cédula del cónyuge
      if (response.data.estadoCivil?.toLowerCase() === "casado") {
        setNeedsSpouseId(true);
        toast({
          title: "Documento del cónyuge requerido",
          description: "Por favor, sube la cédula de identidad de tu cónyuge.",
        });
      }
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

      setSpouseData(response.data);

      // Verificar si la cédula del cónyuge está vencida
      if (response.data.fechaVencimiento) {
        const vencimiento = new Date(response.data.fechaVencimiento);
        const hoy = new Date();
        
        if (vencimiento < hoy) {
          toast({
            title: "Cédula del cónyuge vencida",
            description: "La cédula de identidad de tu cónyuge está vencida. Por favor, renueva el documento.",
            variant: "destructive",
          });
          return;
        }
      }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!file) {
        throw new Error("Por favor, selecciona un documento");
      }

      if (needsSpouseId && !spouseFile) {
        throw new Error("Por favor, sube la cédula de tu cónyuge");
      }

      // Completar el onboarding con los datos extraídos
      await axios.post("/api/user/onboarding/complete", {
        userData: extractedData,
        spouseData: spouseData,
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

  return (
    <div className="flex items-center justify-center min-h-screen text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Bienvenido a Global Legal</CardTitle>
          <CardDescription>
            Para comenzar, por favor sube tu documento de identificación.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document" className="text-foreground">
                Documento de Identificación
              </Label>
              <Input
                id="document"
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                disabled={isLoading}
              />
            </div>

            {needsSpouseId && (
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
            )}

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

            {spouseData && (
              <div className="space-y-2 p-4 bg-muted rounded-lg">
                <h3 className="font-medium">Datos del cónyuge:</h3>
                <p>Cédula: {spouseData.cedula}</p>
                <p>Nombre: {spouseData.nombre} {spouseData.nombre2}</p>
                <p>Apellidos: {spouseData.apellido} {spouseData.apellido2}</p>
                <p>Fecha de Nacimiento: {spouseData.fechaNacimiento}</p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <div className="flex flex-col gap-2">
              <Button type="submit" disabled={isLoading || !file || (needsSpouseId && !spouseFile)}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Completar Onboarding"
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