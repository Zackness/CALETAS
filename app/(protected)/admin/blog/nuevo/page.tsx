import { BlogPostEditor } from "../_components/blog-post-editor";

export const metadata = { title: "Nuevo artículo | Blog" };

export default function AdminBlogNuevoPage() {
  return <BlogPostEditor mode="create" />;
}
