import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, ChevronLeft, User } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { Header } from "../../(root)/components/Header";

export default async function BlogPostDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const post = await db.blogPost.findFirst({
    where: {
      slug,
      isPublished: true,
    },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
  });

  if (!post) notFound();

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link href="/blog" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6">
          <ChevronLeft className="h-4 w-4" />
          Volver al blog
        </Link>

        <Card className="bg-[#354B3A] border-white/10">
          <CardContent className="p-6 md:p-8">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <Badge className="bg-[#40C9A9]/20 text-[#40C9A9] border-[#40C9A9]/30">
                {post.category?.name || "General"}
              </Badge>
              <span className="inline-flex items-center gap-1 text-sm text-white/60">
                <CalendarDays className="h-4 w-4" />
                {new Date(post.createdAt).toLocaleDateString("es")}
              </span>
              <span className="inline-flex items-center gap-1 text-sm text-white/60">
                <User className="h-4 w-4" />
                {post.author?.name || "Equipo Caletas"}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-special text-white mb-3">{post.title}</h1>
            {post.description ? <p className="text-white/80 mb-6">{post.description}</p> : null}

            {post.imageUrl ? (
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full max-h-[420px] object-cover rounded-xl border border-white/10 mb-6"
              />
            ) : null}

            <article className="prose prose-invert max-w-none text-white/90 whitespace-pre-wrap">
              {post.content || "Sin contenido disponible."}
            </article>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
