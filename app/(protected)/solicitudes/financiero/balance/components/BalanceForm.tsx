"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useState, useTransition, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSucces } from "@/components/form-succes";
import { FormError } from "@/components/form-error";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Combobox } from "@/components/ui/combobox";
import { CardWrapper } from "@/components/card-wrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "react-hot-toast";
import { FamilyInfo } from "@/components/ui/family-info";
import { Progress } from "@/components/ui/progress";

const SolicitudSchema = z.object({
  persona: z.string().optional(),
  cedula: z.string().nonempty("Debe seleccionar una persona"),
  esBalanceConjunto: z.boolean().default(false),
  documentoConyuge: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el documento del cónyuge",
  }).optional(),
});

interface User {
  cedula: string;
  name: string;
  id: string;
  email: string;
  telefono: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Familiar {
  id: string;
  nombre: string;
  cedula: string;
  parentesco: string;
  usuarioId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const BalanceForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? "El correo ya está en uso con un proveedor diferente"
    : "";

  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [documentoConyugeFile, setDocumentoConyugeFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [conyugeInfo, setConyugeInfo] = useState<{
    nombre: string;
    cedula: string;
    tipo: 'usuario' | 'familiar' | 'ninguno';
    requiereDocumento: boolean;
  } | null>(null);
  const [isBalanceConjunto, setIsBalanceConjunto] = useState<boolean>(false);
  const [hasFamiliares, setHasFamiliares] = useState(false);

  const form = useForm<z.infer<typeof SolicitudSchema>>({
    resolver: zodResolver(SolicitudSchema),
    defaultValues: {
      persona: "",
      cedula: "",
      esBalanceConjunto: false,
      documentoConyuge: undefined,
    },
  });

  // Función para buscar el cónyuge
  const findConyuge = (selectedId: string) => {
    const conyugeFamiliar = familiares.find((f) => 
      f.parentesco.toLowerCase() === "esposo" || 
      f.parentesco.toLowerCase() === "esposa"
    );

    if (conyugeFamiliar) {
      return {
        nombre: conyugeFamiliar.nombre,
        cedula: conyugeFamiliar.cedula,
        tipo: 'familiar' as const,
        requiereDocumento: false
      };
    }

    return {
      nombre: "No registrado",
      cedula: "No registrado",
      tipo: 'ninguno' as const,
      requiereDocumento: true
    };
  };

  useEffect(() => {
    let isMounted = true;
    
    async function fetchData() {
      try {
        const response = await axios.get('/api/user');
        if (!isMounted) return;
        
        const { user, familiares } = response.data;
        setUser(user);
        setFamiliares(familiares);
        setSelectedPersona(user.id); 
        form.setValue("cedula", user.cedula);
        
        // Buscar si existe un cónyuge entre los familiares
        const conyugeFamiliar = familiares.find((f: Familiar) => 
          f.parentesco.toLowerCase() === "esposo" || 
          f.parentesco.toLowerCase() === "esposa"
        );
        
        if (conyugeFamiliar && isMounted) {
          // Si existe un cónyuge, configurar la información
          setConyugeInfo({
            nombre: conyugeFamiliar.nombre,
            cedula: conyugeFamiliar.cedula,
            tipo: 'familiar' as const,
            requiereDocumento: false
          });
          
        } else if (isMounted) {
          // Si no existe un cónyuge, configurar para subir documento
          setConyugeInfo({
            nombre: "No registrado",
            cedula: "No registrado",
            tipo: 'ninguno' as const,
            requiereDocumento: true
          });
        }
        setHasFamiliares(familiares.length > 0);
      } catch (error) {
        console.error("Error al cargar datos:", error);
        if (isMounted) {
          setError("Error al cargar los datos del usuario");
        }
      }
    }
    
    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, [form]);

  const uploadToBunny = async (file: File, fileName: string) => {
    try {
      // Obtener la URL de subida de Bunny.net
      const { data: uploadConfig } = await axios.get('/api/bunny/getUploadUrl', {
        params: { fileName }
      });

      // Para Bunny Storage, necesitamos enviar el archivo directamente
      await axios.put(uploadConfig.url, file, {
        headers: {
          ...uploadConfig.headers,
          // El Content-Type debe coincidir con el tipo del archivo
          'Content-Type': file.type || 'application/octet-stream'
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      });

      return uploadConfig.fileUrl;
    } catch (error: any) {
      console.error('Error uploading to Bunny:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error || 'Error al subir el archivo a Bunny Storage');
    }
  };

  const onSubmit = async (data: z.infer<typeof SolicitudSchema>) => {
    try {
      console.log("[BALANCE_FORM] Iniciando envío del formulario");
      setIsSubmitting(true);
      setError("");
      startTransition(() => {
        setError("");
        setSucces("");
      });
      setUploadProgress(0);

      // Subir documento del cónyuge si es necesario
      let documentoConyugeUrl = null;
      if (documentoConyugeFile && data.esBalanceConjunto) {
        console.log("[BALANCE_FORM] Subiendo documento del cónyuge");
        try {
          documentoConyugeUrl = await uploadToBunny(
            documentoConyugeFile,
            `conyuge-${Date.now()}-${documentoConyugeFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
          );
          console.log("[BALANCE_FORM] Documento del cónyuge subido:", documentoConyugeUrl);
        } catch (error) {
          console.error("[BALANCE_FORM] Error al subir documento del cónyuge:", error);
          setError("Error al subir el documento del cónyuge");
          setIsSubmitting(false);
          return;
        }
      }

      // Preparar datos para la API
      const requestData = {
        ...data,
        usuarioId: user?.id,
        familiarId: selectedPersona !== user?.id ? selectedPersona : null,
        documentoConyuge: documentoConyugeUrl,
      };

      console.log("[BALANCE_FORM] Enviando datos a la API:", requestData);

      // Enviar solicitud a la API
      const response = await axios.post('/api/solicitudes/financiero/balance', requestData);
      console.log("[BALANCE_FORM] Respuesta de la API:", response.data);

      const responseData = response.data;
      if (responseData.error) {
        setError(responseData.error);
        toast.error(responseData.error);
      }
      if (responseData.succes) {
        form.reset();
        setSucces(responseData.succes);
        setDocumentoConyugeFile(null);
        toast.success('Solicitud creada exitosamente');
      }
    } catch (error: any) {
      console.error("[BALANCE_FORM] Error al crear la solicitud:", error);
      const errorMessage = error.response?.data?.error || error.message || "Error al crear la solicitud";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePersonaChange = (value: string) => {
    setSelectedPersona(value);
    const persona = value === user?.id ? user : familiares.find((f) => f.id === value);
    if (persona) {
      if ('cedula' in persona) {
        form.setValue("cedula", persona.cedula);
      }
    } else {
      form.setValue("cedula", ""); 
    }

    // Actualizar la información del cónyuge
    const conyugeEncontrado = findConyuge(value);
    if (conyugeEncontrado) {
      setConyugeInfo(conyugeEncontrado);
    }
  };

  return (
    <CardWrapper>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center mb-4">Solicitud de Balance Personal</h2>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 text-white">
              <FormField
                control={form.control}
                name="persona"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Quien solicita</FormLabel>
                    <FormControl>
                      <Combobox
                        {...field}
                        value={selectedPersona}
                        onChange={handlePersonaChange}
                        options={[
                          { value: user?.id || "", label: user?.name || "Usuario" },
                          ...familiares.map((familiar) => ({
                            value: familiar.id,
                            label: familiar.nombre,
                          })),
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="cedula"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Cédula del solicitante</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={true} id="cedula" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="esBalanceConjunto"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsBalanceConjunto(checked as boolean);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-foreground">
                        Balance conjunto con cónyuge
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Campos para información del cónyuge */}
              {isBalanceConjunto && conyugeInfo && (
                <>
                  {conyugeInfo.requiereDocumento && (
                    <FormField
                      control={form.control}
                      name="documentoConyuge"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-foreground">Documento del cónyuge</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setDocumentoConyugeFile(file);
                                  form.setValue("documentoConyuge", file);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-sm text-center mt-2">Subiendo archivos: {uploadProgress}%</p>
              </div>
            )}
            <FormError message={error || urlError} />
            <FormSucces message={succes} />
            <Button
              variant="default"
              disabled={isPending || isSubmitting}
              type="submit"
              className="w-full"
            >
              {isPending || isSubmitting ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Procesando...
                </div>
              ) : "Crear Solicitud"}
            </Button>
          </form>
        </Form>
        
        {/* Mostrar información sobre familiares si no hay ninguno */}
        {!hasFamiliares && <FamilyInfo />}
      </div>
    </CardWrapper>
  );
};
