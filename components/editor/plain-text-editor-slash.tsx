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
import { BlogSlashMenu } from "@/components/blog/blog-slash-menu";
import {
  detectSlashTriggerInEditable,
  getTextBeforeCaret,
  replaceRangeWithPlainText,
} from "@/lib/blog/rich-text-range";
import type { SlashMenuItem } from "@/lib/editor/slash-types";
import { getRangeCaretCoords } from "@/lib/blog/slash-utils";

type PlainSlashRange = { domRange: Range };

export function PlainTextEditorSlash({
  value,
  onChange,
  hasAiWriting,
  aiUpsellHref,
  filterItems,
  onAiSubmit,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  hasAiWriting: boolean;
  aiUpsellHref: string;
  filterItems: (query: string) => SlashMenuItem[];
  onAiSubmit?: (input: {
    instructions: string;
    contentBefore: string;
    contentAfter: string;
    taskTitle?: string;
  }) => Promise<string>;
  children: (handlers: {
    onKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
    onInput: (el: HTMLDivElement) => void;
    editorRef: React.RefObject<HTMLDivElement | null>;
  }) => ReactNode;
}) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const slashRangeRef = useRef<PlainSlashRange | null>(null);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiPending, startAiTransition] = useTransition();

  const items = filterItems(query);

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
      if (editorRef.current?.contains(target)) return;
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
    (range: PlainSlashRange, slashQuery: string, coords: { top: number; left: number }) => {
      slashRangeRef.current = range;
      setQuery(slashQuery);
      setOpen(true);
      setActiveIndex(0);
      setPosition(coords);
    },
    []
  );

  const syncFromDom = useCallback(() => {
    const el = editorRef.current;
    if (!el) return;
    onChange(el.innerText.replace(/\r\n/g, "\n"));
  }, [onChange]);

  const insertAtRange = useCallback(
    (text: string, domRange: Range) => {
      const el = editorRef.current;
      if (!el) return;
      replaceRangeWithPlainText(el, domRange, text);
      syncFromDom();
      close();
    },
    [syncFromDom, close]
  );

  const detectSlash = useCallback(
    (el: HTMLDivElement) => {
      const hit = detectSlashTriggerInEditable(el);
      if (!hit) {
        if (!aiOpen) close();
        return;
      }
      openSlashMenu(
        { domRange: hit.range.cloneRange() },
        hit.query,
        menuCoords(el)
      );
    },
    [close, aiOpen, openSlashMenu, menuCoords]
  );

  const showAiUpsell = useCallback(() => {
    toast.error("La escritura con IA en notas requiere una suscripción activa de CALETAS.", {
      action: {
        label: "Ver planes",
        onClick: () => {
          window.open(aiUpsellHref, "_blank", "noopener,noreferrer");
        },
      },
      duration: 8000,
    });
  }, [aiUpsellHref]);

  const handleSelect = useCallback(
    (item: SlashMenuItem) => {
      const range = slashRangeRef.current;
      if (!range) return;

      if (item.action === "ai") {
        if (item.locked || !hasAiWriting) {
          showAiUpsell();
          close();
          return;
        }
        setAiOpen(true);
        setOpen(true);
        return;
      }

      if (item.insert) {
        insertAtRange(item.insert, range.domRange);
      }
    },
    [hasAiWriting, insertAtRange, showAiUpsell, close]
  );

  const submitAi = useCallback(() => {
    const range = slashRangeRef.current;
    if (!range || !aiPrompt.trim()) return;
    if (!hasAiWriting || !onAiSubmit) {
      showAiUpsell();
      close();
      return;
    }

    const el = editorRef.current;
    let contentBefore = "";
    let contentAfter = "";
    if (el) {
      const full = getTextBeforeCaret(el);
      const beforeLen = Math.max(0, full.length - query.length - 1);
      contentBefore = full.slice(0, beforeLen);
      contentAfter = value.slice(beforeLen + query.length + 1);
    }

    startAiTransition(async () => {
      try {
        const fragment = await onAiSubmit({
          instructions: aiPrompt,
          contentBefore,
          contentAfter,
        });
        insertAtRange(fragment.trim() + "\n\n", range.domRange);
        toast.success("Texto insertado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "No se pudo generar el texto");
      }
    });
  }, [aiPrompt, hasAiWriting, onAiSubmit, insertAtRange, query, value, showAiUpsell, close]);

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

  const scheduleDetect = useCallback(
    (el: HTMLDivElement) => {
      requestAnimationFrame(() => detectSlash(el));
    },
    [detectSlash]
  );

  useEffect(() => {
    const onSelectionChange = () => {
      const el = editorRef.current;
      if (!el || (document.activeElement !== el && !el.contains(document.activeElement))) return;
      if (!el.contains(document.getSelection()?.anchorNode ?? null)) return;
      detectSlash(el);
    };
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [detectSlash]);

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
        onKeyDown: handleMenuKeys,
        onInput: scheduleDetect,
        editorRef,
      })}
    </>
  );
}
