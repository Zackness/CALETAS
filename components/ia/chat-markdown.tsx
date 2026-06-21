"use client";

import { MarkdownMath } from "@/components/markdown-math";
import { cn } from "@/lib/utils";

/** Markdown estilo ChatGPT con variables de tema Caletas. */
export function IaChatMarkdown({
  content,
  streaming = false,
  className,
}: {
  content: string;
  streaming?: boolean;
  className?: string;
}) {
  if (streaming && !content) {
    return null;
  }

  if (streaming) {
    return (
      <div
        className={cn(
          "text-sm leading-relaxed text-white/90 whitespace-pre-wrap break-words",
          className,
        )}
      >
        {content}
        <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse rounded-sm bg-[var(--accent-hex)] align-middle" />
      </div>
    );
  }

  return (
    <MarkdownMath
      className={cn(
        [
          "prose prose-invert prose-sm max-w-none text-white/90",
          "prose-headings:mb-2 prose-headings:mt-4 prose-headings:text-white prose-headings:font-semibold",
          "prose-p:my-2 prose-p:leading-7",
          "prose-li:my-0.5 prose-li:leading-7",
          "prose-ol:my-2 prose-ul:my-2",
          "prose-a:text-[var(--accent-hex)] prose-strong:text-white",
          "prose-pre:my-3 prose-pre:overflow-x-auto prose-pre:rounded-xl prose-pre:border prose-pre:border-white/10 prose-pre:bg-[var(--prose-pre-bg)] prose-pre:px-4 prose-pre:py-3",
          "prose-code:rounded prose-code:bg-white/10 prose-code:px-1 prose-code:py-0.5 prose-code:text-[var(--prose-code-text)] prose-code:before:content-none prose-code:after:content-none",
          "prose-pre:code:bg-transparent prose-pre:code:p-0",
          "prose-blockquote:border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] prose-blockquote:text-white/75",
          "prose-hr:border-white/10 prose-table:text-sm",
          "prose-th:border-white/15 prose-td:border-white/10",
        ].join(" "),
        className,
      )}
    >
      {content}
    </MarkdownMath>
  );
}
