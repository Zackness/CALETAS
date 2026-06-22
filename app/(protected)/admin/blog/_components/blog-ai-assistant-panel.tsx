"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  generateBlogWithAi,
  type BlogAiArticleResult,
  type BlogAiMode,
  type BlogAiSeoResult,
} from "@/lib/actions/blog-ai";
import type { BlogCategory } from "@prisma/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function isArticleResult(
  r: BlogAiArticleResult | BlogAiSeoResult
): r is BlogAiArticleResult {
  return "title" in r && "content" in r;
}

export function BlogAiAssistantPanel({
  category,
  currentTitle,
  currentContent,
  onApplyArticle,
  onApplySeo,
}: {
  category: BlogCategory;
  currentTitle: string;
  currentContent: string;
  onApplyArticle: (data: BlogAiArticleResult) => void;
  onApplySeo: (data: BlogAiSeoResult) => void;
}) {
  const [instructions, setInstructions] = useState("");
  const [pending, startTransition] = useTransition();

  function run(mode: BlogAiMode) {
    const hasDraft = currentTitle.trim() || currentContent.trim();
    if (mode === "improve" && !hasDraft) {
      toast.error("Escribe un borrador antes de pedir mejoras.");
      return;
    }
    if (mode === "generate" && hasDraft) {
      if (!window.confirm("¿Reemplazar título y contenido actuales con lo que genere la IA?")) {
        return;
      }
    }

    startTransition(async () => {
      try {
        const result = await generateBlogWithAi({
          mode,
          instructions,
          category,
          currentTitle: currentTitle || undefined,
          currentContent: currentContent || undefined,
        });
        if (isArticleResult(result)) {
          onApplyArticle(result);
          toast.success(
            mode === "generate" ? "Artículo generado" : "Borrador mejorado con IA"
          );
        } else {
          onApplySeo(result);
          toast.success("Metadatos SEO generados");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error con la IA");
      }
    });
  }

  return (
    <div className="rounded-xl border border-[#40C9A9]/25 bg-[#40C9A9]/5 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-[#40C9A9]" />
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground)]">
          Asistente IA
        </p>
      </div>
      <p className="mt-1 text-[11px] leading-snug text-[var(--muted-foreground)]">
        Redacción alineada con la marca STARTUPVEN. Describe el tema o qué necesitas.
      </p>

      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        rows={4}
        disabled={pending}
        placeholder="Ej.: Artículo sobre por qué una pyme necesita infraestructura digital antes que más redes sociales…"
        className={cn(
          "mt-3 w-full resize-y rounded-lg border border-[var(--border)] bg-[var(--background)] px-2.5 py-2 text-sm",
          "text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#40C9A9]/35"
        )}
      />

      <div className="mt-3 flex flex-col gap-2">
        <Button
          type="button"
          size="sm"
          className="w-full justify-center gap-1.5"
          disabled={pending}
          onClick={() => run("generate")}
        >
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Generar artículo
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={() => run("improve")}
        >
          Mejorar borrador
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="w-full text-xs"
          disabled={pending}
          onClick={() => run("seo")}
        >
          Solo meta SEO
        </Button>
      </div>
    </div>
  );
}
