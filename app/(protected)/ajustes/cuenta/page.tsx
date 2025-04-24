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
import { UserRole } from "@prisma/client";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-hot-toast";

export default function Ajustes() {
  const user = useCurrentUser();
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
    <div className="w-full flex flex-col items-center text-foreground py-10">
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-[#4cac27] to-[#EAD70E] text-white/0 bg-clip-text">
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
                      disabled={isPending || isSubmitting}
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
                      disabled={isPending || isSubmitting}
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
                      disabled={isPending || isSubmitting}
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