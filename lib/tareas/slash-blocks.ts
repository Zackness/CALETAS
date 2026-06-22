import {
  CheckSquare,
  Code,
  Heading2,
  Heading3,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Sparkles,
} from "lucide-react";
import type { SlashMenuItem } from "@/lib/editor/slash-types";

export const CALETA_TASK_SLASH_ITEMS: SlashMenuItem[] = [
  {
    id: "h2",
    label: "Subtítulo",
    description: "Título de sección",
    icon: Heading2,
    keywords: ["titulo", "h2", "seccion"],
    insert: "\n\nTítulo de sección\n\n",
  },
  {
    id: "h3",
    label: "Subtítulo menor",
    description: "Apartado dentro de la sección",
    icon: Heading3,
    keywords: ["h3", "subtitulo"],
    insert: "\n\nSubtítulo\n\n",
  },
  {
    id: "ul",
    label: "Lista con viñetas",
    description: "Lista no ordenada",
    icon: List,
    keywords: ["lista", "bullets"],
    insert: "\n- Primer elemento\n- Segundo elemento\n\n",
  },
  {
    id: "ol",
    label: "Lista numerada",
    description: "Lista ordenada",
    icon: ListOrdered,
    keywords: ["numerada", "ordenada"],
    insert: "\n1. Primer elemento\n2. Segundo elemento\n\n",
  },
  {
    id: "todo",
    label: "Lista de tareas",
    description: "Casillas pendientes",
    icon: CheckSquare,
    keywords: ["check", "checkbox", "pendiente"],
    insert: "\n[ ] Tarea pendiente\n[ ] Otra tarea\n\n",
  },
  {
    id: "quote",
    label: "Cita",
    description: "Texto destacado",
    icon: Quote,
    keywords: ["cita", "quote"],
    insert: "\n> Texto destacado.\n\n",
  },
  {
    id: "code",
    label: "Código",
    description: "Bloque monoespaciado",
    icon: Code,
    keywords: ["codigo", "code"],
    insert: "\n```\ncódigo o nota técnica\n```\n\n",
  },
  {
    id: "divider",
    label: "Separador",
    description: "Línea divisoria",
    icon: Minus,
    keywords: ["linea", "hr", "divisor"],
    insert: "\n---\n\n",
  },
  {
    id: "link",
    label: "Enlace",
    description: "Texto con URL",
    icon: Link2,
    keywords: ["link", "url"],
    insert: "\n[texto del enlace](https://)\n\n",
  },
  {
    id: "ai",
    label: "Escribir con IA",
    description: "Asistente CALETAS",
    icon: Sparkles,
    keywords: ["ia", "ai", "generar"],
    locked: false,
  },
];

export function filterCaletaTaskSlashItems(
  query: string,
  opts?: { showAi?: boolean; aiLocked?: boolean }
): SlashMenuItem[] {
  const showAi = opts?.showAi !== false;
  const aiLocked = opts?.aiLocked ?? false;
  let items = CALETA_TASK_SLASH_ITEMS;
  if (!showAi) items = items.filter((i) => i.action !== "ai");
  else if (aiLocked) {
    items = items.map((i) => (i.action === "ai" ? { ...i, locked: true } : i));
  }

  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.id.includes(q) ||
      item.keywords.some((k) => k.includes(q)),
  );
}
