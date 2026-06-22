import TurndownService from "turndown";
import { marked } from "marked";

const turndown = new TurndownService({
  headingStyle: "atx",
  bulletListMarker: "-",
  codeBlockStyle: "fenced",
});

turndown.addRule("strikethrough", {
  filter: ["del", "s"],
  replacement: (content) => `~~${content}~~`,
});

marked.setOptions({ gfm: true, breaks: true });

export function markdownToHtml(markdown: string): string {
  if (!markdown.trim()) return "";
  return marked.parse(markdown, { async: false }) as string;
}

export function htmlToMarkdown(html: string): string {
  if (!html.trim()) return "";
  return turndown.turndown(html).trim();
}
