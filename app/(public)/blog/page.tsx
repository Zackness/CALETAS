import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "../(root)/components/Header";
import { CalendarDays, Clock } from "lucide-react";

import { db } from "@/lib/db";

export default async function BlogPage() {
  const posts = await db.blogPost.findMany({
    where: { isPublished: true, slug: { not: null } },
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { name: true } },
      category: { select: { name: true } },
    },
    take: 100,
  });

  const categories = Array.from(new Set(posts.map((p) => p.category?.name).filter(Boolean)));

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <Header />

      <div className="container mx-auto px-4 py-10 sm:py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-special text-white mb-4 sm:mb-6">
            Blog de Caletas
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-6 leading-relaxed">
            Consejos, estrategias y recursos para mejorar tu vida universitaria.
          </p>

          <div className="flex flex-wrap justify-center gap-2">
            {categories.length ? (
              categories.map((cat) => (
                <Badge key={cat} className="bg-white/10 text-white border-white/20">
                  {cat}
                </Badge>
              ))
            ) : (
              <Badge className="bg-white/10 text-white/80 border-white/20">Sin categorías aún</Badge>
            )}
          </div>
        </div>

        {posts.length === 0 ? (
          <Card className="bg-[#354B3A] border-white/10">
            <CardContent className="p-8 text-center text-white/70">
              Todavía no hay artículos publicados. Pronto verás contenido nuevo aquí.
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="bg-[#354B3A] border-white/10 hover:border-[#40C9A9]/30 transition-colors">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <Badge className="bg-[#40C9A9]/20 text-[#40C9A9] border-[#40C9A9]/30">
                      {post.category?.name || "General"}
                    </Badge>
                    <span className="text-xs text-white/60 inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {Math.max(1, Math.ceil((post.content?.length || 200) / 900))} min
                    </span>
                  </div>
                  <CardTitle className="text-white text-xl">{post.title}</CardTitle>
                  <CardDescription className="text-white/70">
                    {post.description || "Sin descripción"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-xs text-white/60 inline-flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {new Date(post.createdAt).toLocaleDateString("es")}
                    <span className="mx-1">·</span>
                    {post.author?.name || "Equipo Caletas"}
                  </div>
                  <Link
                    href={`/blog/${post.slug ?? ""}`}
                    className="inline-flex items-center rounded-md bg-[#40C9A9] px-3 py-2 text-sm font-medium text-white hover:bg-[#40C9A9]/80"
                  >
                    Leer artículo
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}