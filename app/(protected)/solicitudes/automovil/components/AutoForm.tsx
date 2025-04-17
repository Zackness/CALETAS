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
import { Checkbox } from "@/components/ui/checkbox";

const SolicitudSchema = z.object({
  persona: z.string().optional(),
  cedula: z.string().nonempty("Debe seleccionar una persona"),
  testigo1: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el documento del comprador",
  }),
  bienes_generico1: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el título de propiedad del vehículo",
  }),
  bienes_generico2: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir la revisión de tránsito",
  }),
  bienes_generico3: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el comprobante de pagos municipales",
  }),
  generic_text: z.string().nonempty("Debe ingresar el monto"),
  formaPago: z.string().nonempty("Debe seleccionar una forma de pago"),
  moneda: z.string().nonempty("Debe seleccionar la moneda de la transacción"),
  bienes_generico4: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir la declaración jurada del vendedor",
  }),
  bienes_generico5: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir la declaración jurada del comprador",
  }),
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

export const AutoForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? "El correo ya está en uso con un proveedor diferente"
    : "";

  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [familiares, setFamiliares] = useState<Familiar[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [testigo1File, setTestigo1File] = useState<File | undefined>(undefined);
  const [bienes1File, setBienes1File] = useState<File | undefined>(undefined);
  const [bienes2File, setBienes2File] = useState<File | undefined>(undefined);
  const [bienes3File, setBienes3File] = useState<File | undefined>(undefined);
  const [bienes4File, setBienes4File] = useState<File | undefined>(undefined);
  const [bienes5File, setBienes5File] = useState<File | undefined>(undefined);
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const form = useForm<z.infer<typeof SolicitudSchema>>({
    resolver: zodResolver(SolicitudSchema),
    defaultValues: {
      persona: "",
      cedula: "",
      testigo1: undefined,
      bienes_generico1: undefined,
      bienes_generico2: undefined,
      bienes_generico3: undefined,
      generic_text: "",
      formaPago: "",
      moneda: "",
      bienes_generico4: undefined,
      bienes_generico5: undefined,
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

  const onSubmit = async (values: z.infer<typeof SolicitudSchema>) => {
    setError("");
    setSucces("");
    setUploadProgress(0);

    try {
      if (!testigo1File || !bienes1File || !bienes2File || !bienes3File || !bienes4File || !bienes5File) {
        setError("Debe seleccionar todos los documentos requeridos");
        return;
      }

      // Subir archivos uno por uno para mejor manejo de errores
      const testigo1Url = await uploadToBunny(
        testigo1File,
        `testigo1-${Date.now()}-${testigo1File.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      );

      const bienes1Url = await uploadToBunny(
        bienes1File,
        `bienes1-${Date.now()}-${bienes1File.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      );

      const bienes2Url = await uploadToBunny(
        bienes2File,
        `bienes2-${Date.now()}-${bienes2File.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      );

      const bienes3Url = await uploadToBunny(
        bienes3File,
        `bienes3-${Date.now()}-${bienes3File.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      );

      const bienes4Url = await uploadToBunny(
        bienes4File,
        `bienes4-${Date.now()}-${bienes4File.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      );

      const bienes5Url = await uploadToBunny(
        bienes5File,
        `bienes5-${Date.now()}-${bienes5File.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
      );

      // Crear la solicitud con las URLs de Bunny.net
      const solicitudData = {
        usuarioId: user!.id,
        familiarId: selectedPersona !== user!.id ? selectedPersona : null,
        testigo1: testigo1Url,
        bienes_generico1: bienes1Url,
        bienes_generico2: bienes2Url,
        bienes_generico3: bienes3Url,
        generic_text: values.generic_text,
        testigo2: values.formaPago,
        testigo3: values.moneda,
        bienes_generico4: bienes4Url,
        bienes_generico5: bienes5Url,
      };

      startTransition(() => {
        axios.post('/api/solicitudes/automovil', solicitudData)
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
              setBienes1File(undefined);
              setBienes2File(undefined);
              setBienes3File(undefined);
              setBienes4File(undefined);
              setBienes5File(undefined);
            }
          })
          .catch((error) => {
            console.error('Error creating solicitud:', error);
            setError("Error al crear la solicitud");
          });
      });
    } catch (error: any) {
      console.error('Error in form submission:', error);
      setError(error.message || "Error al subir los archivos");
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
    <CardWrapper headerLabel="Solicitud de Documento de Automóvil">
      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 text-white">
              <FormField
                control={form.control}
                name="persona"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quien solicita o vende</FormLabel>
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
                    <FormControl>
                      <Input {...field} disabled={true} id="cedula" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Documento del comprador */}
              <FormField
                control={form.control}
                name="testigo1"
                render={() => (
                  <FormItem>
                    <FormLabel>Documento del comprador</FormLabel>
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
              
              {/* Título de propiedad del vehículo */}
              <FormField
                control={form.control}
                name="bienes_generico1"
                render={() => (
                  <FormItem>
                    <FormLabel>Título de propiedad del vehículo</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBienes1File(file);
                            form.setValue("bienes_generico1", file);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Revisión de tránsito */}
              <FormField
                control={form.control}
                name="bienes_generico2"
                render={() => (
                  <FormItem>
                    <FormLabel>Revisión de tránsito</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBienes2File(file);
                            form.setValue("bienes_generico2", file);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Comprobante de pagos municipales */}
              <FormField
                control={form.control}
                name="bienes_generico3"
                render={() => (
                  <FormItem>
                    <FormLabel>Comprobante de pagos municipales</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBienes3File(file);
                            form.setValue("bienes_generico3", file);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Monto */}
              <FormField
                control={form.control}
                name="generic_text"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monto</FormLabel>
                    <FormControl>
                      <Input {...field} type="text" placeholder="Ingrese el monto" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Forma de pago */}
              <FormField
                control={form.control}
                name="formaPago"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Forma de pago</FormLabel>
                    <FormControl>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="cheque" 
                            checked={field.value === "cheque"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("formaPago", "cheque");
                              }
                            }}
                          />
                          <label htmlFor="cheque">Cheque</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="efectivo" 
                            checked={field.value === "efectivo"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("formaPago", "efectivo");
                              }
                            }}
                          />
                          <label htmlFor="efectivo">Efectivo</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="transferencia" 
                            checked={field.value === "transferencia"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("formaPago", "transferencia");
                              }
                            }}
                          />
                          <label htmlFor="transferencia">Transferencia</label>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Moneda de la transacción */}
              <FormField
                control={form.control}
                name="moneda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moneda de la transacción</FormLabel>
                    <FormControl>
                      <div className="flex space-x-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="bolivares" 
                            checked={field.value === "bolivares"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("moneda", "bolivares");
                              }
                            }}
                          />
                          <label htmlFor="bolivares">Bolívares</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="divisa" 
                            checked={field.value === "divisa"}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                form.setValue("moneda", "divisa");
                              }
                            }}
                          />
                          <label htmlFor="divisa">Divisa</label>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Declaración jurada del vendedor */}
              <FormField
                control={form.control}
                name="bienes_generico4"
                render={() => (
                  <FormItem>
                    <FormLabel>Declaración jurada del vendedor (destino de los fondos son lícitos)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBienes4File(file);
                            form.setValue("bienes_generico4", file);
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Declaración jurada del comprador */}
              <FormField
                control={form.control}
                name="bienes_generico5"
                render={() => (
                  <FormItem>
                    <FormLabel>Declaración jurada del comprador (origen de los fondos son lícitos)</FormLabel>
                    <FormControl>
                      <Input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBienes5File(file);
                            form.setValue("bienes_generico5", file);
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