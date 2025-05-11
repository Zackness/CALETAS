"use client";

import { Card, CardContent } from "./ui/card";

interface CardWrapperProps {
    children: React.ReactNode;
    showSocial?: boolean;
    headerLabel?: string;
};

export const CardWrapper = ({
    children,
    showSocial,
    headerLabel
}: CardWrapperProps) => {
    return (
        <Card className="bg-fm-blue-1 px-8 pt-8 self-center md:w-2/3 sm:max-w-lg rounded-xl w-full border-2 mb-12">
            <CardContent>
                {headerLabel && (
                    <h2 className="text-2xl font-bold text-center mb-4">{headerLabel}</h2>
                )}
                {children}
            </CardContent>
        </Card>
    );
};