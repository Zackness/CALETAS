"use client";

import { Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function IaChatThinkingIndicator({
  status,
  thinking,
  className,
}: {
  status: string;
  thinking?: string | null;
  className?: string;
}) {
  const showThinking = Boolean(thinking?.trim());

  return (
    <div className={cn("space-y-2", className)}>
      <div className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-white/10 bg-[#1C2D20]/80 px-3.5 py-2.5 text-sm text-white/75">
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <Sparkles className="h-4 w-4 animate-pulse text-[var(--accent-hex)]" />
        </span>
        <span className="min-w-0 leading-snug">
          <span className="text-white/90">{status}</span>
          <span className="ml-1 inline-flex gap-0.5 align-middle" aria-hidden>
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-[var(--accent-hex)] [animation-delay:0ms]" />
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-[var(--accent-hex)] [animation-delay:120ms]" />
            <span className="inline-block h-1 w-1 animate-bounce rounded-full bg-[var(--accent-hex)] [animation-delay:240ms]" />
          </span>
        </span>
      </div>

      {showThinking ? (
        <details
          open
          className="rounded-xl border border-[color-mix(in_oklab,var(--accent-hex)_25%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_8%,#1C2D20)] px-3 py-2"
        >
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-medium text-[var(--accent-hex)] [&::-webkit-details-marker]:hidden">
            <Brain className="h-3.5 w-3.5 shrink-0" />
            Razonando…
          </summary>
          <p className="mt-2 max-h-40 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap text-white/60">
            {thinking}
          </p>
        </details>
      ) : null}
    </div>
  );
}
