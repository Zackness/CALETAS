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
import { register } from "@/actions/register";
import { Eye, EyeOff, Info } from "lucide-react";
import Link from "next/link";

export const RegisterForm = () => {
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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
      register(values).then((data) => {
        setError(data.error);
        setSucces(data.succes);
      });
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
        Registrarse
      </h2>
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
            </div>
            <FormError message={error} />
            <FormSucces message={succes} />
            <Button 
              disabled={isPending} 
              className="w-full mt-2 font-special text-white" 
              size="sm"
              type="submit"
            >
              Registrarse
            </Button>
            
            {/* Mensaje de requisitos de contraseña - sutil */}
            <div className="flex items-start gap-2 mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
              <Info className="h-4 w-4 text-white/60 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-white/70 leading-relaxed">
                <span className="font-medium">Requisitos:</span> Mínimo 6 caracteres, una mayúscula, una minúscula y un número.
              </div>
            </div>
          </form>
        </Form>
      </div>
      <div className="flex items-center justify-center mt-6">
        <p className="text-sm text-white">
          ¿Ya conoces el camino?
        </p>
        <Link href="/login" className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white hover:text-blue-200">
          Inicia sesión ahora
        </Link>
      </div>
    </CardWrapper>
  );
};