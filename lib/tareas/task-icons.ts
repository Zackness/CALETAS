import type { LucideIcon } from "lucide-react";
import {
  Bell,
  Bookmark,
  Briefcase,
  Calendar,
  CheckSquare,
  Circle,
  Clock,
  FileText,
  Flag,
  Folder,
  Heart,
  Lightbulb,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Rocket,
  Star,
  Tag,
  Target,
  Users,
  Zap,
} from "lucide-react";

export const DEFAULT_CALETA_TASK_ICON = "check-square" as const;

export const CALETA_TASK_ICON_OPTIONS = [
  { key: "check-square", label: "Tarea", Icon: CheckSquare },
  { key: "circle", label: "Punto", Icon: Circle },
  { key: "star", label: "Destacada", Icon: Star },
  { key: "flag", label: "Prioridad", Icon: Flag },
  { key: "bookmark", label: "Marcador", Icon: Bookmark },
  { key: "calendar", label: "Calendario", Icon: Calendar },
  { key: "clock", label: "Tiempo", Icon: Clock },
  { key: "bell", label: "Recordatorio", Icon: Bell },
  { key: "zap", label: "Rápida", Icon: Zap },
  { key: "target", label: "Objetivo", Icon: Target },
  { key: "lightbulb", label: "Idea", Icon: Lightbulb },
  { key: "file-text", label: "Nota", Icon: FileText },
  { key: "folder", label: "Carpeta", Icon: Folder },
  { key: "users", label: "Grupo", Icon: Users },
  { key: "message-circle", label: "Mensaje", Icon: MessageCircle },
  { key: "mail", label: "Correo", Icon: Mail },
  { key: "phone", label: "Llamada", Icon: Phone },
  { key: "map-pin", label: "Ubicación", Icon: MapPin },
  { key: "briefcase", label: "Trabajo", Icon: Briefcase },
  { key: "rocket", label: "Lanzamiento", Icon: Rocket },
  { key: "heart", label: "Favorita", Icon: Heart },
  { key: "tag", label: "Etiqueta", Icon: Tag },
] as const;

export type CaletaTaskIconKey = (typeof CALETA_TASK_ICON_OPTIONS)[number]["key"];

const ICON_BY_KEY = new Map(CALETA_TASK_ICON_OPTIONS.map((o) => [o.key, o.Icon]));
const VALID_KEYS = new Set(CALETA_TASK_ICON_OPTIONS.map((o) => o.key));

export function normalizeCaletaTaskIcon(value: string | null | undefined): CaletaTaskIconKey {
  if (value && VALID_KEYS.has(value as CaletaTaskIconKey)) return value as CaletaTaskIconKey;
  return DEFAULT_CALETA_TASK_ICON;
}

export function getCaletaTaskIconComponent(key: string | null | undefined): LucideIcon {
  return ICON_BY_KEY.get(normalizeCaletaTaskIcon(key)) ?? CheckSquare;
}

export function caletaTaskIconLabel(key: string | null | undefined): string {
  const normalized = normalizeCaletaTaskIcon(key);
  return CALETA_TASK_ICON_OPTIONS.find((o) => o.key === normalized)?.label ?? "Tarea";
}
