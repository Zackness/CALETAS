import type { LucideIcon } from "lucide-react";

export type SlashMenuAction = "ai" | "image";

export type SlashMenuItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  keywords: string[];
  /** Texto a insertar (markdown o plano según el editor). */
  insert?: string;
  action?: SlashMenuAction;
  /** Sin permiso de producto (p. ej. IA extra). */
  locked?: boolean;
};
