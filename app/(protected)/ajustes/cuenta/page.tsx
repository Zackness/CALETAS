"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { settings } from "@/actions/settings";
import { Button } from "@/components/ui/button";
import { useTransition, useState } from "react";
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

export default function Ajustes() {
  const user = useCurrentUser();
  const { update } = useSession();

  const [error, setError] = useState<string | undefined>();
  const [succes, setSucces] = useState<string | undefined>();

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

  const onSubmit = (values: z.infer<typeof SettingsSchema>) => {
    startTransition(() => {
      settings(values)
      .then((data) => {
        if (data.error) {
          setError(data.error);
        }

        if (data.succes) {
          update();
          setSucces(data.succes);
        }
      })
      .catch(() => setError("Algo ha salido mal!"));
    });
  }

  return (
    <div className="w-full flex flex-col items-center text-foreground h-full">
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
                      disabled={isPending}
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
                      disabled={isPending}
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
                      disabled={isPending}
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
                      disabled={isPending}
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
                        disabled={isPending}
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
                        disabled={isPending}
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
                        disabled={isPending}
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
                      <Switch 
                        disabled={isPending}
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}
          </div>
          <FormError message={error}/>
          <FormSucces message={succes}/>
          <Button 
            disabled={isPending} 
            type="submit"
            variant="form"
            >
            Guardar ajustes
          </Button>
        </form>
      </Form>
    </div>
  );
}