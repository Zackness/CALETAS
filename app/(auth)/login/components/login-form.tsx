"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useState, useTransition } from "react";
import Input from "@/components/input";
import { CardWrapper } from "@/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { LoginSchema } from "@/schemas";
import { FormError } from "@/components/form-error";
import { FormSucces } from "@/components/form-succes";
import { login } from "@/actions/login";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export const LoginForm = () => {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error") === "OAuthAccountNotLinked"
    ? "El correo ya está en uso con un proveedor diferente"
    : "";

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof LoginSchema>>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof LoginSchema>) => {
    setError("");
    setSucces("");

    startTransition(() => {
      login(values, callbackUrl)
        .then((data) => {
          if (data?.error) {
            form.reset();
            setError(data.error);
          }

          if (data?.succes) {
            form.reset();
            setSucces(data.succes);
          }

          if (data?.twoFactor) {
            setShowTwoFactor(true);
          }
        })
        .catch(() => setError("Algo ha salido mal!"));
    });
  };

  return (
    <CardWrapper headerLabel="Bienvenido" showSocial>
      <h2 className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
        Iniciar sesión
      </h2>
      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 text-white">
              {showTwoFactor && (
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          {...field}
                          disable={isPending}
                          label="2FA Code"
                          id="code"
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {!showTwoFactor && (
                <>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            disable={isPending}
                            label="Email"
                            id="email"
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
                        <FormControl>
                          <Input
                            {...field}
                            disable={isPending}
                            label="Contraseña"
                            id="password"
                            type="password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            <div className="flex items-baseline">
              <p className="mt-12 text-sm text-white">
                ¿Olvidaste la contraseña? 
              </p>
              <Button className="ml-2 px-0 text-white" size="sm" variant="link" asChild>
                <Link href="/reset">
                  Recuperar contraseña
                </Link>
              </Button>
            </div>
            <FormError message={error || urlError} />
            <FormSucces message={succes} />
            <Button disabled={isPending} className="w-full mt-4 text-white" size="lg" variant="form" type="submit">
              {showTwoFactor ? "Confirmar código" : "Iniciar sesión"}
            </Button>
          </form>
        </Form>
      </div>
      <div className="flex items-baseline">
        <p className="mt-12 text-sm text-white">
          ¿No tienes una cuenta?
        </p>
        <span className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white">
          <a href="/register">Regístrate ahora</a>
        </span>
      </div>
    </CardWrapper>
  );
};