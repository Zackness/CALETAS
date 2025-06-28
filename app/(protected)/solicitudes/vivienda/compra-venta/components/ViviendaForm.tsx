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
import { FamilyInfo } from "@/components/ui/family-info";

const SolicitudSchema = z.object({
  persona: z.string().optional(),
  cedula: z.string().nonempty("Debe seleccionar un solicitante"),
  tipoInmueble: z.string().nonempty("Debe seleccionar el tipo de inmueble"),
  otroTipoInmueble: z.string().optional(),
  monto: z.string().nonempty("Debe ingresar el monto"),
  formaPago: z.string().nonempty("Debe seleccionar una forma de pago"),
  moneda: z.string().nonempty("Debe seleccionar la moneda"),
  esCompraConjunta: z.boolean().default(false),
  esVendedorJuridico: z.boolean().default(false),
  esApoderado: z.boolean().default(false),
  cedulaVendedor: z.string().nonempty("Debe ingresar la cédula o RIF del vendedor"),
  nombreVendedor: z.string().nonempty("Debe ingresar el nombre o razón social del vendedor"),
  documentoConstitucion: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el documento de constitución",
  }).optional(),
  actaAutorizacion: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el acta de autorización",
  }).optional(),
  documentoPropiedad: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el documento de propiedad",
  }),
  cedulaCatastral: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir la cédula catastral",
  }),
  solvenciaMunicipal: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir la solvencia municipal",
  }),
  cedulaApoderado: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir la cédula del apoderado",
  }).optional(),
  documentoConyuge: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el documento del cónyuge",
  }).optional(),
  documentoConyugeVendedor: z.custom<File>((file) => file instanceof File, {
    message: "Debe subir el documento del cónyuge del vendedor",
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
  cedula: string;
  id: string;
  telefono: string | null;
  nombre: string;
  parentesco: string;
  usuarioId: string;
}

export const ViviendaForm = () => {
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
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [conyugeInfo, setConyugeInfo] = useState<{
    nombre: string;
    cedula: string;
    tipo: 'usuario' | 'familiar' | 'ninguno';
    requiereDocumento: boolean;
  } | null>(null);
  const [isCompraConjunta, setIsCompraConjunta] = useState<boolean>(false);
  const [isVendedorJuridico, setIsVendedorJuridico] = useState<boolean>(false);
  const [isApoderado, setIsApoderado] = useState<boolean>(false);
  const [hasFamiliares, setHasFamiliares] = useState<boolean>(false);
  const [documentoConstitucionFile, setDocumentoConstitucionFile] = useState<File | null>(null);
  const [actaAutorizacionFile, setActaAutorizacionFile] = useState<File | null>(null);
  const [documentoPropiedadFile, setDocumentoPropiedadFile] = useState<File | null>(null);
  const [cedulaCatastralFile, setCedulaCatastralFile] = useState<File | null>(null);
  const [solvenciaMunicipalFile, setSolvenciaMunicipalFile] = useState<File | null>(null);
  const [cedulaApoderadoFile, setCedulaApoderadoFile] = useState<File | null>(null);
  const [documentoConyugeFile, setDocumentoConyugeFile] = useState<File | null>(null);
  const [documentoConyugeVendedorFile, setDocumentoConyugeVendedorFile] = useState<File | null>(null);
  const [tipoInmueble, setTipoInmueble] = useState("");

  const form = useForm<z.infer<typeof SolicitudSchema>>({
    resolver: zodResolver(SolicitudSchema),
    defaultValues: {
      persona: "",
      cedula: "",
      tipoInmueble: "",
      otroTipoInmueble: "",
      monto: "",
      formaPago: "",
      moneda: "",
      esCompraConjunta: false,
      esVendedorJuridico: false,
      esApoderado: false,
      cedulaVendedor: "",
      nombreVendedor: "",
      documentoConstitucion: undefined,
      actaAutorizacion: undefined,
      documentoPropiedad: undefined,
      cedulaCatastral: undefined,
      solvenciaMunicipal: undefined,
      cedulaApoderado: undefined,
      documentoConyuge: undefined,
      documentoConyugeVendedor: undefined,
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

  // Cargar datos iniciales
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
          setConyugeInfo({
            nombre: conyugeFamiliar.nombre,
            cedula: conyugeFamiliar.cedula,
            tipo: 'familiar' as const,
            requiereDocumento: false
          });
        } else if (isMounted) {
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
      const { data: uploadConfig } = await axios.get('/api/bunny/getUploadUrl', {
        params: { fileName }
      });

      await axios.put(uploadConfig.url, file, {
        headers: {
          ...uploadConfig.headers,
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
      throw new Error(error.response?.data?.error || 'Error al subir el archivo al los servidores');
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

      // Subir todos los documentos
      const documentosUrls = {
        documentoConstitucion: null,
        actaAutorizacion: null,
        documentoPropiedad: null,
        cedulaCatastral: null,
        solvenciaMunicipal: null,
        cedulaApoderado: null,
        documentoConyuge: null,
        documentoConyugeVendedor: null,
      };

      if (documentoConstitucionFile) {
        documentosUrls.documentoConstitucion = await uploadToBunny(
          documentoConstitucionFile,
          `constitucion-${Date.now()}-${documentoConstitucionFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        );
      }

      if (actaAutorizacionFile) {
        documentosUrls.actaAutorizacion = await uploadToBunny(
          actaAutorizacionFile,
          `autorizacion-${Date.now()}-${actaAutorizacionFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        );
      }

      if (documentoPropiedadFile) {
        documentosUrls.documentoPropiedad = await uploadToBunny(
          documentoPropiedadFile,
          `propiedad-${Date.now()}-${documentoPropiedadFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        );
      }

      if (cedulaCatastralFile) {
        documentosUrls.cedulaCatastral = await uploadToBunny(
          cedulaCatastralFile,
          `catastral-${Date.now()}-${cedulaCatastralFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        );
      }

      if (solvenciaMunicipalFile) {
        documentosUrls.solvenciaMunicipal = await uploadToBunny(
          solvenciaMunicipalFile,
          `solvencia-${Date.now()}-${solvenciaMunicipalFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        );
      }

      if (cedulaApoderadoFile) {
        documentosUrls.cedulaApoderado = await uploadToBunny(
          cedulaApoderadoFile,
          `apoderado-${Date.now()}-${cedulaApoderadoFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        );
      }

      if (documentoConyugeFile) {
        documentosUrls.documentoConyuge = await uploadToBunny(
          documentoConyugeFile,
          `conyuge-${Date.now()}-${documentoConyugeFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        );
      }

      if (documentoConyugeVendedorFile) {
        documentosUrls.documentoConyugeVendedor = await uploadToBunny(
          documentoConyugeVendedorFile,
          `conyuge-vendedor-${Date.now()}-${documentoConyugeVendedorFile.name.replace(/[^a-zA-Z0-9.-]/g, '')}`
        );
      }

      // Preparar datos para la API
      const requestData = {
        ...data,
        ...documentosUrls,
        usuarioId: user?.id,
        familiarId: selectedPersona !== user?.id ? selectedPersona : null,
      };

      // Enviar solicitud a la API
      startTransition(() => {
        axios.post('/api/solicitudes/vivienda/compra-venta', requestData)
          .then((response) => {
            const data = response.data;
            if (data.error) {
              setError(data.error);
            }
            if (data.succes) {
              form.reset();
              setSucces(data.succes);
              // Limpiar los archivos seleccionados
              setDocumentoConstitucionFile(null);
              setActaAutorizacionFile(null);
              setDocumentoPropiedadFile(null);
              setCedulaCatastralFile(null);
              setSolvenciaMunicipalFile(null);
              setCedulaApoderadoFile(null);
              setDocumentoConyugeFile(null);
              setDocumentoConyugeVendedorFile(null);
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
        <h2 className="text-2xl font-bold text-center mb-4">Solicitud de Compra-Venta de Vivienda</h2>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 text-white">
              {/* Selección de solicitante */}
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

              {/* Tipo de inmueble */}
              <FormField
                control={form.control}
                name="tipoInmueble"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Tipo de inmueble</FormLabel>
                    <FormControl>
                      <Combobox
                        {...field}
                        value={tipoInmueble}
                        onChange={(value) => {
                          setTipoInmueble(value);
                          field.onChange(value);
                        }}
                        options={[
                          { value: "casa", label: "Casa" },
                          { value: "apartamento", label: "Apartamento" },
                          { value: "otro", label: "Otro" },
                        ]}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo para especificar otro tipo de inmueble */}
              {tipoInmueble === "otro" && (
                <FormField
                  control={form.control}
                  name="otroTipoInmueble"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">Especifique el tipo de inmueble</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ingrese el tipo de inmueble" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Monto */}
              <FormField
                control={form.control}
                name="monto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Monto</FormLabel>
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
                    <FormLabel className="text-foreground">Forma de pago</FormLabel>
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
                          <label htmlFor="cheque" className="text-foreground">Cheque</label>
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
                          <label htmlFor="efectivo" className="text-foreground">Efectivo</label>
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
                          <label htmlFor="transferencia" className="text-foreground">Transferencia</label>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Moneda */}
              <FormField
                control={form.control}
                name="moneda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Moneda de la transacción</FormLabel>
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
                          <label htmlFor="bolivares" className="text-foreground">Bolívares</label>
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
                          <label htmlFor="divisa" className="text-foreground">Divisa</label>
                        </div>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Datos del vendedor */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Datos del vendedor</h3>
                
                <FormField
                  control={form.control}
                  name="esVendedorJuridico"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setIsVendedorJuridico(checked as boolean);
                          }}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-foreground">
                          ¿El vendedor es una persona jurídica?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cedulaVendedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        {isVendedorJuridico ? "RIF" : "Cédula"} del vendedor
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={isVendedorJuridico ? "Ingrese el RIF" : "Ingrese la cédula"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nombreVendedor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-foreground">
                        {isVendedorJuridico ? "Razón social" : "Nombre completo"} del vendedor
                      </FormLabel>
                      <FormControl>
                        <Input {...field} placeholder={isVendedorJuridico ? "Ingrese la razón social" : "Ingrese el nombre completo"} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Documentos adicionales para persona jurídica */}
                {isVendedorJuridico && (
                  <>
                    <FormField
                      control={form.control}
                      name="documentoConstitucion"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-foreground">Documento de constitución</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setDocumentoConstitucionFile(file);
                                  form.setValue("documentoConstitucion", file);
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
                      name="actaAutorizacion"
                      render={() => (
                        <FormItem>
                          <FormLabel className="text-foreground">Acta que autoriza al representante</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  setActaAutorizacionFile(file);
                                  form.setValue("actaAutorizacion", file);
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </>
                )}
              </div>

              {/* Documentos del inmueble */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Documentos del inmueble</h3>
                
                <FormField
                  control={form.control}
                  name="documentoPropiedad"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-foreground">Documento de propiedad o anterior compra-venta</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setDocumentoPropiedadFile(file);
                              form.setValue("documentoPropiedad", file);
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
                  name="cedulaCatastral"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-foreground">Cédula catastral</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCedulaCatastralFile(file);
                              form.setValue("cedulaCatastral", file);
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
                  name="solvenciaMunicipal"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-foreground">Solvencia de impuestos municipales</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setSolvenciaMunicipalFile(file);
                              form.setValue("solvenciaMunicipal", file);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Apoderado */}
              <FormField
                control={form.control}
                name="esApoderado"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsApoderado(checked as boolean);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-foreground">
                        ¿Es un apoderado quien compra en su nombre?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {isApoderado && (
                <FormField
                  control={form.control}
                  name="cedulaApoderado"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-foreground">Cédula del apoderado</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setCedulaApoderadoFile(file);
                              form.setValue("cedulaApoderado", file);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Compra conjunta */}
              <FormField
                control={form.control}
                name="esCompraConjunta"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          setIsCompraConjunta(checked as boolean);
                        }}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-foreground">
                        ¿Es una compra conjunta con su cónyuge?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Documentos del cónyuge */}
              {isCompraConjunta && conyugeInfo && conyugeInfo.requiereDocumento && (
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

              {/* Documentos del cónyuge del vendedor */}
              {!isVendedorJuridico && (
                <FormField
                  control={form.control}
                  name="documentoConyugeVendedor"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-foreground">Documento del cónyuge del vendedor (si aplica)</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setDocumentoConyugeVendedorFile(file);
                              form.setValue("documentoConyugeVendedor", file);
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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