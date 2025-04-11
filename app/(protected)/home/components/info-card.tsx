import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InfoCardProps {
    numberOfItems: number;
    label: string;
    type: "pending" | "approved" | "inProcess" | "completed" | "none" | "rejected";
}

export const InfoCard = ({
    numberOfItems,
    label,
    type,
}: InfoCardProps) => {
    const getCardStyles = () => {
        if (numberOfItems === 0) {
            return "border-2";
        }

        switch (type) {
            case "pending":
                return "border-2 border-amber-200 bg-amber-500 hover:bg-amber-400 transition-colors";
            case "approved":
                return "border-2 border-purple-200 bg-purple-500 hover:bg-purple-400 transition-colors";
            case "inProcess":
                return "border-2 border-blue-200 bg-blue-500 hover:bg-blue-400 transition-colors";
            case "completed":
                return "border-2 border-green-200 bg-green-500 hover:bg-green-400 transition-colors";
            case "rejected":
                return "border-2 border-red-200 bg-red-500 hover:bg-red-400 transition-colors";            
            default:
                return "border-2";
        }
    };

    const getTitleStyles = () => {
        if (numberOfItems === 0) {
            return "text-sm font-medium text-foreground";
        }

        switch (type) {
            case "pending":
                return "text-sm font-medium text-background";
            case "approved":
                return "text-sm font-medium text-background";
            case "inProcess":
                return "text-sm font-medium text-background";
            case "completed":
                return "text-sm font-medium text-background";
            case "rejected":
                return "text-sm font-medium text-background";
            default:
                return "text-sm font-medium text-foreground";
        }
    };

    const getContentStyles = () => {
        if (numberOfItems === 0) {
            return "text-3xl font-bold text-foreground";
        }

        switch (type) {
            case "pending":
                return "text-3xl font-bold text-background";
            case "approved":
                return "text-3xl font-bold text-background";
            case "inProcess":
                return "text-3xl font-bold text-background";
            case "completed":
                return "text-3xl font-bold text-background";
            case "rejected":
                return "text-3xl font-bold text-background";             
            default:
                return "text-3xl font-bold text-foreground";
        }
    };

    return (
        <Card className={cn("w-full", getCardStyles())}>
            <CardHeader className="pb-2">
                <CardTitle className={cn(getTitleStyles())}>
                    {label}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className={cn(getContentStyles())}>{numberOfItems}</p>
            </CardContent>
        </Card>
    );
}