"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, } from "@/components/ui/form"
import { useCallback, useState, useTransition } from "react";
import Input from "@/components/input";
import { CardWrapper } from "./card-wrapper";
import { Button } from "../ui/button";
import { NewPasswordSchema } from "@/schemas";
import { FormError } from "../form-error";
import { FormSucces } from "../form-succes"
import { newPassword } from "@/actions/new-password";
import { useSearchParams } from "next/navigation";


export const NewPasswordForm = () => {
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

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
            newPassword(values, token)
            .then((data) => {
                setError(data?.error);
                setSucces(data?.succes);
            });
        });
    };
    return (
        <CardWrapper 
            headerLabel="Escribe tu nueva contraseña" 
            >
                    <h2 className="text-4xl mb-8 font-semibold">Escribe tu nueva contraseña</h2>
                    <div className="flex flex-col gap-4">
                    <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-4">
                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) =>(
                                    <FormItem>
                                        <FormControl>
                                            <Input 
                                                {...field}
                                                disable={isPending}
                                                label="Password"
                                                
                                                id="password"
                                                type="password"
                                                
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            
                        </div>
                               
                            <FormError message={error}/>
                            <FormSucces message={succes}/>

                            <Button disabled={isPending} className="w-full mt-4" size="lg" variant="form" type="submit">
                                Resetear contraseña
                            </Button>

                    </form>
                    </Form>
                    </div>
                    <div className="flex items-baseline">
                    <p className="mt-12 text-sm">
                        ¿Camino incorrecto?
                    </p>
                    <span className="ml-2 hover:underline cursor-pointer font-semibold text-sm">
                        <a href="/auth/login">Inicia sesion ahora</a>
                    </span>
                    </div>
                    
        </CardWrapper>
    );
};