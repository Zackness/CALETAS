import { notFound } from "next/navigation";
import {
  getPublishedBlogPostBySlug,
  getRelatedBlogPosts,
} from "@/lib/actions/blog";
import { BlogPostArticle } from "@/components/blog/blog-post-article";
import { PublicPageShell } from "@/app/(public)/components/PublicPageShell";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) {
    return {
      title: "Artículo no encontrado | Caletas",
      description: "El artículo no está disponible.",
    };
  }
  return {
    title: `${post.metaTitle ?? post.title} | Caletas`,
    description: post.metaDescription ?? post.excerpt,
  };
}

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedBlogPostBySlug(slug);
  if (!post) notFound();

  const related = await getRelatedBlogPosts(post.id, post.category, 3);

  return (
    <PublicPageShell>
      <div className="chalk-container min-w-0 py-8 sm:py-10 md:py-12 chalk-public-blog">
        <BlogPostArticle post={post} related={related} />
      </div>
    </PublicPageShell>
  );
}
