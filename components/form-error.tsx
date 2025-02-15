import { ExclamationTriangleIcon } from "@radix-ui/react-icons";

interface FromErrorProps {
    message?: string;
};

export const FormError = ({
    message,
}: FromErrorProps ) => {
    if (!message) return null;

    return (
        <div className="bg-fm-red/15 p-3 rounded-xl flex items-center gap-x-2
        text-sm text-fm-red">
            <ExclamationTriangleIcon className="h-4 w-4" />
            <p>{message}</p>
        </div>
    );

};