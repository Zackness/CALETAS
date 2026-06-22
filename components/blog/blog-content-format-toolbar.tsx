"use client";

import {
  Bold,
  Code2,
  FileCode,
  Heading2,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BlogEditorFormatAction } from "./blog-editor-api";
import { cn } from "@/lib/utils";

export type BlogWritingMode = "rich" | "markdown";

export function BlogContentFormatToolbar({
  mode,
  onModeChange,
  onFormat,
  onInsertImage,
  className,
}: {
  mode: BlogWritingMode;
  onModeChange: (mode: BlogWritingMode) => void;
  onFormat: (action: BlogEditorFormatAction) => void;
  onInsertImage: () => void;
  className?: string;
}) {
  const btnClass = "h-8 w-8 shrink-0";

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-1 px-4 py-2 sm:px-6",
        className
      )}
    >
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass}
        onClick={() => onFormat("bold")}
        title="Negrita"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass}
        onClick={() => onFormat("italic")}
        title="Cursiva"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass}
        onClick={() => onFormat("h2")}
        title="Subtítulo"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass}
        onClick={() => onFormat("ul")}
        title="Lista"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass}
        onClick={() => onFormat("ol")}
        title="Lista numerada"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className={btnClass}
        onClick={() => onFormat("link")}
        title="Enlace"
      >
        <Link2 className="h-4 w-4" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 gap-1.5 px-2 text-xs"
        onClick={onInsertImage}
        title="Abrir galería de imágenes"
      >
        <ImagePlus className="h-4 w-4" />
        Imagen
      </Button>

      <div className="mx-1 h-6 w-px shrink-0 bg-[var(--border)]" aria-hidden />

      <div className="flex shrink-0 items-center gap-0.5 rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 p-0.5">
        <button
          type="button"
          onClick={() => onModeChange("rich")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            mode === "rich"
              ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <Type className="h-3.5 w-3.5" />
          Visual
        </button>
        <button
          type="button"
          onClick={() => onModeChange("markdown")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            mode === "markdown"
              ? "bg-[var(--background)] text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          )}
        >
          <FileCode className="h-3.5 w-3.5" />
          Markdown
        </button>
      </div>

      {mode === "markdown" ? (
        <span className="ml-auto hidden text-[10px] text-[var(--muted-foreground)] sm:inline-flex sm:items-center sm:gap-1">
          <Code2 className="h-3 w-3" />
          Sintaxis Markdown
        </span>
      ) : null}
    </div>
  );
}
