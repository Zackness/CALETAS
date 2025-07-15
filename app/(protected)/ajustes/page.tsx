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
  }, [form.watch]);

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
    <div className="w-full flex flex-col items-center text-foreground py-10 bg-mygreen-light">
      <h1 className="font-special text-3xl md:text-3xl mb-8 text-center text-white bg-clip-text">
        Ajustes de la cuenta
      </h1>
        <Form {...form}>
        <form 
          className="space-y-6 w-screen px-20 md:px-48 lg:w-[1135px] lg:px-[200px] 2xl:w-[1615px] 2xl:px-[300px] mb-10" 
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="space-y-4">
            <FormField 
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primer nombre del usuario</FormLabel>
                  <FormControl>
                    <Input
                      className="text-foreground border-none bg-fm-blue-3 rounded-xl"
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
                  <FormLabel>Segundo nombre del usuario</FormLabel>
                  <FormControl>
                    <Input
                      className="border-none bg-fm-blue-3 rounded-xl text-foreground"
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
              name="apellido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primer apellido del usuario</FormLabel>
                  <FormControl>
                    <Input
                      className="border-none bg-fm-blue-3 rounded-xl text-foreground"
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
                  <FormLabel>Segundo apellido del usuario</FormLabel>
                  <FormControl>
                    <Input
                      className="border-none bg-fm-blue-3 rounded-xl text-foreground"
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
                name="cedula"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Cédula de identidad</FormLabel>
                        <FormControl>
                            <Input
                                className="border-none bg-fm-blue-3 rounded-xl text-foreground"
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
                name="ciPhoto"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Subir imagen de cédula</FormLabel>
                        <FormControl>
                            <div className="flex flex-col gap-2">
                                <Input
                                    type="file"
                                    accept="image/*"
                                    className="border-none bg-blue-500 rounded-xl text-foreground"
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
                                    variant="outline"
                                    className="w-full"
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
                        <FormDescription>
                            Sube una imagen de tu cédula para verificar y actualizar tus datos
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}
            />

            {/* Campos de contacto y residencia */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField 
                control={form.control}
                name="telefono"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input
                        className="border-none bg-fm-blue-3 rounded-xl text-foreground"
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
                    <FormLabel>Estado de residencia</FormLabel>
                    <Select
                      disabled={isPending || isSubmitting}
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="border-blue-500 bg-fm-blue-3 rounded-xl text-foreground">
                          <SelectValue placeholder="Selecciona un estado" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.values(EstadoDeResidencia).map((estado) => (
                          <SelectItem key={estado} value={estado}>
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
                  <FormLabel>Ciudad de residencia</FormLabel>
                  <FormControl>
                    <Input
                      className="border-none bg-fm-blue-3 rounded-xl text-foreground"
                      {...field}
                      disabled={isPending || isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {user?.isOAuth === false && (
            <>
              <FormField 
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo del usuario</FormLabel>
                    <FormControl>
                      <Input
                        className="border-none bg-fm-blue-3 rounded-xl text-foreground"
                        {...field}
                        disabled={isPending || isSubmitting}
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField 
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contraseña actual</FormLabel>
                    <FormControl>
                      <Input
                        className="border-none bg-fm-blue-3 rounded-xl text-foreground"
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
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <Input
                        className="border-none bg-fm-blue-3 rounded-xl text-foreground"
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
            </>
            )}

            {user?.isOAuth === false && (
              <FormField 
                control={form.control}
                name="isTwoFactorEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-xl p-3 bg-fm-blue-3">
                    <div className="space-y-0.5">
                      <FormLabel>Autenticacion en dos pasos (2FA)</FormLabel>
                      <FormDescription className="text-foreground">
                        Activa la Autenticacion en dos pasos para tu cuenta (Autenticacion por Email)
                      </FormDescription>
                    </div>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${field.value ? 'text-green-500' : 'text-gray-500'}`}>
                          {field.value ? "Activado" : "Desactivado"}
                        </span>
                        <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${field.value ? 'bg-green-500' : 'bg-gray-400'}`}>
                          <Switch 
                            disabled={isPending || isSubmitting}
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className="absolute inset-0"
                          />
                        </div>
                      </div>
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
          <FormError message={error}/>
          <FormSucces message={succes}/>
          <Button 
            disabled={isPending || isSubmitting || !hasChanges} 
            type="submit"
            variant="form"
            className="w-full mb-8"
          >
            {isPending || isSubmitting ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Guardando...
              </div>
            ) : "Guardar ajustes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}