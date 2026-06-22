"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { generateBlogFragmentWithAi } from "@/lib/actions/blog-ai";
import { markdownToHtml } from "@/lib/blog/content-convert";
import {
  detectSlashTriggerInEditable,
  getTextBeforeCaret,
  replaceRangeWithHtml,
} from "@/lib/blog/rich-text-range";
import type { BlogCategory } from "@prisma/client";
import type { BlogWritingMode } from "./blog-content-format-toolbar";
import { filterSlashItems, type BlogSlashItem } from "@/lib/blog/slash-blocks";
import { findActiveSlash, getRangeCaretCoords, getTextareaCaretCoords } from "@/lib/blog/slash-utils";
import { BlogSlashMenu } from "./blog-slash-menu";

export type SlashInsertContext = {
  replaceRange: { start: number; end: number };
  insertMarkdown: (md: string) => void;
};

type SlashRange =
  | { kind: "markdown"; start: number; end: number }
  | { kind: "rich"; domRange: Range };

export function BlogEditorSlash({
  mode,
  value,
  onChange,
  articleTitle,
  category,
  onRequestImage,
  onAfterInsert,
  onRichSync,
  children,
}: {
  mode: BlogWritingMode;
  value: string;
  onChange: (v: string) => void;
  articleTitle: string;
  category: BlogCategory;
  onRequestImage: (ctx: SlashInsertContext) => void;
  onAfterInsert?: () => void;
  onRichSync?: (el: HTMLDivElement) => void;
  children: (handlers: {
    onMarkdownKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
    onMarkdownChange: (v: string, el: HTMLTextAreaElement) => void;
    onRichKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    onRichInput: (el: HTMLDivElement) => void;
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    richRef: React.RefObject<HTMLDivElement | null>;
  }) => ReactNode;
}) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const richRef = useRef<HTMLDivElement | null>(null);
  const slashRangeRef = useRef<SlashRange | null>(null);
  const modeRef = useRef(mode);
  modeRef.current = mode;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPending, startAiTransition] = useTransition();

  const items = filterSlashItems(query);

  const close = useCallback(() => {
    setOpen(false);
    setAiOpen(false);
    setAiPrompt("");
    slashRangeRef.current = null;
  }, []);

  useEffect(() => {
    if (!open && !aiOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-blog-slash-menu]")) return;
      if (richRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, aiOpen, close]);

  const menuCoords = useCallback((el: HTMLElement) => {
    return getRangeCaretCoords() ?? {
      top: el.getBoundingClientRect().top + 56,
      left: el.getBoundingClientRect().left + 12,
    };
  }, []);

  const openSlashMenu = useCallback(
    (range: SlashRange, slashQuery: string, coords: { top: number; left: number }) => {
      slashRangeRef.current = range;
      setQuery(slashQuery);
      setOpen(true);
      setActiveIndex(0);
      setPosition(coords);
    },
    []
  );

  const detectRichSlash = useCallback(
    (el: HTMLDivElement) => {
      if (modeRef.current !== "rich") return;
      const hit = detectSlashTriggerInEditable(el);
      if (!hit) {
        if (!aiOpen) close();
        return;
      }
      openSlashMenu(
        { kind: "rich", domRange: hit.range.cloneRange() },
        hit.query,
        menuCoords(el)
      );
    },
    [close, aiOpen, openSlashMenu, menuCoords]
  );

  const insertRichMarkdown = useCallback(
    (md: string, domRange: Range) => {
      const el = richRef.current;
      if (!el) return;
      const html = markdownToHtml(md.trim());
      const block = html.startsWith("<") ? html : `<p>${html}</p>`;
      replaceRangeWithHtml(el, domRange, block + "\u200b");
      onRichSync?.(el);
      onAfterInsert?.();
      close();
    },
    [onRichSync, onAfterInsert, close]
  );

  const insertMarkdownAtRange = useCallback(
    (md: string, range: SlashRange) => {
      if (range.kind === "rich") {
        insertRichMarkdown(md, range.domRange);
        return;
      }
      const next = value.slice(0, range.start) + md + value.slice(range.end);
      onChange(next);
      close();
      const cursor = range.start + md.length;
      requestAnimationFrame(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          textareaRef.current.setSelectionRange(cursor, cursor);
        }
      });
    },
    [value, onChange, close, insertRichMarkdown]
  );

  const handleSelect = useCallback(
    (item: BlogSlashItem) => {
      const range = slashRangeRef.current;
      if (!range) return;

      if (item.action === "ai") {
        setAiOpen(true);
        setOpen(true);
        return;
      }

      if (item.action === "image") {
        if (range.kind === "rich") {
          const domRange = range.domRange.cloneRange();
          onRequestImage({
            replaceRange: { start: 0, end: 0 },
            insertMarkdown: (md) => insertRichMarkdown(md, domRange),
          });
        } else {
          onRequestImage({
            replaceRange: { start: range.start, end: range.end },
            insertMarkdown: (md) => insertMarkdownAtRange(md, range),
          });
        }
        close();
        return;
      }

      if (item.insert) {
        insertMarkdownAtRange(item.insert, range);
      }
    },
    [insertMarkdownAtRange, insertRichMarkdown, onRequestImage, close]
  );

  const submitAi = useCallback(() => {
    const range = slashRangeRef.current;
    if (!range || !aiPrompt.trim()) return;

    let contentBefore = "";
    let contentAfter = "";

    if (range.kind === "rich" && richRef.current) {
      const full = getTextBeforeCaret(richRef.current);
      const beforeLen = Math.max(0, full.length - query.length - 1);
      contentBefore = full.slice(0, beforeLen);
      contentAfter = "";
    } else if (range.kind === "markdown") {
      contentBefore = value.slice(0, range.start);
      contentAfter = value.slice(range.end);
    }

    startAiTransition(async () => {
      try {
        const result = await generateBlogFragmentWithAi({
          instructions: aiPrompt,
          category,
          articleTitle,
          contentBefore,
          contentAfter,
        });
        const md = result.content.trim() + "\n\n";
        insertMarkdownAtRange(md, range);
        toast.success("Fragmento insertado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al generar fragmento");
      }
    });
  }, [aiPrompt, category, articleTitle, value, insertMarkdownAtRange, query]);

  const handleMenuKeys = (e: React.KeyboardEvent) => {
    if (aiOpen) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
      return;
    }
    if (!open) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(0, items.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = items[activeIndex];
      if (item) handleSelect(item);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    }
  };

  const onMarkdownKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    handleMenuKeys(e);
  };

  const onMarkdownChange = (v: string, el: HTMLTextAreaElement) => {
    onChange(v);
    const slash = findActiveSlash(v, el.selectionStart);
    if (slash) {
      openSlashMenu(
        { kind: "markdown", start: slash.start, end: slash.end },
        slash.query,
        getTextareaCaretCoords(el, el.selectionStart)
      );
    } else if (!aiOpen) {
      close();
    }
  };

  const onRichKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    handleMenuKeys(e);
  };

  const scheduleRichSlashDetect = useCallback((el: HTMLDivElement) => {
    requestAnimationFrame(() => detectRichSlash(el));
  }, [detectRichSlash]);

  const onRichInput = (el: HTMLDivElement) => {
    scheduleRichSlashDetect(el);
  };

  useEffect(() => {
    if (mode !== "rich") return;
    const onSelectionChange = () => {
      const el = richRef.current;
      if (!el || (document.activeElement !== el && !el.contains(document.activeElement))) return;
      if (!el.contains(document.getSelection()?.anchorNode ?? null)) return;
      detectRichSlash(el);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [mode, detectRichSlash]);

  const slashMenu = (
    <BlogSlashMenu
      open={open || aiOpen}
      position={position}
      items={items}
      activeIndex={activeIndex}
      onSelect={handleSelect}
      onActiveIndexChange={setActiveIndex}
      aiPanel={
        aiOpen
          ? {
              prompt: aiPrompt,
              onPromptChange: setAiPrompt,
              onSubmit: submitAi,
              onCancel: close,
              pending: aiPending,
            }
          : null
      }
    />
  );

  return (
    <>
      {typeof document !== "undefined" ? createPortal(slashMenu, document.body) : slashMenu}
      {children({
        onMarkdownKeyDown,
        onMarkdownChange,
        onRichKeyDown,
        onRichInput,
        textareaRef,
        richRef,
      })}
    </>
  );
}
