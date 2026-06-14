"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

import { renderLatexToMarkdown } from "@/lib/latex";

type MarkdownMathProps = {
  children: string;
  className?: string;
  style?: React.CSSProperties;
  disableLatexTransform?: boolean;
};

export function MarkdownMath({ children, className, style, disableLatexTransform = false }: MarkdownMathProps) {
  const content = disableLatexTransform ? children : renderLatexToMarkdown(children).markdown;

  return (
    <div
      style={style}
      className={
        className ??
        [
          "prose prose-invert prose-sm md:prose-base max-w-none text-white/90",
          "prose-headings:text-white prose-headings:font-semibold",
          "prose-p:leading-7 prose-li:leading-7",
          "prose-a:text-[var(--accent-hex)] prose-strong:text-white",
          "prose-pre:bg-[var(--prose-pre-bg)] prose-pre:border prose-pre:border-white/10",
          "prose-code:text-[var(--prose-code-text)]",
          "prose-blockquote:border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] prose-blockquote:text-white/75",
          "prose-hr:border-white/10",
        ].join(" ")
      }
    >
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
