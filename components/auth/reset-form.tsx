"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage, } from "@/components/ui/form"
import { useState, useTransition } from "react";
import Input from "@/components/input";
import { CardWrapper } from "./card-wrapper";
import { Button } from "../ui/button";
import { ResetSchema } from "@/schemas";
import { FormError } from "../form-error";
import { FormSucces } from "../form-succes"
import { reset } from "@/actions/reset";


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
        <CardWrapper 
            headerLabel="¿Olvidaste la contraseña?" 
            >
                    <h2 className="text-4xl mb-8 font-semibold text-white">¿Olvidaste la contraseña?</h2>
                    <div className="flex flex-col gap-4">
                    <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) =>(
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
                               
                            <FormError message={error}/>
                            <FormSucces message={succes}/>

                            <Button disabled={isPending} className="w-full mt-4 text-white" size="lg" variant="form" type="submit">
                                Resetear contraseña
                            </Button>

                    </form>
                    </Form>
                    </div>
                    <div className="flex items-baseline">
                    <p className="mt-12 text-sm text-white">
                        ¿Ya conoces el camino?
                    </p>
                    <span className="ml-2 hover:underline cursor-pointer font-semibold text-sm text-white">
                        <a href="/auth/login">Inicia sesion ahora</a>
                    </span>
                    </div>
                    
        </CardWrapper>
    );
};