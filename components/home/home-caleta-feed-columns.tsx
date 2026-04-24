"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Clock3,
  LayoutGrid,
  List,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { HomeCaletaFeedCard, type FeedCaleta } from "@/components/home/home-caleta-feed-card";

type Props = {
  nuevas: FeedCaleta[];
  populares: FeedCaleta[];
};

export function HomeCaletaFeedColumns({ nuevas, populares }: Props) {
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <div className="space-y-3">
      {/* Vista: arriba del todo, compacta (solo iconos) */}
      <div className="flex items-center justify-end gap-0.5">
        <span className="sr-only">Vista del feed: lista o cuadrícula</span>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setViewMode("list")}
          className={cn(
            "h-6 w-6 shrink-0 border-white/10 bg-[var(--mygreen-dark)] text-white hover:bg-white/10",
            viewMode === "list" &&
              "border-[color-mix(in_oklab,var(--accent-hex)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)]",
          )}
          title="Vista lista"
          aria-pressed={viewMode === "list"}
          aria-label="Vista lista"
        >
          <List className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setViewMode("grid")}
          className={cn(
            "h-6 w-6 shrink-0 border-white/10 bg-[var(--mygreen-dark)] text-white hover:bg-white/10",
            viewMode === "grid" &&
              "border-[color-mix(in_oklab,var(--accent-hex)_45%,transparent)] bg-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)]",
          )}
          title="Vista cuadrícula"
          aria-pressed={viewMode === "grid"}
          aria-label="Vista cuadrícula"
        >
          <LayoutGrid className="h-3 w-3" />
        </Button>
      </div>

      {/* Siempre Nuevas arriba, Populares abajo (feed social) */}
      <div className="flex flex-col gap-5">
        <Card className="border-white/10 bg-[var(--mygreen-light)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-white sm:text-lg">
              <Clock3 className="h-4 w-4 shrink-0 text-[var(--accent-hex)] sm:h-5 sm:w-5" />
              Nuevas caletas
            </CardTitle>
            <CardDescription className="text-white/70">
              Lo último que la comunidad subió.
            </CardDescription>
          </CardHeader>
          <CardContent
            className={cn(
              viewMode === "list" ? "space-y-3" : "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3",
            )}
          >
            {nuevas.map((r) => (
              <HomeCaletaFeedCard key={r.id} item={r} showDate layout={viewMode} />
            ))}
            {nuevas.length === 0 ? (
              <div className="col-span-full py-6 text-center text-white/70">
                <BookOpen className="mx-auto mb-2 h-10 w-10 text-white/30" />
                <p className="font-medium text-white">Aún no hay caletas recientes</p>
                <p className="mt-1 text-sm text-white/70">Sé el primero en compartir.</p>
              </div>
            ) : null}

            <div className={cn("pt-1", viewMode === "grid" && "col-span-full")}>
              <Button
                asChild
                variant="outline"
                className="h-8 min-h-0 w-full rounded-lg border-0 bg-[var(--accent-hex)] px-3 py-0 text-xs font-medium text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
              >
                <Link href="/caletas">Ver más</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-[var(--mygreen-light)]">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-white sm:text-lg">
              <TrendingUp className="h-4 w-4 shrink-0 text-[var(--accent-hex)] sm:h-5 sm:w-5" />
              Populares
            </CardTitle>
            <CardDescription className="text-white/70">
              Las caletas más vistas ahora mismo.
            </CardDescription>
          </CardHeader>
          <CardContent
            className={cn(viewMode === "list" ? "space-y-3" : "grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3")}
          >
            {populares.map((r) => (
              <HomeCaletaFeedCard key={r.id} item={r} layout={viewMode} />
            ))}
            {populares.length === 0 ? (
              <div className="col-span-full py-6 text-center text-white/70">
                <TrendingUp className="mx-auto mb-2 h-10 w-10 text-white/30" />
                <p className="font-medium text-white">Aún no hay tendencias</p>
                <p className="mt-1 text-sm text-white/70">Cuando haya más vistas, aparecerán aquí.</p>
              </div>
            ) : null}

            <div className={cn(viewMode === "grid" && "col-span-full")}>
              <Button
                asChild
                variant="outline"
                className="mt-1 h-8 min-h-0 w-full rounded-lg border-0 bg-[var(--accent-hex)] px-3 py-0 text-xs font-medium text-white hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
              >
                <Link href="/caletas" className="inline-flex items-center justify-center gap-1.5">
                  Explorar todas
                  <ArrowRight className="h-3 w-3 shrink-0" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
