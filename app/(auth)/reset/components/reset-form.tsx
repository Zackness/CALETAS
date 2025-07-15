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
import { reset } from "@/actions/reset";
import Link from "next/link";

export const ResetForm = () => {
  const [error, setError] = useState<string | undefined>("");
  const [succes, setSucces] = useState<string | undefined>("");

  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof ResetSchema>>({
    resolver: zodResolver(ResetSchema),
    defaultValues: {
      email: ""
    },
  });

  const onSubmit = (values: z.infer<typeof ResetSchema>) => {
    setError("");
    setSucces("");

    startTransition(() => {
      reset(values)
        .then((data) => {
          setError(data?.error);
          setSucces(data?.succes);
        });
    });
  };

  return (
    <CardWrapper headerLabel="¿Olvidaste la contraseña?">
      <h2 className="text-3xl mb-4 text-white text-center font-special pb-4">
        ¿Olvidaste la contraseña?
      </h2>
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
                        label="Email"
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
            <Button 
              disabled={isPending} 
              className="w-full mt-2 font-special text-white" 
              size="sm"
              type="submit"
            >
              Resetear contraseña
            </Button>
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