"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useState, useTransition, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormSucces } from "@/components/form-succes";
import { FormError } from "@/components/form-error";
import { useSearchParams } from "next/navigation";
import axios from "axios";
import { Combobox } from "@/components/ui/combobox"; 
import { Progress } from "@/components/ui/progress";
import { CardWrapper } from "@/components/card-wrapper";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

const SolicitudSchema = z.object({
  persona: z.string().optional(),
  cedula: z.string().nonempty("Debe seleccionar una persona"),
  nombreConyuge: z.string().optional(),
  cedulaConyuge: z.string().optional(),
  documentoConyuge: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el documento del cónyuge",
  }).optional(),
  bien1: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el archivo del primer bien",
  }).optional(),
  bien2: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el archivo del segundo bien",
  }).optional(),
  bien3: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el archivo del tercer bien",
  }).optional(),
  bien4: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el archivo del cuarto bien",
  }).optional(),
  bien5: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el archivo del quinto bien",
  }).optional(),
  esPoderEspecial: z.boolean().default(false),
  genericText: z.string().optional(),
});

interface User {
  cedula: string;
  name: string;
  id: string;
  email: string;
  telefono: string | null;
  codigoEmpresa: string | null;
  emailVerified: Date | null;
  image: string | null;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Familiar {
  cedula: string;
  id: string;
  telefono: string | null;
  nombre: string;
  parentesco: string;
  usuarioId: string;
}

export const PoderForm = () => {
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
  const [bien1File, setBien1File] = useState<File | undefined>(undefined);
  const [bien2File, setBien2File] = useState<File | undefined>(undefined);
  const [bien3File, setBien3File] = useState<File | undefined>(undefined);
  const [bien4File, setBien4File] = useState<File | undefined>(undefined);
  const [bien5File, setBien5File] = useState<File | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [conyugeInfo, setConyugeInfo] = useState<{
    nombre: string;
    cedula: string;
    tipo: 'usuario' | 'familiar' | 'ninguno';
    requiereDocumento: boolean;
  } | null>(null);
  const [isPoderEspecial, setIsPoderEspecial] = useState<boolean>(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof SolicitudSchema>>({
    resolver: zodResolver(SolicitudSchema),
    defaultValues: {
      persona: "",
      cedula: "",
      nombreConyuge: "",
      cedulaConyuge: "",
      documentoConyuge: undefined,
      bien1: undefined,
      bien2: undefined,
      bien3: undefined,
      bien4: undefined,
      bien5: undefined,
      esPoderEspecial: false,
      genericText: "",
    },
  });

  // Función para buscar el cónyuge
  const findConyuge = useCallback((selectedId: string) => {
    if (!user || !familiares.length) return null;
    
    // Si se seleccionó el usuario principal
    if (selectedId === user.id) {
      // Buscar si hay un cónyuge entre los familiares
      const conyugeFamiliar = familiares.find(f => 
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
      
      // Si no tiene cónyuge registrado, requiere subir documento
      return {
        nombre: "No registrado",
        cedula: "No registrado",
        tipo: 'ninguno' as const,
        requiereDocumento: true
      };
    }
    
    // Si se seleccionó un familiar
    const selectedFamiliar = familiares.find(f => f.id === selectedId);
    if (selectedFamiliar) {
      // Si el familiar es esposo o esposa
      if (selectedFamiliar.parentesco.toLowerCase() === "esposo" || 
          selectedFamiliar.parentesco.toLowerCase() === "esposa") {
        // El cónyuge es el usuario principal
        return {
          nombre: user.name,
          cedula: user.cedula,
          tipo: 'usuario' as const,
          requiereDocumento: false
        };
      }
      
      // Para cualquier otro familiar, siempre mostrar el campo para subir documento
      return {
        nombre: "No registrado",
        cedula: "No registrado",
        tipo: 'ninguno' as const,
        requiereDocumento: true
      };
    }
    
    return null;
  }, [user, familiares]);

  // Cargar datos iniciales solo una vez
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
          
          form.setValue("nombreConyuge", conyugeFamiliar.nombre);
          form.setValue("cedulaConyuge", conyugeFamiliar.cedula);
        } else if (isMounted) {
          // Si no existe un cónyuge, configurar para subir documento
          setConyugeInfo({
            nombre: "No registrado",
            cedula: "No registrado",
            tipo: 'ninguno' as const,
            requiereDocumento: true
          });
        }
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
  }, [form]); // Agregamos form como dependencia

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
      setIsSubmitting(true);
      setError("");

