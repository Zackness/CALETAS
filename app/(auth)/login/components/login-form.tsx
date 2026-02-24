"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useState, useTransition, useEffect } from "react";
import Input from "@/components/input";
import { CardWrapper } from "@/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { LoginSchema } from "@/schemas";
import { FormError } from "@/components/form-error";
import { FormSucces } from "@/components/form-succes";
import { authClient } from "@/lib/auth-client";
import { DEFAULT_LOGIN_REDIRECT } from "@/routes";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export const LoginForm = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const urlError = searchParams.get("error") || "";

  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<
    "app" | "email" | "backup"
  >("app");
  const [otpSent, setOtpSent] = useState(false);
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
      (async () => {
        try {
          if (showTwoFactor) {
            const code = values.code;
            if (!code) {
              setError("Ingresa el código de verificación");
              return;
            }

            const { error: verifyError } =
              twoFactorMethod === "email"
                ? await authClient.twoFactor.verifyOtp({ code })
                : twoFactorMethod === "backup"
                  ? await authClient.twoFactor.verifyBackupCode({ code })
                  : await authClient.twoFactor.verifyTotp({ code });

            if (verifyError) {
              setError(verifyError.message || "Código inválido");
              return;
            }

            form.reset();
            router.push(callbackUrl || DEFAULT_LOGIN_REDIRECT);
            return;
          }

          const { data, error: signInError } = await authClient.signIn.email({
            email: values.email,
            password: values.password,
            callbackURL: callbackUrl || DEFAULT_LOGIN_REDIRECT,
          });

          if (signInError) {
            // 403: requireEmailVerification
            if (signInError.status === 403) {
              setError("Por favor verifica tu correo para iniciar sesión");
              return;
            }

            setError(signInError.message || "Algo ha salido mal!");
            return;
          }

          if (data && "twoFactorRedirect" in data && (data as any).twoFactorRedirect) {
            setShowTwoFactor(true);
            setSucces("Verifica tu identidad para continuar");
            setTwoFactorMethod("app");
            setOtpSent(false);
            form.setValue("code", "");
            return;
          }

          form.reset();
          router.push(callbackUrl || DEFAULT_LOGIN_REDIRECT);
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
    <CardWrapper 
    headerLabel="Bienvenido" 
    showSocial
    >
      <h2 className="text-3xl mb-4 text-white text-center font-special pb-4">
        Inicia sesión
      </h2>
      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4">
              {showTwoFactor && (
                <>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorMethod("app");
                        setError("");
                        setSucces("");
                        form.setValue("code", "");
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                        twoFactorMethod === "app"
                          ? "bg-white/20 border-white/30 text-white"
                          : "bg-white/10 border-white/10 text-white/80 hover:bg-white/20"
                      }`}
                    >
                      App (Google Authenticator)
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setTwoFactorMethod("email");
                        setError("");
                        setSucces("");
                        form.setValue("code", "");
                        if (!otpSent) {
                          const { error: sendError } =
                            await authClient.twoFactor.sendOtp({});
                          if (sendError) {
                            setError(
                              sendError.message ||
                                "No se pudo enviar el código por correo",
                            );
                            return;
                          }
                          setOtpSent(true);
                          setSucces("Te enviamos un código a tu correo");
                        }
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                        twoFactorMethod === "email"
                          ? "bg-white/20 border-white/30 text-white"
                          : "bg-white/10 border-white/10 text-white/80 hover:bg-white/20"
                      }`}
                    >
                      Correo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTwoFactorMethod("backup");
                        setError("");
                        setSucces("");
                        form.setValue("code", "");
                      }}
                      className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                        twoFactorMethod === "backup"
                          ? "bg-white/20 border-white/30 text-white"
                          : "bg-white/10 border-white/10 text-white/80 hover:bg-white/20"
                      }`}
                    >
                      Backup
                    </button>
                  </div>

                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            {...field}
                            disable={isPending}
                            label={
                              twoFactorMethod === "app"
                                ? "Código de la app"
                                : twoFactorMethod === "backup"
                                  ? "Código de respaldo"
                                  : "Código por correo"
                            }
                            id="code"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {twoFactorMethod === "email" && (
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={async () => {
                        setError("");
                        setSucces("");
                        const { error: sendError } =
                          await authClient.twoFactor.sendOtp({});
                        if (sendError) {
                          setError(
                            sendError.message ||
                              "No se pudo reenviar el código",
                          );
                          return;
                        }
                        setOtpSent(true);
                        setSucces("Código reenviado a tu correo");
                      }}
                      className="text-sm font-semibold text-white/80 hover:text-white underline underline-offset-4"
                    >
                      Reenviar código
                    </button>
                  )}
                </>
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
                          <div className="relative">
                            <Input
                              {...field}
                              disable={isPending}
                              label="Contraseña"
                              id="password"
                              type={showPassword ? "text" : "password"}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5" />
                              ) : (
                                <Eye className="h-5 w-5" />
                              )}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>
            <FormError message={error || urlError} />
            <FormSucces message={succes} />
            <Button 
              disabled={isPending} 
              className="w-full mt-2 font-special text-white" 
              size="sm"
              type="submit"
            >
              {showTwoFactor ? "Confirmar código" : "Iniciar sesión"}
            </Button>
            <div className="text-center">
              <a 
                href="/reset" 
                className="font-semibold text-sm text-white/80 hover:text-white transition-colors"
              >
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </Form>
      </div>
      <div className="flex items-center justify-center mt-6">
        <p className="text-sm text-white">
          ¿Nuevo en Caletas?
        </p>
        <Link href="/register" className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white hover:text-blue-200">
          Regístrate ahora
        </Link>
      </div>
    </CardWrapper>
  );
};