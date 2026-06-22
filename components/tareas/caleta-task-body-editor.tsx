"use client";

import { PlainTextEditorSlash } from "@/components/editor/plain-text-editor-slash";
import { filterCaletaTaskSlashItems } from "@/lib/tareas/slash-blocks";
import { CaletaNotionBodyEditor } from "./caleta-notion-body-editor";

const AI_UPSELL_HREF = "/suscripcion";

export function CaletaTaskBodyEditor({
  value,
  onChange,
  onBlur,
  editorKey,
  placeholder,
  autoFocus,
  hasAiWriting,
  taskTitle,
}: {
  value: string;
  onChange: (text: string) => void;
  onBlur?: () => void;
  editorKey: string;
  placeholder?: string;
  autoFocus?: boolean;
  hasAiWriting: boolean;
  taskTitle: string;
}) {
  return (
    <PlainTextEditorSlash
      value={value}
      onChange={onChange}
      hasAiWriting={hasAiWriting}
      aiUpsellHref={AI_UPSELL_HREF}
      filterItems={(q) =>
        filterCaletaTaskSlashItems(q, { showAi: true, aiLocked: !hasAiWriting })
      }
      onAiSubmit={async ({ instructions, contentBefore, contentAfter }) => {
        const res = await fetch("/api/tareas/ai/fragment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            instructions,
            taskTitle,
            contentBefore,
            contentAfter,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "No se pudo generar el texto");
        return data.content as string;
      }}
    >
      {(slash) => (
        <CaletaNotionBodyEditor
          editorKey={editorKey}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          autoFocus={autoFocus}
          slash={slash}
        />
      )}
    </PlainTextEditorSlash>
  );
}
