import Image from "next/image";
import { Link } from "@/components/link";
import type { BlogPostPublic } from "@/lib/actions/blog";
import { blogCategorySlug } from "@/lib/blog/categories";
import { BlogPostContent } from "@/components/blog/blog-post-content";
import { BlogCardCompact } from "@/components/blog/blog-card";
import { ReadingProgressBar } from "@/components/blog/reading-progress-bar";
import { BlogSharePublicButton } from "@/components/blog/blog-share-public-button";
import { stvn } from "@/lib/public-ui";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BlogPostArticle({
  post,
  related,
  showReadingProgress = true,
  backHref = "/blog",
  backLabel = "← Ver todos los artículos",
  shareLabel,
  topActions,
  relatedHrefPrefix = "/blog",
}: {
  post: BlogPostPublic;
  related: BlogPostPublic[];
  showReadingProgress?: boolean;
  backHref?: string;
  backLabel?: string;
  shareLabel?: string;
  topActions?: React.ReactNode;
  relatedHrefPrefix?: string;
}) {
  const catSlug = blogCategorySlug(post.category);

  return (
    <>
      {showReadingProgress ? <ReadingProgressBar /> : null}
      <article className="pb-16">
        {post.coverImage ? (
          <div className="relative mx-auto max-w-5xl px-4 pt-6 sm:px-6">
            <div className="relative aspect-[21/9] overflow-hidden rounded-2xl border border-white/10 bg-[#1C2D20]">
              <Image
                src={post.coverImage}
                alt=""
                fill
                className="object-cover"
                priority
                sizes="(max-width: 1024px) 100vw, 1024px"
              />
            </div>
          </div>
        ) : null}

        <header className="mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={`${backHref}${backHref === "/blog" ? `?categoria=${catSlug}` : ""}`}
              className="chalk-section-label text-sm hover:underline"
            >
              {post.categoryLabel}
            </Link>
            <div className="flex flex-wrap items-center gap-2">
              {topActions}
              <BlogSharePublicButton slug={post.slug} label={shareLabel} />
            </div>
          </div>
          <h1 className={`${stvn.display} mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl`}>
            {post.title}
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-white/70">{post.excerpt}</p>
          <p className="mt-6 text-sm text-white/55">
            {post.authorName} · {formatDate(post.publishedAt)} · {post.readingMinutes} min de lectura
          </p>
        </header>

        <div className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
          <BlogPostContent content={post.content} />
        </div>

        {related.length > 0 && (
          <aside className="mx-auto mt-16 max-w-3xl border-t border-white/10 px-4 pt-12 sm:px-6">
            <h2 className={`${stvn.display} text-xl font-bold text-white`}>
              También te puede interesar
            </h2>
            <div className="mt-6 space-y-4">
              {related.map((r) => (
                <BlogCardCompact key={r.id} post={r} hrefPrefix={relatedHrefPrefix} />
              ))}
            </div>
          </aside>
        )}

        <div className="mx-auto mt-10 max-w-3xl px-4 sm:px-6">
          <Link href={backHref} className="text-sm font-medium text-[var(--caleta-accent)] hover:underline">
            {backLabel}
          </Link>
        </div>
      </article>
    </>
  );
}
