"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircleIcon } from "lucide-react";
import Link from "next/link";

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
    href: string;
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
          <Link
            href={action.href}
            className="ml-2 text-sm font-medium underline hover:text-opacity-80"
          >
            {action.label}
          </Link>
        )}
      </div>
    </div>
  );
} 