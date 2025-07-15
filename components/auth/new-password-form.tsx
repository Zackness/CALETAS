"use client";

import * as z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormMessage, } from "@/components/ui/form"
import { useState, useTransition } from "react";
import Input from "@/components/input";
import { CardWrapper } from "@/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { NewPasswordSchema } from "@/schemas";
import { FormError } from "@/components/form-error";
import { FormSuccess } from "@/components/form-success";
import { newPassword } from "@/actions/new-password";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export const NewPasswordForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const form = useForm<z.infer<typeof NewPasswordSchema>>({
        resolver: zodResolver(NewPasswordSchema),
        defaultValues: {
            password: "",
        },
    });

    const onSubmit = (values: z.infer<typeof NewPasswordSchema>) => {
        setError("");
        setSuccess("");

        startTransition(() => {
            newPassword(values, token)
                .then((data) => {
                    if (data?.error) {
                        setError(data.error);
                    }
                    if (data?.success) {
                        setSuccess(data.success);
                    }
                })
                .catch(() => setError("Algo ha salido mal!"));
        });
    };

    return (
        <CardWrapper headerLabel="Nueva contraseña">
            <h2 className="text-3xl mb-4 text-white text-center font-special pb-4">Nueva contraseña</h2>
            <div className="flex flex-col gap-4">
                <Form {...form}>
                    <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                        <FormError message={error} />
                        <FormSuccess message={success} />
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
        </CardWrapper>
    );
}; 