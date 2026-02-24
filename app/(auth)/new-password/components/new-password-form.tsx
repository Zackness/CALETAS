"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useState, useTransition } from "react";
import Input from "@/components/input";
import { CardWrapper } from "@/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { NewPasswordSchema } from "@/schemas";
import { FormError } from "@/components/form-error";
import { FormSucces } from "@/components/form-succes";
import { authClient } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";

export const NewPasswordForm = () => {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof NewPasswordSchema>>({
    resolver: zodResolver(NewPasswordSchema),
    defaultValues: {
      password: ""
    },
  });

  const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
    setError("");
    setSucces("");

    startTransition(() => {
      (async () => {
        try {
          if (!token) {
            setError("El token no existe!");
            return;
          }

          const { error: resetError } = await authClient.resetPassword({
            newPassword: values.password,
            token,
          });

          if (resetError) {
            setError(resetError.message || "Token inválido!");
            return;
          }

          setSucces("Contraseña actualizada!");
        } catch {
          setError("Algo ha salido mal!");
        }
      })();
    });
  };

  return (
    <CardWrapper
                 headerLabel="Escribe tu nueva contraseña"
    >
      <h2 className="text-3xl mb-4 text-white text-center font-special pb-4">
        Escribe tu nueva contraseña
      </h2>
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
                      <div className="relative">
                        <Input
                          {...field}
                          disable={isPending}
                          label="Nueva contraseña"
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
            </div>
            <FormError message={error} />
            <FormSucces message={succes} />
            <Button 
              disabled={isPending} 
              className="w-full mt-2 font-special text-white" 
              size="sm"
              type="submit"
            >
              Cambiar contraseña
            </Button>
          </form>
        </Form>
      </div>
      <div className="flex items-center justify-center mt-6">
        <p className="text-sm text-white">
          ¿Camino incorrecto?
        </p>
        <Link href="/login" className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white hover:text-blue-200">
          Inicia sesión ahora
        </Link>
      </div>
    </CardWrapper>
  );
};