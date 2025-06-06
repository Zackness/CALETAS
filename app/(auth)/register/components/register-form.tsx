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
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

export const RegisterForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
    <CardWrapper showSocial>
      <motion.h2
        className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Registro
      </motion.h2>
      <p className="text-xs text-gray-400 my-2 px-5">
        La contraseña debe contener al menos una mayúscula, una minúscula, un número y 6 caracteres de largo.
      </p>              
      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-4 text-white">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input {...field} disable={isPending} label="Ingrese su nombre como en la cedula" id="name" />
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
                      <Input {...field} disable={isPending} label="Email" id="email" type="email" />
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
            <Button type="submit" variant="form" disabled={isPending} className="w-full">
              Registrarse
            </Button>
          </form>
        </Form>
      </div>
      <div className="flex items-baseline">
        <p className="mt-12 text-sm text-white">¿Ya tienes una cuenta?</p>
        <span className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white">
          <a href="/login">Inicia sesión ahora</a>
        </span>
      </div>
    </CardWrapper>
  );
};