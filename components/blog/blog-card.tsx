import Image from "next/image";
import { Link } from "@/components/link";
import type { BlogPostPublic } from "@/lib/actions/blog";
import { blogCategorySlug } from "@/lib/blog/categories";
import { stvn } from "@/lib/public-ui";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-VE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function BlogCard({
  post,
  hrefPrefix = "/blog",
}: {
  post: BlogPostPublic;
  hrefPrefix?: string;
}) {
  return (
    <Link
      href={`${hrefPrefix}/${post.slug}`}
      className={`${stvn.cardHover} group flex h-full flex-col overflow-hidden`}
    >
      <div className="relative aspect-[16/9] bg-[#1C2D20]">
        {post.coverImage ? (
          <Image
            src={post.coverImage}
            alt=""
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-white/45">
            Blog CALETAS
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="chalk-section-label text-xs">{post.categoryLabel}</p>
        <h2 className="mt-2 font-special text-lg leading-snug text-white group-hover:text-[var(--caleta-accent)]">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-3 flex-1 text-sm text-white/65">{post.excerpt}</p>
        <p className="mt-4 text-xs text-white/50">
          {formatDate(post.publishedAt)} · {post.readingMinutes} min
        </p>
      </div>
    </Link>
  );
}

export function BlogCardCompact({
  post,
  hrefPrefix = "/blog",
}: {
  post: BlogPostPublic;
  hrefPrefix?: string;
}) {
  return (
    <Link
      href={`${hrefPrefix}/${post.slug}`}
      className="chalk-card group flex gap-4 p-3 transition-colors hover:border-white/20"
    >
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-[#1C2D20]">
        {post.coverImage ? (
          <Image src={post.coverImage} alt="" fill className="object-cover" sizes="112px" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="chalk-section-label text-[10px] uppercase tracking-wide">
          {post.categoryLabel}
        </p>
        <p className="mt-1 line-clamp-2 font-medium text-white group-hover:text-[var(--caleta-accent)]">
          {post.title}
        </p>
        <p className="mt-1 text-xs text-white/55">{post.readingMinutes} min de lectura</p>
      </div>
    </Link>
  );
}

export function BlogCategoryLink({
  categoryId,
  label,
  active,
}: {
  categoryId: string;
  label: string;
  active?: boolean;
}) {
  const slug = blogCategorySlug(categoryId as import("@prisma/client").BlogCategory);
  return (
    <Link
      href={active ? "/blog" : `/blog?categoria=${slug}`}
      className={
        active
          ? "chalk-badge text-sm font-medium"
          : "rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/65 transition-colors hover:border-white/25 hover:text-white"
      }
    >
      {label}
    </Link>
  );
}
