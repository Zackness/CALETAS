import { AlertCircle } from "lucide-react";

interface FromErrorProps {
    message?: string;
};

export const FormError = ({
    message,
}: FromErrorProps ) => {
    if (!message) return null;

    return (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-start gap-3 text-sm">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="text-red-300 leading-relaxed">
                <p className="font-medium mb-1">Error de validación</p>
                <p className="text-xs text-red-200/80">{message}</p>
            </div>
        </div>
    );
};