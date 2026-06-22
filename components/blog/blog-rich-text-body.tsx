"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import type { BlogEditorFormatAction, BlogPostBodyEditorApi } from "./blog-editor-api";
import { htmlToMarkdown, markdownToHtml } from "@/lib/blog/content-convert";
import { ensureRichEditorTextAnchor } from "@/lib/blog/rich-text-range";
import { cn } from "@/lib/utils";

export function insertImageInRichEditor(
  editorEl: HTMLDivElement | null,
  url: string,
  alt: string
) {
  if (!editorEl) return;
  editorEl.focus();
  document.execCommand("insertImage", false, url);
  const imgs = editorEl.querySelectorAll("img");
  const last = imgs[imgs.length - 1];
  if (last && !last.getAttribute("alt")) last.setAttribute("alt", alt);
}

export type BlogRichSlashProps = {
  onRichKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onRichInput?: (el: HTMLDivElement) => void;
  richRef?: React.RefObject<HTMLDivElement | null>;
};

export const BlogRichTextBody = forwardRef<
  BlogPostBodyEditorApi,
  {
    value: string;
    onChange: (markdown: string) => void;
    /** Cambia al alternar modo o al cargar el post. */
    syncKey: string;
    className?: string;
    slash?: BlogRichSlashProps;
  }
>(function BlogRichTextBody({ value, onChange, syncKey, className, slash }, ref) {
  const editorRef = useRef<HTMLDivElement>(null);
  const skipInputRef = useRef(false);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || document.activeElement === el) return;
    const html = markdownToHtml(value);
    const nextHtml = html.trim() ? html : "<p><br></p>";
    if (el.innerHTML !== nextHtml) {
      skipInputRef.current = true;
      el.innerHTML = nextHtml;
      skipInputRef.current = false;
      if (!nextHtml.replace(/<br\s*\/?>/gi, "").replace(/<[^>]+>/g, "").trim()) {
        ensureRichEditorTextAnchor(el);
      }
    }
  }, [syncKey, value]);

  function syncFromDom() {
    const el = editorRef.current;
    if (!el || skipInputRef.current) return;
    onChange(htmlToMarkdown(el.innerHTML));
  }

  function exec(cmd: string, val?: string) {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(cmd, false, val);
    syncFromDom();
  }

  useImperativeHandle(ref, () => ({
    runFormat(action: BlogEditorFormatAction) {
      switch (action) {
        case "bold":
          exec("bold");
          break;
        case "italic":
          exec("italic");
          break;
        case "h2":
          exec("formatBlock", "h2");
          break;
        case "ul":
          exec("insertUnorderedList");
          break;
        case "ol":
          exec("insertOrderedList");
          break;
        case "link": {
          const url = window.prompt("URL del enlace", "https://");
          if (url) exec("createLink", url);
          break;
        }
      }
    },
    insertImageMarkdown() {
      /* no aplica en modo visual */
    },
    insertImageRich(url: string, alt: string) {
      insertImageInRichEditor(editorRef.current, url, alt);
      syncFromDom();
    },
  }));

  return (
    <div
      ref={(el) => {
        editorRef.current = el;
        if (slash?.richRef) slash.richRef.current = el;
      }}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-multiline
      data-placeholder={'Escribe el artículo… Escribe "/" para insertar bloques o IA'}
      onFocus={(e) => ensureRichEditorTextAnchor(e.currentTarget)}
      onKeyDown={slash?.onRichKeyDown}
      onKeyUp={(e) => {
        if (e.key === "/") slash?.onRichInput?.(e.currentTarget);
      }}
      onInput={(e) => {
        const el = e.currentTarget;
        slash?.onRichInput?.(el);
        syncFromDom();
      }}
      className={cn(
        "blog-rich-editor min-h-[320px] w-full cursor-text rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3",
        "text-[15px] leading-[1.75] text-[var(--foreground)] outline-none focus:ring-2 focus:ring-[#40C9A9]/35",
        "empty:before:pointer-events-none empty:before:text-[var(--muted-foreground)] empty:before:content-[attr(data-placeholder)]",
        "[&_h2]:mb-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-semibold",
        "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6",
        "[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
        "[&_a]:text-[#40C9A9] [&_a]:underline",
        "[&_img]:my-4 [&_img]:max-w-full [&_img]:rounded-lg",
        "[&_p]:my-2",
        "[&_table]:my-4 [&_table]:w-full [&_table]:min-w-[480px] [&_table]:border-collapse [&_table]:text-sm",
        "[&_th]:border [&_th]:border-white/10 [&_th]:bg-white/5 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold",
        "[&_td]:border [&_td]:border-white/10 [&_td]:px-3 [&_td]:py-2",
        "[&_thead]:bg-white/5",
        "[&_tr]:border-b [&_tr]:border-white/10",
        className
      )}
    />
  );
});
