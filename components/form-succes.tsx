import { CheckCircledIcon } from "@radix-ui/react-icons";

interface FromSuccesProps {
    message?: string;
};

export const FormSucces = ({
    message,
}: FromSuccesProps ) => {
    if (!message) return null;

    return (
        <div className="bg-fm-green/15 p-3 rounded-xl flex items-center gap-x-2
        text-sm text-fm-green">
            <CheckCircledIcon className="h-4 w-4" />
            <p>{message}</p>
        </div>
    );

};