      // Subir documento del cónyuge
      let documentoConyugeUrl = null;
      if (documentoConyugeFile) {
        const formData = new FormData();
        formData.append('file', documentoConyugeFile);
        formData.append('upload_preset', 'ml_default');
        
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
          {
            method: 'POST',
            body: formData,
          }
        );

        if (!response.ok) {
          throw new Error('Error al subir el documento del cónyuge');
        }

        const result = await response.json();
        documentoConyugeUrl = result.secure_url;
      }

      // Preparar datos para la API
      const requestData = {
        ...data,
        usuarioId: user?.id,
        familiarId: selectedPersona !== user?.id ? selectedPersona : null,
        testigo3: documentoConyugeUrl,
        testigo4: documentoConyugeUrl, // Usamos la misma URL para mantener compatibilidad
      };

      // Enviar solicitud a la API
      const response = await fetch('/api/solicitudes/migrante/poder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear la solicitud');
      }

      const result = await response.json();
      toast.success('Solicitud creada exitosamente');
      router.push('/solicitudes');
    } catch (error) {
      console.error('Error al crear la solicitud:', error);
      setError(error instanceof Error ? error.message : 'Error al crear la solicitud');
      toast.error('Error al crear la solicitud');
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
      form.setValue("nombreConyuge", conyugeEncontrado.nombre);
      form.setValue("cedulaConyuge", conyugeEncontrado.cedula);
    }
  };

  return (
    <CardWrapper>
      <div className="flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center mb-4">Solicitud de Poder</h2>
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
              
              {/* Campos para información del cónyuge */}
              {conyugeInfo && (
                <>
                  {/* Solo mostrar los campos de nombre y cédula si NO requiere documento */}
                  {!conyugeInfo.requiereDocumento && (
                    <>
                      <FormField
                        control={form.control}
                        name="nombreConyuge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Nombre del o la cónyuge</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={true} id="nombreConyuge" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="cedulaConyuge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-foreground">Cédula del o la cónyuge</FormLabel>
                            <FormControl>
                              <Input {...field} disabled={true} id="cedulaConyuge" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                  
                  {/* Campo para subir documento del cónyuge solo si es requerido */}
                  {conyugeInfo.requiereDocumento && (
                    <FormField
                      control={form.control}
                      name="documentoConyuge"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-foreground">Cédula del o la Cónyuge (Opcional)</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setDocumentoConyugeFile(file);
                                  field.onChange(file.name);
                                }
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Sube el documento de identidad del cónyuge (PDF, JPG, JPEG, PNG)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </>
              )}
              
              {/* Checkbox para poder especial */}
              <FormField
                control={form.control}
                name="esPoderEspecial"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          // Convertir el CheckedState a boolean
                          setIsPoderEspecial(checked === true);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-foreground">
                        ¿Esto es un poder especial?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />
              
              {/* Campo de texto para poder especial */}
              {isPoderEspecial && (
                <FormField
                  control={form.control}
                  name="genericText"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Especifique los detalles del poder especial</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describa los detalles del poder especial..."
                          className="min-h-[100px] text-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {/* Campos para bienes */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-foreground">Propiedades, bienes o inmuebles</h3>
                <p className="text-sm text-foreground/50 mb-4">Suba los documentos de propiedad de sus bienes o inmuebles</p>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="bien1"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-foreground">Propiedad 1</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBien1File(file);
                                form.setValue("bien1", file);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bien2"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-foreground">Propiedad 2</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBien2File(file);
                                form.setValue("bien2", file);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bien3"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-foreground">Propiedad 3</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBien3File(file);
                                form.setValue("bien3", file);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bien4"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-foreground">Propiedad 4</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBien4File(file);
                                form.setValue("bien4", file);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="bien5"
                    render={() => (
                      <FormItem>
                        <FormLabel className="text-foreground">Propiedad 5</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setBien5File(file);
                                form.setValue("bien5", file);
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
              disabled={isPending}
              type="submit"
              className="w-full"
            >
              {isPending ? (
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
      </div>
    </CardWrapper>
  );
};