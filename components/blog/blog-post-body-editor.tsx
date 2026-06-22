"use client";

import { forwardRef, useImperativeHandle, useRef, useEffect } from "react";
import type { BlogPostBodyEditorApi } from "./blog-editor-api";
import type { BlogWritingMode } from "./blog-content-format-toolbar";
import { BlogMarkdownBody } from "./blog-markdown-body";
import { BlogRichTextBody } from "./blog-rich-text-body";
import { BlogEditorSlash, type SlashInsertContext } from "./blog-editor-slash";
import { htmlToMarkdown } from "@/lib/blog/content-convert";
import type { BlogCategory } from "@prisma/client";

export const BlogPostBodyEditor = forwardRef<
  BlogPostBodyEditorApi,
  {
    mode: BlogWritingMode;
    value: string;
    onChange: (v: string) => void;
    syncKey: string;
    articleTitle: string;
    category: BlogCategory;
    onRequestImage: (ctx: SlashInsertContext) => void;
    onAfterSlashInsert?: () => void;
  }
>(function BlogPostBodyEditor(
  { mode, value, onChange, syncKey, articleTitle, category, onRequestImage, onAfterSlashInsert },
  ref
) {
  const markdownRef = useRef<BlogPostBodyEditorApi>(null);
  const richRef = useRef<BlogPostBodyEditorApi>(null);
  const modeRef = useRef(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useImperativeHandle(ref, () => ({
    runFormat(action) {
      if (modeRef.current === "markdown") markdownRef.current?.runFormat(action);
      else richRef.current?.runFormat(action);
    },
    insertImageMarkdown(url, alt) {
      markdownRef.current?.insertImageMarkdown(url, alt);
    },
    insertImageRich(url, alt) {
      richRef.current?.insertImageRich(url, alt);
    },
  }));

  return (
    <BlogEditorSlash
      mode={mode}
      value={value}
      onChange={onChange}
      articleTitle={articleTitle}
      category={category}
      onRequestImage={onRequestImage}
      onAfterInsert={onAfterSlashInsert}
      onRichSync={(el) => onChange(htmlToMarkdown(el.innerHTML))}
    >
      {(slash) =>
        mode === "markdown" ? (
          <BlogMarkdownBody
            ref={markdownRef}
            value={value}
            onChange={onChange}
            slash={{
              onMarkdownKeyDown: slash.onMarkdownKeyDown,
              onMarkdownChange: slash.onMarkdownChange,
              textareaRef: slash.textareaRef,
            }}
          />
        ) : (
          <BlogRichTextBody
            ref={richRef}
            value={value}
            onChange={onChange}
            syncKey={syncKey}
            slash={{
              onRichKeyDown: slash.onRichKeyDown,
              onRichInput: slash.onRichInput,
              richRef: slash.richRef,
            }}
          />
        )
      }
    </BlogEditorSlash>
  );
});
