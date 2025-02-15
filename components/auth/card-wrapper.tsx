"use client";

import { Card, CardContent, CardDescription, CardFooter } from "../ui/card";
import { Social } from "./social";

interface CardWrapperProps {
    children: React.ReactNode;
    headerLabel: string;
    showSocial?: boolean;
};

export const CardWrapper = ({
    children,
    headerLabel,
    showSocial
}: CardWrapperProps) => {
    return (
        <Card className="bg-fm-blue-1 border-fm-blue-2 border-1 p-16 self-center mt-2 md:w-2/3 sm:border-4 sm:border-b-8 sm:max-w-lg rounded-xl w-full">
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