"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useState, useTransition, useEffect } from "react";
import Input from "@/components/input";
import { CardWrapper } from "@/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { RegisterSchema } from "@/schemas";
import { FormError } from "@/components/form-error";
import { FormSucces } from "@/components/form-succes";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthFormActions } from "@/app/(auth)/components/auth-form-actions";
import { AuthPasswordHint } from "@/app/(auth)/components/auth-password-hint";
import { AuthRecoverPasswordLink } from "@/app/(auth)/components/auth-recover-password-link";

export const RegisterForm = () => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof RegisterSchema>) => {
    setError("");
    setSucces("");

    startTransition(() => {
      (async () => {
        try {
          const { error: signUpError } = await authClient.signUp.email({
            name: values.name,
            email: values.email,
            password: values.password,
            callbackURL: "/new-verification?success=1",
          });

          if (signUpError) {
            setError(signUpError.message || "Algo ha salido mal!");
            return;
          }

          try {
            await fetch("/api/user/email/verification-code/send", { method: "POST" });
          } catch {
            // silencioso: el onboarding puede reenviar
          }

          form.reset();
          setSucces("Cuenta creada. Te enviamos un código para verificar tu correo en el onboarding.");
          router.push("/onboarding");
        } catch {
          setError("Algo ha salido mal!");
        }
      })();
    });
  };

  if (!isMounted) {
    return null;
  }

  return (
    <CardWrapper showSocial>
      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        {...field}
                        disable={isPending}
                        label="Nombre completo"
                        id="name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
            </div>

            <AuthPasswordHint />

            <FormError message={error} />
            <FormSucces message={succes} />

            <input type="hidden" name="acceptTerms" value="true" />

            <AuthFormActions>
              <Button
                disabled={isPending}
                className="chalk-hero-btn chalk-hero-btn-primary !w-full sm:!min-w-0"
                size="sm"
                type="submit"
              >
                Crear cuenta
              </Button>
            </AuthFormActions>

            <AuthRecoverPasswordLink className="pt-1" />
          </form>
        </Form>
      </div>
      <div className="mt-6 flex flex-col items-center justify-center gap-1 text-center sm:flex-row">
        <p className="text-sm text-white/75">¿Ya tienes cuenta?</p>
        <Link
          href="/login"
          className="text-sm font-semibold text-[var(--caleta-accent)] transition-colors hover:text-white"
        >
          Inicia sesión
        </Link>
      </div>
    </CardWrapper>
  );
};
