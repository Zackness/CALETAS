"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useState, useTransition, useEffect } from "react";
import Input from "@/components/input";
import { CardWrapper } from "@/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { NewPasswordSchema } from "@/schemas";
import { FormError } from "@/components/form-error";
import { FormSucces } from "@/components/form-succes";
import { authClient } from "@/lib/auth-client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthFormActions } from "@/app/(auth)/components/auth-form-actions";
import { AuthPasswordHint } from "@/app/(auth)/components/auth-password-hint";

export const NewPasswordForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setError("El enlace no es válido o expiró. Solicita uno nuevo.");
    }
  }, [token]);

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSucces("");

    startTransition(() => {
      (async () => {
        try {
          if (!token) {
            setError("El enlace no es válido o expiró. Solicita uno nuevo.");
            return;
          }

          const { error: resetError } = await authClient.resetPassword({
            newPassword: values.password,
            token,
          });

          if (resetError) {
            setError(resetError.message || "El enlace expiró o no es válido.");
            return;
          }

          setSucces("Contraseña actualizada. Ya puedes iniciar sesión.");
          form.reset();
          setTimeout(() => router.push("/login"), 2500);
        } catch {
          setError("Algo ha salido mal!");
        }
      })();
    });
  };

  return (
    <CardWrapper>
      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disable={isPending || !token}
                        label="Nueva contraseña"
                        id="password"
                        type="password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <AuthPasswordHint />

            <FormError message={error} />
            <FormSucces message={succes} />

            <AuthFormActions>
              <Button
                disabled={isPending || !token}
                className="chalk-hero-btn chalk-hero-btn-primary !w-full sm:!min-w-0"
                size="sm"
                type="submit"
              >
                Guardar nueva contraseña
              </Button>
            </AuthFormActions>
          </form>
        </Form>
      </div>
      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        {!token ? (
          <Link
            href="/reset"
            className="text-sm font-semibold text-[var(--caleta-accent)] transition-colors hover:text-white"
          >
            Solicitar un nuevo enlace
          </Link>
        ) : null}
        <div className="flex flex-col items-center justify-center gap-1 sm:flex-row">
          <p className="text-sm text-white/75">¿Listo para entrar?</p>
          <Link
            href="/login"
            className="text-sm font-semibold text-[var(--caleta-accent)] transition-colors hover:text-white"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </CardWrapper>
  );
};
