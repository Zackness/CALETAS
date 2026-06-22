import { notFound } from "next/navigation";
import { getAdminBlogPostById } from "@/lib/actions/blog";
import { BlogPostEditor } from "../../_components/blog-post-editor";

export const metadata = { title: "Editar artículo | Blog" };

export default async function AdminBlogEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await getAdminBlogPostById(id);
  if (!post) notFound();

  return (
    <BlogPostEditor
      mode="edit"
      post={{
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        coverImage: post.coverImage,
        category: post.category,
        status: post.status,
        metaTitle: post.metaTitle,
        metaDescription: post.metaDescription,
      }}
    />
  );
}
