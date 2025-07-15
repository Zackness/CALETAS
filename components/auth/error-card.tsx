"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export const ErrorCard = () => {
    const searchParams = useSearchParams();
    const error = searchParams.get("error");

    return (
        <Card className="w-[400px] shadow-md">
            <CardHeader>
                <p className="text-2xl font-semibold text-center">
                    🔐 Auth Error
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                    {error === "OAuthAccountNotLinked" 
                        ? "El correo ya está en uso con un proveedor diferente"
                        : "Algo salió mal!"
                    }
                </p>
                <Button asChild className="w-full">
                    <Link href="/login">
                        Volver al login
                    </Link>
                </Button>
            </CardContent>
        </Card>
    );
}; 