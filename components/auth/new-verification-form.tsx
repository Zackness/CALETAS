"use client";

import { CardWrapper } from "@/components/card-wrapper";
import { Button } from "@/components/ui/button";
import { FormError } from "@/components/form-error";
import { FormSucces } from "@/components/form-succes";
import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

export const NewVerificationForm = () => {
    const [error, setError] = useState<string | undefined>("");
    const [success, setSuccess] = useState<string | undefined>("");
    const [isPending, startTransition] = useTransition();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const onSubmit = () => {
        if (success || error) return;

        setError("");
        setSuccess("");

        startTransition(() => {
            // TODO: Implementar verificación con Better Auth
            setSuccess("Email verificado exitosamente!");
        });
    };

    return (
        <CardWrapper headerLabel="Verificación de email">
            <h2 className="text-4xl mb-8 font-semibold text-white">Verificación de email</h2>
            <div className="flex flex-col gap-4">
                <p className="text-center text-sm text-white">
                    Verificando tu email...
                </p>
                <FormError message={error} />
                <FormSucces message={success} />
                <Button 
                    disabled={isPending || !!success || !!error} 
                    className="w-full mt-4 text-white" 
                    size="lg" 
                    onClick={onSubmit}
                >
                    Verificar email
                </Button>
            </div>
        </CardWrapper>
    );
}; 