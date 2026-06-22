"use client";

import { useState } from "react";
import { Bot, Check, Pencil, RotateCcw, UserRound, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { IAChatMessage } from "@/lib/ia-chat-store";
import { IaChatMarkdown } from "@/components/ia/chat-markdown";
import { IaChatThinkingIndicator } from "@/components/ia/chat-thinking-indicator";

export function ChatMessageBubble({
  message,
  isUser,
  isEditing,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onRetry,
  sending,
  canEdit,
  isStreaming = false,
  streamStatus,
  streamThinking,
}: {
  message: IAChatMessage;
  isUser: boolean;
  isEditing: boolean;
  editDraft: string;
  onEditDraftChange: (v: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onRetry: () => void;
  sending: boolean;
  /** Solo mensajes de usuario (no el primero del hilo si es único saludo). */
  canEdit: boolean;
  isStreaming?: boolean;
  streamStatus?: string | null;
  streamThinking?: string | null;
}) {
  const [hovered, setHovered] = useState(false);
  const isError = !isUser && message.error === true;

  return (
    <div
      className={cn("flex gap-3", isUser ? "flex-row-reverse" : "flex-row")}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
          isUser
            ? "bg-[color-mix(in_oklab,var(--accent-hex)_25%,var(--mygreen-light))] text-[var(--accent-hex)]"
            : "bg-white/10 text-white/70",
        )}
      >
        {isUser ? <UserRound className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div
        className={cn(
          "min-w-0 max-w-[85%] sm:max-w-[78%]",
          isUser ? "text-right" : "text-left",
        )}
      >
        {isEditing ? (
          <div className="space-y-2 rounded-2xl border border-[var(--accent-hex)]/40 bg-[var(--mygreen-dark)] p-3 text-left">
            <Textarea
              value={editDraft}
              onChange={(e) => onEditDraftChange(e.target.value)}
              className="min-h-[80px] resize-y border-white/15 bg-[var(--mygreen)] text-sm text-white"
              disabled={sending}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-8 border-white/20 bg-[#1C2D20] text-white/80 hover:bg-white/10"
                onClick={onCancelEdit}
                disabled={sending}
              >
                <X className="mr-1 h-3.5 w-3.5" />
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                className="h-8 bg-[var(--accent-hex)] text-[#1C2D20] hover:opacity-90"
                onClick={onSaveEdit}
                disabled={sending || !editDraft.trim()}
              >
                <Check className="mr-1 h-3.5 w-3.5" />
                Guardar y reenviar
              </Button>
            </div>
          </div>
        ) : (
          <>
            {isUser ? (
              <div className="inline-block rounded-2xl border border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_22%,var(--mygreen-light))] px-4 py-2.5 text-left text-sm leading-relaxed whitespace-pre-wrap text-white">
                {message.content}
              </div>
            ) : isError ? (
              <div className="inline-block rounded-2xl border border-red-400/35 bg-red-950/30 px-4 py-2.5 text-left text-sm leading-relaxed whitespace-pre-wrap text-red-100">
                {message.content}
              </div>
            ) : (
              <div className="text-left space-y-2">
                {isStreaming && !message.content.trim() ? (
                  <IaChatThinkingIndicator
                    status={streamStatus ?? "Pensando en tu respuesta…"}
                    thinking={streamThinking}
                  />
                ) : null}
                {isStreaming && streamThinking?.trim() && message.content.trim() ? (
                  <details
                    open
                    className="rounded-xl border border-[color-mix(in_oklab,var(--accent-hex)_25%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_8%,#1C2D20)] px-3 py-2"
                  >
                    <summary className="cursor-pointer list-none text-xs font-medium text-[var(--accent-hex)] [&::-webkit-details-marker]:hidden">
                      Ver razonamiento
                    </summary>
                    <p className="mt-2 max-h-32 overflow-y-auto text-xs leading-relaxed whitespace-pre-wrap text-white/60">
                      {streamThinking}
                    </p>
                  </details>
                ) : null}
                {message.content.trim() || !isStreaming ? (
                  <IaChatMarkdown content={message.content} streaming={isStreaming} />
                ) : null}
              </div>
            )}

            {isError ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {message.errorDetail ? (
                  <span className="text-xs text-red-200/80">{message.errorDetail}</span>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 border-[var(--accent-hex)]/45 bg-[#1C2D20] text-[var(--accent-hex)] hover:bg-white/10"
                  onClick={onRetry}
                  disabled={sending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Volver a intentar
                </Button>
              </div>
            ) : null}

            {isUser && canEdit && !sending ? (
              <div
                className={cn(
                  "mt-1 flex justify-end gap-1 transition-opacity",
                  hovered || isEditing ? "opacity-100" : "opacity-100 sm:opacity-0",
                )}
              >
                <button
                  type="button"
                  onClick={onStartEdit}
                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-white/55 hover:bg-white/10 hover:text-white"
                  aria-label="Editar mensaje"
                >
                  <Pencil className="h-3 w-3" />
                  Editar
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
