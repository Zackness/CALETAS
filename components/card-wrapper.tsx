"use client";

import { Social } from "@/app/(auth)/components/social";
import { Card, CardContent, CardDescription, CardFooter } from "@/components/ui/card";

interface CardWrapperProps {
    children: React.ReactNode;
    headerLabel?: string;
    showSocial?: boolean;
};

export const CardWrapper = ({
    children,
    headerLabel,
    showSocial
}: CardWrapperProps) => {
    return (
        <Card className="bg-white/10 backdrop-blur-sm border-white/20 border p-8 self-center mt-2 md:w-2/3 sm:max-w-lg rounded-xl w-full shadow-2xl">
            <CardContent>
            {children}
            </CardContent>
            {showSocial && (
                <CardFooter>
                    <Social />
                </CardFooter>
            )}
        </Card>
    );
};