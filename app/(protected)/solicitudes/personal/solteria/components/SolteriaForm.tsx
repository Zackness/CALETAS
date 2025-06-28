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
import { Progress } from "@/components/ui/progress";
import { CardWrapper } from "@/components/card-wrapper";
import { FamilyInfo } from "@/components/ui/family-info";
import { toast } from "react-hot-toast";

const SolicitudSchema = z.object({
  persona: z.string().optional(),
  cedula: z.string().nonempty("Debe seleccionar una persona"),
  testigo1: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el archivo del primer testigo",
  }),
  testigo2: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el archivo del segundo testigo",
  }),
  actaNacimiento: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir su acta de nacimiento",
  }),
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
  cedula: string;
  id: string;
  telefono: string | null;
  nombre: string;
  parentesco: string;
  usuarioId: string;
}

export const SolteriaForm = () => {
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
  const [testigo1File, setTestigo1File] = useState<File | undefined>(undefined);
  const [testigo2File, setTestigo2File] = useState<File | undefined>(undefined);
  const [actaNacimientoFile, setActaNacimientoFile] = useState<File | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [hasFamiliares, setHasFamiliares] = useState<boolean>(false);

  const form = useForm<z.infer<typeof SolicitudSchema>>({
    resolver: zodResolver(SolicitudSchema),
    defaultValues: {
      persona: "",
      cedula: "",
      testigo1: undefined,
      testigo2: undefined,
      actaNacimiento: undefined,
    },
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await axios.get('/api/user');
        const { user, familiares } = response.data;
        setUser(user);
        setFamiliares(familiares);
        setSelectedPersona(user.id); 
        form.setValue("cedula", user.cedula); 
        setHasFamiliares(familiares.length > 0);
      } catch (error) {
        console.error("Error al obtener los datos de los familiares:", error);
        setError("Error al obtener los datos de los familiares");
      }
    }
    fetchData();
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
      setIsSubmitting(true);
      setError("");
      startTransition(() => {
        setError("");
        setSucces("");
      });
      setUploadProgress(0);

      if (!testigo1File || !testigo2File || !actaNacimientoFile) {
        setError("Debe seleccionar todos los archivos requeridos");
        return;
      }

      // Subir archivos uno por uno para mejor manejo de errores
      const testigo1Url = await uploadToBunny(
        testigo1File,
        `testigo1-${Date.now()}-${testigo1File.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      );

      const testigo2Url = await uploadToBunny(
        testigo2File,
        `testigo2-${Date.now()}-${testigo2File.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      );

      const actaNacimientoUrl = await uploadToBunny(
        actaNacimientoFile,
        `acta-nacimiento-${Date.now()}-${actaNacimientoFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      );

      // Crear la solicitud con las URLs de Bunny.net
      const solicitudData = {
        usuarioId: user!.id,
        familiarId: selectedPersona !== user!.id ? selectedPersona : null,
        testigo1: testigo1Url,
        testigo2: testigo2Url,
        actaNacimiento: actaNacimientoUrl,
      };

      startTransition(() => {
        axios.post('/api/solicitudes/personal/solteria', solicitudData)
          .then((response) => {
            const data = response.data;
            if (data.error) {
              setError(data.error);
            }
            if (data.succes) {
              form.reset();
              setSucces(data.succes);
              // Limpiar los archivos seleccionados
              setTestigo1File(undefined);
              setTestigo2File(undefined);
              setActaNacimientoFile(undefined);
              toast.success('Solicitud creada exitosamente');
            }
          })
          .catch((error) => {
            console.error('Error creating solicitud:', error);
            setError(error.response?.data?.error || "Error al crear la solicitud");
            toast.error('Error al crear la solicitud');
          });
      });
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
      form.setValue("cedula", persona.cedula);
    } else {
      form.setValue("cedula", ""); 
    }
  };

  return (
    <CardWrapper headerLabel="Solicitud de Documento">
      <div className="flex flex-col gap-4">
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
                name="actaNacimiento"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-foreground">Acta de Nacimiento</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setActaNacimientoFile(file);
                            form.setValue("actaNacimiento", file);
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
                name="testigo1"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-foreground">Documento del Testigo 1</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setTestigo1File(file);
                            form.setValue("testigo1", file);
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
                name="testigo2"
                render={() => (
                  <FormItem>
                    <FormLabel className="text-foreground">Documento del Testigo 2</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setTestigo2File(file);
                            form.setValue("testigo2", file);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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