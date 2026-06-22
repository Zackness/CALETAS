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
import { KeyRound } from "lucide-react";
import { AuthFormActions } from "@/app/(auth)/components/auth-form-actions";
import { AuthRecoverPasswordLink } from "@/app/(auth)/components/auth-recover-password-link";

export const LoginForm = () => {
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      const preferred = window.localStorage.getItem("caletas-2fa-preferred");
      if (preferred === "EMAIL_OTP") {
        setTwoFactorMethod("email");
      } else {
        setTwoFactorMethod("app");
      }
    }
  }, []);
  
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams?.get("callbackUrl");
  const urlError = searchParams?.get("error") || "";

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
            const code = (values.code ?? "").trim().replace(/\s+/g, "");
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
              const msg = verifyError.message || "";
              if (verifyError.status === 401 && twoFactorMethod === "email") {
                setError(
                  msg.toLowerCase().includes("invalid")
                    ? "Código incorrecto. Si acabas de pedir otro por correo, usa solo el último código recibido o pulsa «Reenviar código»."
                    : msg || "No se pudo verificar el código",
                );
              } else {
                setError(msg || "Código inválido");
              }
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
            const preferred =
              typeof window !== "undefined"
                ? window.localStorage.getItem("caletas-2fa-preferred")
                : null;
            setTwoFactorMethod(preferred === "EMAIL_OTP" ? "email" : "app");
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

  useEffect(() => {
    if (!showTwoFactor || twoFactorMethod !== "email" || otpSent) return;
    (async () => {
      const { error: sendError } = await authClient.twoFactor.sendOtp({});
      if (sendError) {
        setError(sendError.message || "No se pudo enviar el código por correo");
        return;
      }
      setOtpSent(true);
      setSucces("Te enviamos un código a tu correo");
    })();
  }, [showTwoFactor, twoFactorMethod, otpSent]);

  if (!isMounted) {
    return null;
  }

  return (
    <CardWrapper 
    showSocial
    >
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
                        setOtpSent(false);
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
                      onClick={() => {
                        setTwoFactorMethod("email");
                        setOtpSent(false);
                        setError("");
                        setSucces("");
                        form.setValue("code", "");
                        // El envío del OTP lo hace solo el useEffect (evita doble sendOtp: dos códigos en BD y el del correo ya no sirve → 401).
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
                        setOtpSent(false);
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
            <FormError message={error || urlError} />
            <FormSucces message={succes} />
            {!showTwoFactor ? (
              <AuthFormActions>
                <Button
                  disabled={isPending}
                  className="chalk-hero-btn chalk-hero-btn-primary !w-full sm:!min-w-0"
                  size="sm"
                  type="submit"
                >
                  Iniciar sesión
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isPending}
                  className="chalk-hero-btn chalk-hero-btn-secondary !w-full sm:!min-w-0"
                  onClick={async () => {
                    setError("");
                    setSucces("");
                    const { error: passkeyError } = await authClient.signIn.passkey({
                      fetchOptions: {
                        onSuccess() {
                          router.push(callbackUrl || DEFAULT_LOGIN_REDIRECT);
                        },
                      },
                    });
                    if (passkeyError) {
                      const passkeyMessage: string =
                        typeof passkeyError === "string"
                          ? passkeyError
                          : String(
                              (passkeyError as { message?: unknown })?.message ??
                                "No se pudo iniciar con passkey",
                            );
                      setError(passkeyMessage);
                    }
                  }}
                >
                  <KeyRound className="h-4 w-4 shrink-0" />
                  Iniciar con Passkey
                </Button>
              </AuthFormActions>
            ) : (
              <AuthFormActions>
                <Button
                  disabled={isPending}
                  className="chalk-hero-btn chalk-hero-btn-primary !w-full sm:!min-w-0"
                  size="sm"
                  type="submit"
                >
                  Confirmar código
                </Button>
              </AuthFormActions>
            )}
            {!showTwoFactor ? <AuthRecoverPasswordLink className="pt-2" /> : null}
          </form>
        </Form>
      </div>
      <div className="flex items-center justify-center mt-6">
        <p className="text-sm text-white">
          ¿Nuevo en Caletas?
        </p>
        <Link href="/register" className="ml-2 cursor-pointer text-sm font-semibold text-[var(--caleta-accent)] transition-colors hover:text-white">
          Regístrate ahora
        </Link>
      </div>
    </CardWrapper>
  );
};