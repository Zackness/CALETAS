"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useState, useTransition } from "react";
import Input from "@/components/input";
import { CardWrapper } from "@/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { ResetSchema } from "@/schemas";
import { FormError } from "@/components/form-error";
import { FormSucces } from "@/components/form-succes";
import Link from "next/link";
import { Mail } from "lucide-react";
import { AuthFormActions } from "@/app/(auth)/components/auth-form-actions";
import { requestPasswordResetWithEmailCheck } from "@/lib/actions/password-reset";

export const ResetForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = (values: z.infer<typeof ResetSchema>) => {
    setError("");
    setSucces("");

    startTransition(() => {
      (async () => {
        try {
          const redirectTo = `${window.location.origin}/new-password`;
          const result = await requestPasswordResetWithEmailCheck(
            values.email,
            redirectTo,
          );

          if (!result.ok) {
            setError(result.error);
            return;
          }

          setSucces(result.message);
          form.reset();
        } catch {
          setError("Algo ha salido mal. Intenta de nuevo en unos minutos.");
        }
      })();
    });
  };

  return (
    <CardWrapper>
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-white/10 bg-[#1C2D20] p-4">
        <Mail className="mt-0.5 h-5 w-5 shrink-0 text-[var(--caleta-accent)]" />
        <p className="text-sm leading-relaxed text-white/75">
          Solo enviamos el enlace si el correo está registrado con contraseña. Si no tienes cuenta, puedes{" "}
          <Link href="/register" className="font-semibold text-[var(--caleta-accent)] hover:text-white">
            registrarte aquí
          </Link>
          .
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disable={isPending}
                        label="Correo de tu cuenta"
                        id="email"
                        type="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormError message={error} />
            <FormSucces message={succes} />
            <AuthFormActions>
              <Button
                disabled={isPending}
                className="chalk-hero-btn chalk-hero-btn-primary"
                size="sm"
                type="submit"
              >
                Enviar enlace de recuperación
              </Button>
            </AuthFormActions>
          </form>
        </Form>
      </div>
      <div className="mt-6 flex flex-col items-center justify-center gap-1 text-center sm:flex-row">
        <p className="text-sm text-white/75">¿Recordaste tu contraseña?</p>
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--caleta-accent)] transition-colors hover:text-white"
        >
          Volver a iniciar sesión
        </Link>
      </div>
    </CardWrapper>
  );
};
