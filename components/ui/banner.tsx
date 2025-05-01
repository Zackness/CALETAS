import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircleIcon } from "lucide-react";

const bannerVariants = cva(
  "border text-center p-4 text-sm flex items-center w-full",
  {
    variants: {
      variant: {
        warning: "bg-yellow-100 rounded-md border-yellow-200 text-yellow-800",
        success: "bg-green-100 rounded-md border-green-200 text-green-800"
      }
    },
    defaultVariants: {
      variant: "warning",
    }
  }
);

interface BannerProps extends VariantProps<typeof bannerVariants> {
  label: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const iconMap = {
  warning: AlertTriangle,
  success: CheckCircleIcon,
}

export const Banner = ({
  label,
  variant,
  action,
}: BannerProps) => {
  const Icon = iconMap[variant || "warning"];

  return (
    <div className={cn(bannerVariants({ variant }))}>
      <div className="flex items-center justify-center w-full">
        <Icon className="h-4 w-4 mr-2" />
        <span>{label}</span>
        {action && (
          <button
            onClick={action.onClick}
            className="ml-2 text-sm font-medium underline hover:text-opacity-80"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
} 