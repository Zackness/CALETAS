import { DialogHeader as UIDialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CustomDialogHeaderProps {
  title: string;
  description?: string;
}

export const CustomDialogHeader = ({ title, description }: CustomDialogHeaderProps) => {
  return (
    <UIDialogHeader>
      <DialogTitle>{title}</DialogTitle>
      {description && <p className="text-sm text-gray-500">{description}</p>}
    </UIDialogHeader>
  );
}; 