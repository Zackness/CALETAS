import {
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  ImagePlus,
  Sparkles,
  Link2,
  Table,
} from "lucide-react";
import type { SlashMenuItem } from "@/lib/editor/slash-types";

export type BlogSlashItem = SlashMenuItem;

export const BLOG_SLASH_ITEMS: BlogSlashItem[] = [
  {
    id: "h2",
    label: "Subtítulo",
    description: "Encabezado de sección (H2)",
    icon: Heading2,
    keywords: ["titulo", "h2", "heading"],
    insert: "## Título de sección\n\n",
  },
  {
    id: "h3",
    label: "Subtítulo menor",
    description: "Encabezado H3",
    icon: Heading3,
    keywords: ["h3", "subtitulo"],
    insert: "### Subtítulo\n\n",
  },
  {
    id: "ul",
    label: "Lista con viñetas",
    description: "Lista no ordenada",
    icon: List,
    keywords: ["lista", "bullets", "viñetas"],
    insert: "- Primer elemento\n- Segundo elemento\n\n",
  },
  {
    id: "ol",
    label: "Lista numerada",
    description: "Lista ordenada",
    icon: ListOrdered,
    keywords: ["numerada", "ordenada"],
    insert: "1. Primer elemento\n2. Segundo elemento\n\n",
  },
  {
    id: "quote",
    label: "Cita",
    description: "Bloque destacado",
    icon: Quote,
    keywords: ["cita", "quote", "blockquote"],
    insert: "> Texto de la cita.\n\n",
  },
  {
    id: "code",
    label: "Código",
    description: "Bloque de código",
    icon: Code,
    keywords: ["codigo", "code"],
    insert: "```\ncódigo\n```\n\n",
  },
  {
    id: "divider",
    label: "Separador",
    description: "Línea horizontal",
    icon: Minus,
    keywords: ["linea", "hr", "divisor"],
    insert: "\n---\n\n",
  },
  {
    id: "table",
    label: "Tabla",
    description: "Tabla comparativa (Markdown)",
    icon: Table,
    keywords: ["tabla", "table", "comparativa", "columnas"],
    insert: "| Columna 1 | Columna 2 |\n|-----------|----------|\n| Celda 1   | Celda 2   |\n\n",
  },
  {
    id: "link",
    label: "Enlace",
    description: "Texto con enlace",
    icon: Link2,
    keywords: ["link", "url", "enlace"],
    insert: "[texto del enlace](https://)\n\n",
  },
  {
    id: "image",
    label: "Imagen",
    description: "Desde la galería",
    icon: ImagePlus,
    keywords: ["imagen", "foto", "media"],
    action: "image",
  },
  {
    id: "ai",
    label: "Escribir con IA",
    description: "Fragmento en esta posición",
    icon: Sparkles,
    keywords: ["ia", "ai", "generar", "inteligencia"],
    action: "ai",
  },
];

export function filterSlashItems(query: string): BlogSlashItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return BLOG_SLASH_ITEMS;
  return BLOG_SLASH_ITEMS.filter(
    (item) =>
      item.label.toLowerCase().includes(q) ||
      item.id.includes(q) ||
      item.keywords.some((k) => k.includes(q))
  );
}
