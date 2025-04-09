import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface InfoCardProps {
    numberOfItems: number;
    label: string;
}

export const InfoCard = ({
    numberOfItems,
    label,
}: InfoCardProps) => {
    return (
        <Card className="border-2 w-full">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-3xl font-bold">{numberOfItems}</p>
            </CardContent>
        </Card>
    );
}