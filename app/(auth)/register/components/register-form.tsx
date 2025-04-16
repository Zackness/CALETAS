"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { useState, useTransition } from "react";
import Input from "@/components/input";
import { CardWrapper } from "@/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { RegisterSchema } from "@/schemas";
import { FormError } from "@/components/form-error";
import { FormSucces } from "@/components/form-succes";
import { register } from "@/actions/register";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";

interface RegisterFormProps {
  companies: { id: string; nombre: string }[];
}

export const RegisterForm = ({ companies }: RegisterFormProps) => {
  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");
  const [step, setStep] = useState(1);
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof RegisterSchema>>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      email: "",
      password: "",
      name: "",
      cedula: "",
      telefono: "",
      empresa: "",
      codigo: "",
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

  const handleNextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger(["name", "email", "password"]);
      if (isValid) {
        setStep(step + 1);
      }
    } else if (step === 2) {
      const isValid = await form.trigger(["empresa", "codigo"]);
      if (isValid) {
        setStep(step + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <CardWrapper headerLabel="Bienvenido" showSocial>
      <motion.h2
        className="text-3xl font-bold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Registro - Paso {step} de 3
      </motion.h2>
      <div className="flex flex-col gap-4">
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            {step === 1 && (
              <div className="flex flex-col gap-4 text-white">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} disable={isPending} label="Nombre de usuario" id="name" />
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
                        <Input {...field} disable={isPending} label="Contraseña" id="password" type="password" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {step === 2 && (
              <div className="flex flex-col gap-4 text-white">
                <FormField
                  control={form.control}
                  name="empresa"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                            <SelectValue placeholder="Selecciona una empresa" />
                          </SelectTrigger>
                          <SelectContent>
                            {companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.nombre}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="codigo"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} disable={isPending} label="Código" id="codigo" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            {step === 3 && (
              <div className="flex flex-col gap-4 text-white">
                <FormField
                  control={form.control}
                  name="cedula"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} disable={isPending} label="Cédula" id="cedula" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="telefono"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} disable={isPending} label="Teléfono" id="telefono" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            <FormError message={error} />
            <FormSucces message={succes} />
            <div className="flex justify-between">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={handlePrevStep} className="bg-gray-800 text-white hover:bg-gray-700 border-gray-700">
                  Atrás
                </Button>
              )}
              {step < 3 ? (
                <Button type="button" variant="form" onClick={handleNextStep}>
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" variant="form" disabled={isPending}>
                  Registrarse
                </Button>
              )}
            </div>
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