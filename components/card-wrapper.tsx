"use client";

import { Card, CardContent } from "./ui/card";

interface CardWrapperProps {
    children: React.ReactNode;
    headerLabel: string;
    showSocial?: boolean;
};

export const CardWrapper = ({
    children,
}: CardWrapperProps) => {
    return (
        <Card className="bg-fm-blue-1 px-8 pt-8 self-center md:w-2/3 sm:max-w-lg rounded-xl w-full border-2">
            <CardContent>
            {children}
            </CardContent>
        </Card>
    );
};