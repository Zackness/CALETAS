"use client";

import { Card, CardContent} from "../ui/card";

interface CardWrapperProps {
    children: React.ReactNode;
    headerLabel: string;
    showSocial?: boolean;
};

export const CardWrapper = ({
    children,
}: CardWrapperProps) => {
    return (
        <Card className="bg-fm-blue-1 p-16 self-center mt-2 md:w-2/3 sm:max-w-lg rounded-xl w-full">
            <CardContent>
            {children}
            </CardContent>
        </Card>
    );
};