import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { blogMarkdownTableComponents } from "@/lib/blog/markdown-table-components";
import { cn } from "@/lib/utils";

export function BlogPostContent({ content, className }: { content: string; className?: string }) {
  return (
    <article
      className={cn(
        "blog-prose prose prose-neutral max-w-none dark:prose-invert",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-a:text-[#40C9A9] prose-a:no-underline hover:prose-a:underline",
        "prose-img:rounded-xl prose-img:border prose-img:border-[var(--border)]",
        "prose-blockquote:border-l-[#40C9A9] prose-blockquote:text-[var(--muted-foreground)]",
        className
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={blogMarkdownTableComponents}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
