import { BlogPostEditor } from "../../_components/blog-post-editor";

export default async function AdminBlogEditarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <BlogPostEditor mode="edit" postId={id} />;
}
