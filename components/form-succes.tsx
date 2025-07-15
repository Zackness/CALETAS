import { CheckCircle } from "lucide-react";

interface FromSuccesProps {
    message?: string;
};

export const FormSucces = ({
    message,
}: FromSuccesProps ) => {
    if (!message) return null;

    return (
        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-3 text-sm">
            <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="text-green-300 leading-relaxed">
                <p className="font-medium mb-1">¡Éxito!</p>
                <p className="text-xs text-green-200/80">{message}</p>
            </div>
        </div>
    );
};