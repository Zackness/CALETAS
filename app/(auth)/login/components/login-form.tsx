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
import { login } from "@/actions/login";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export const LoginForm = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
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