"use client";

import { useEffect, useRef } from "react";
import { ensureRichEditorTextAnchor } from "@/lib/blog/rich-text-range";
import { cn } from "@/lib/utils";

export type CaletaNotionSlashProps = {
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onInput?: (el: HTMLDivElement) => void;
  editorRef?: React.RefObject<HTMLDivElement | null>;
};

export function CaletaNotionBodyEditor({
  value,
  onChange,
  onBlur,
  editorKey,
  placeholder = 'Escribe aquí o pulsa Enter para un párrafo nuevo… Escribe "/" para insertar bloques',
  autoFocus,
  slash,
}: {
  value: string;
  onChange: (text: string) => void;
  onBlur?: () => void;
  editorKey: string;
  placeholder?: string;
  autoFocus?: boolean;
  slash?: CaletaNotionSlashProps;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    if (el.innerText !== value) {
      el.innerText = value;
    }
  }, [editorKey, value]);

  useEffect(() => {
    if (!autoFocus || !ref.current) return;
    const t = window.setTimeout(() => ref.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [autoFocus, editorKey]);

  return (
    <div
      ref={(el) => {
        ref.current = el;
        if (slash?.editorRef) slash.editorRef.current = el;
      }}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline
      data-placeholder={placeholder}
      onFocus={(e) => ensureRichEditorTextAnchor(e.currentTarget)}
      onKeyDown={slash?.onKeyDown}
      onKeyUp={(e) => {
        if (e.key === "/") slash?.onInput?.(e.currentTarget);
      }}
      onInput={(e) => {
        const el = e.currentTarget;
        slash?.onInput?.(el);
        onChange(el.innerText.replace(/\r\n/g, "\n"));
      }}
      onBlur={onBlur}
      className={cn(
        "caleta-notion-editor min-h-[52vh] w-full max-w-none cursor-text whitespace-pre-wrap break-words",
        "text-[15px] leading-[1.75] text-white outline-none",
        "focus:outline-none",
        "empty:before:pointer-events-none empty:before:text-white/45 empty:before:content-[attr(data-placeholder)]"
      )}
    />
  );
}
