"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import type { BlogEditorFormatAction, BlogPostBodyEditorApi } from "./blog-editor-api";
import { cn } from "@/lib/utils";

function wrapSelection(
  textarea: HTMLTextAreaElement,
  before: string,
  after: string,
  placeholder = ""
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end) || placeholder;
  const next =
    textarea.value.slice(0, start) + before + selected + after + textarea.value.slice(end);
  const cursor = start + before.length + selected.length + after.length;
  return { next, cursor };
}

function insertAtCursor(textarea: HTMLTextAreaElement, insert: string) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const next = textarea.value.slice(0, start) + insert + textarea.value.slice(end);
  const cursor = start + insert.length;
  return { next, cursor };
}

export type BlogMarkdownSlashProps = {
  onMarkdownKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onMarkdownChange?: (v: string, el: HTMLTextAreaElement) => void;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
};

export const BlogMarkdownBody = forwardRef<
  BlogPostBodyEditorApi,
  {
    value: string;
    onChange: (v: string) => void;
    className?: string;
    slash?: BlogMarkdownSlashProps;
  }
>(function BlogMarkdownBody({ value, onChange, className, slash }, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function apply(fn: () => { next: string; cursor: number }) {
    const el = textareaRef.current;
    if (!el) return;
    const { next, cursor } = fn();
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(cursor, cursor);
    });
  }

  useImperativeHandle(ref, () => ({
    runFormat(action: BlogEditorFormatAction) {
      const el = textareaRef.current;
      if (!el) return;
      switch (action) {
        case "bold":
          apply(() => wrapSelection(el, "**", "**", "texto"));
          break;
        case "italic":
          apply(() => wrapSelection(el, "_", "_", "texto"));
          break;
        case "h2":
          apply(() => wrapSelection(el, "## ", "\n", "Título"));
          break;
        case "ul":
          apply(() => wrapSelection(el, "- ", "\n", "elemento"));
          break;
        case "ol":
          apply(() => wrapSelection(el, "1. ", "\n", "elemento"));
          break;
        case "link":
          apply(() => wrapSelection(el, "[", "](https://)", "enlace"));
          break;
      }
    },
    insertImageMarkdown(url: string, alt: string) {
      const el = textareaRef.current;
      if (!el) return;
      const md = `\n\n![${alt}](${url})\n\n`;
      apply(() => insertAtCursor(el, md));
    },
    insertImageRich() {
      /* no aplica en modo markdown */
    },
  }));

  return (
    <textarea
      ref={(el) => {
        textareaRef.current = el;
        if (slash?.textareaRef) slash.textareaRef.current = el;
      }}
      data-blog-markdown-body
      value={value}
      onKeyDown={slash?.onMarkdownKeyDown}
      onChange={(e) => {
        if (slash?.onMarkdownChange) slash.onMarkdownChange(e.target.value, e.target);
        else onChange(e.target.value);
      }}
      rows={18}
      placeholder={'Escribe el artículo… Escribe "/" para insertar bloques o IA'}
      className={cn(
        "min-h-[320px] w-full resize-y rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 font-mono text-sm leading-relaxed text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[#40C9A9]/35",
        className
      )}
    />
  );
});
