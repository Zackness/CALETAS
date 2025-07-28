"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { useTransition, useState, useEffect } from "react";
import { SettingsSchema } from "@/schemas";
import { Form, FormField, FormControl, FormItem, FormLabel, FormDescription, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useSession } from "next-auth/react";
import { FormSucces } from "@/components/form-succes";
import { FormError } from "@/components/form-error";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserRole, EstadoDeResidencia } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, User, Shield, Phone, MapPin } from "lucide-react";

type ExtendedUser = {
    id: string;
    name: string;
    name2: string | null;
    apellido: string | null;
    apellido2: string | null;
    email: string;
    role: UserRole;
    isTwoFactorEnabled: boolean;
    isOAuth: boolean;
    cedula: string | null;
    telefono: string | null;
    EstadoDeResidencia: EstadoDeResidencia | null;
    ciudadDeResidencia: string | null;
};

export default function Ajustes() {
  const user = useCurrentUser() as ExtendedUser;
  const { update } = useSession();

  const [error, setError] = useState<string | undefined>();
  const [succes, setSucces] = useState<string | undefined>();
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof SettingsSchema>>({
      resolver: zodResolver(SettingsSchema),
      defaultValues: {
          name: user?.name || undefined,
          name2: user?.name2 || undefined,
          apellido: user?.apellido || undefined,
          apellido2: user?.apellido2 || undefined,
          cedula: user?.cedula || undefined,
          telefono: user?.telefono || undefined,
          EstadoDeResidencia: user?.EstadoDeResidencia || undefined,
          ciudadDeResidencia: user?.ciudadDeResidencia || undefined,
          email: user?.email || undefined,
          password: undefined,
          newPassword: undefined,
          isTwoFactorEnabled: user?.isTwoFactorEnabled || undefined,
      }
  });

  // Detectar cambios en el formulario
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === "change") {
        setHasChanges(true);
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    setError(undefined);
    setSucces(undefined);
    setIsSubmitting(true);
    
    console.log("Enviando valores:", values);
    
    startTransition(() => {
      settings(values)
      .then(async (data) => {
        setIsSubmitting(false);
        
        if (data.error) {
          console.error("Error al guardar:", data.error);
          setError(data.error);
          toast.error(data.error);
        }

        if (data.succes) {
          console.log("Éxito al guardar:", data.succes);
          await update();
          setSucces(data.succes);
          toast.success(data.succes);
          setHasChanges(false);
          
          // Recargar la página después de actualizar la sesión
          window.location.reload();
        }
      })
      .catch((error) => {
        setIsSubmitting(false);
        console.error("Error al guardar:", error);
        const errorMsg = "Algo ha salido mal!";
        setError(errorMsg);
        toast.error(errorMsg);
      });
    });
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light px-4 py-8">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-special text-[#40C9A9] mb-2">Ajustes de la Cuenta</h1>
          <p className="text-white/70 text-base md:text-lg">
            Gestiona tu información personal y configuración de seguridad
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Información Personal */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <User className="w-5 h-5 text-[#40C9A9]" />
                  Información Personal
                </CardTitle>
                <CardDescription className="text-white/70">
                  Datos básicos de tu perfil (solo lectura)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                        <FormLabel className="text-white/80">Primer nombre</FormLabel>
                  <FormControl>
                    <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                      {...field}
                      disabled={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField 
              control={form.control}
              name="name2"
              render={({ field }) => (
                <FormItem>
                        <FormLabel className="text-white/80">Segundo nombre</FormLabel>
                  <FormControl>
                    <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                      {...field}
                      disabled={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField 
              control={form.control}
              name="apellido"
              render={({ field }) => (
                <FormItem>
                        <FormLabel className="text-white/80">Primer apellido</FormLabel>
                  <FormControl>
                    <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                      {...field}
                      disabled={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField 
              control={form.control}
              name="apellido2"
              render={({ field }) => (
                <FormItem>
                        <FormLabel className="text-white/80">Segundo apellido</FormLabel>
                  <FormControl>
                    <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                      {...field}
                      disabled={true}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
                </div>
            <FormField 
                control={form.control}
                name="cedula"
                render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white/80">Cédula de identidad</FormLabel>
                        <FormControl>
                            <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                                {...field}
                                disabled={true}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
              </CardContent>
            </Card>

            {/* Verificación de Cédula */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-[#40C9A9]" />
                  Verificación de Cédula
                </CardTitle>
                <CardDescription className="text-white/70">
                  Sube una imagen de tu cédula para verificar y actualizar tus datos
                </CardDescription>
              </CardHeader>
              <CardContent>
            <FormField 
                control={form.control}
                name="ciPhoto"
                render={({ field }) => (
                    <FormItem>
                        <FormControl>
                        <div className="flex flex-col gap-3">
                                <Input
                                    type="file"
                                    accept="image/*"
                            className="bg-white/10 border-white/20 text-white file:text-white file:bg-[#40C9A9] file:border-0 file:rounded-lg file:px-4 file:py-2 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                field.onChange(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    disabled={isPending || isSubmitting}
                                />
                                <Button
                                    type="button"
                            className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                                    disabled={isPending || isSubmitting || !field.value}
                                    onClick={async () => {
                                        try {
                                            const response = await fetch('/api/user/onboarding/analyze', {
                                                method: 'POST',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                },
                                                body: JSON.stringify({
                                                    ciPhoto: field.value,
                                                }),
                                            });

                                            if (!response.ok) {
                                                throw new Error('Error al analizar la cédula');
                                            }

                                            const data = await response.json();
                                            
                                            // Actualizar los campos del formulario con los datos analizados
                                            form.setValue('name', data.name || user?.name);
                                            form.setValue('name2', data.name2 || user?.name2);
                                            form.setValue('apellido', data.apellido || user?.apellido);
                                            form.setValue('apellido2', data.apellido2 || user?.apellido2);
                                            form.setValue('cedula', data.cedula || user?.cedula);
                                            
                                            toast.success('Cédula analizada correctamente');
                                        } catch (error) {
                                            console.error('Error:', error);
                                            toast.error('Error al analizar la cédula');
                                        }
                                    }}
                                >
                                    Analizar cédula
                                </Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
              </CardContent>
            </Card>

            {/* Información de Contacto */}
            <Card className="bg-[#354B3A] border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Phone className="w-5 h-5 text-[#40C9A9]" />
                  Información de Contacto
                </CardTitle>
                <CardDescription className="text-white/70">
                  Datos de contacto y ubicación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel className="text-white/80">Teléfono</FormLabel>
                    <FormControl>
                      <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                        {...field}
                        disabled={isPending || isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField 
                control={form.control}
                name="EstadoDeResidencia"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel className="text-white/80">Estado de residencia</FormLabel>
                    <Select
                      disabled={isPending || isSubmitting}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                            <SelectTrigger className="bg-white/10 border-white/20 text-white focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                          <SelectContent className="bg-[#203324] text-white">
                        {Object.values(EstadoDeResidencia).map((estado) => (
                              <SelectItem key={estado} value={estado} className="hover:bg-[#40C9A9]/10">
                            {estado.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField 
              control={form.control}
              name="ciudadDeResidencia"
              render={({ field }) => (
                <FormItem>
                      <FormLabel className="text-white/80">Ciudad de residencia</FormLabel>
                  <FormControl>
                    <Input
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                      {...field}
                      disabled={isPending || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
              </CardContent>
            </Card>

            {/* Seguridad y Autenticación */}
            {user?.isOAuth === false && (
              <Card className="bg-[#354B3A] border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Shield className="w-5 h-5 text-[#40C9A9]" />
                    Seguridad y Autenticación
                  </CardTitle>
                  <CardDescription className="text-white/70">
                    Configura tu email, contraseña y autenticación en dos pasos
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
              <FormField 
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                        <FormLabel className="text-white/80">Correo electrónico</FormLabel>
                    <FormControl>
                      <Input
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                        {...field}
                        disabled={isPending || isSubmitting}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                          <FormLabel className="text-white/80">Contraseña actual</FormLabel>
                    <FormControl>
                      <Input
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                        {...field}
                        disabled={isPending || isSubmitting}
                        type="password"
                        placeholder="******"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField 
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                          <FormLabel className="text-white/80">Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input
                              className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-[#40C9A9] focus:ring-[#40C9A9] rounded-lg"
                        {...field}
                        disabled={isPending || isSubmitting}
                        type="password"
                        placeholder="******"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
                  </div>
              <FormField 
                control={form.control}
                name="isTwoFactorEnabled"
                render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg p-4 bg-white/5 border border-white/10">
                        <div className="space-y-1">
                          <FormLabel className="text-white/80">Autenticación en dos pasos (2FA)</FormLabel>
                          <FormDescription className="text-white/60">
                            Activa la autenticación en dos pasos para tu cuenta (Autenticación por Email)
                      </FormDescription>
                    </div>
                    <FormControl>
                          <div className="flex items-center gap-3">
                            <span className={`text-sm font-medium ${field.value ? 'text-green-400' : 'text-white/60'}`}>
                          {field.value ? "Activado" : "Desactivado"}
                        </span>
                          <Switch 
                            disabled={isPending || isSubmitting}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-[#40C9A9] data-[state=unchecked]:bg-white/20"
                          />
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
                </CardContent>
              </Card>
            )}

            {/* Mensajes de estado */}
          <FormError message={error}/>
          <FormSucces message={succes}/>

            {/* Botón de guardar */}
          <Button 
            disabled={isPending || isSubmitting || !hasChanges} 
            type="submit"
              className="w-full bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white font-bold text-lg py-3 rounded-xl shadow-lg transition-colors"
          >
            {isPending || isSubmitting ? (
              <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Guardando...
              </div>
              ) : "Guardar Ajustes"}
          </Button>
        </form>
      </Form>
      </div>
    </div>
  );
}