"use client";

import { getCaletaTaskIconComponent } from "@/lib/tareas/task-icons";
import { cn } from "@/lib/utils";

export function CaletaTaskIcon({
  icon,
  className,
  strokeWidth = 1.75,
}: {
  icon: string | null | undefined;
  className?: string;
  strokeWidth?: number;
}) {
  const Icon = getCaletaTaskIconComponent(icon);
  return <Icon className={cn("shrink-0", className)} strokeWidth={strokeWidth} aria-hidden />;
}
