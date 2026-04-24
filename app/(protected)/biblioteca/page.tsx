"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BookMarked, Library } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSubscriptionRequired } from "@/hooks/use-subscription-required";

type Obra = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
};

export default function BibliotecaPage() {
  const { loading: subLoading, isActive } = useSubscriptionRequired({
    requireBiblioteca: true,
  });
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (subLoading || !isActive) return;
    (async () => {
      try {
        const res = await fetch("/api/biblioteca");
        const data = await res.json();
        if (res.ok) setObras(Array.isArray(data.obras) ? data.obras : []);
      } catch {
        setObras([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [subLoading, isActive]);

  if (subLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <p className="text-white/80">Cargando biblioteca…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
            <Library className="w-8 h-8 text-[var(--accent-hex)]" />
            Biblioteca
          </h1>
          <p className="text-white/70 max-w-2xl">
            Consulta textos y materiales de apoyo aquí dentro de la app. No está disponible la descarga de archivos desde esta sección.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {obras.map((o) => (
            <Link key={o.id} href={`/biblioteca/${encodeURIComponent(o.slug)}`}>
              <Card className="bg-[var(--mygreen-light)] border-white/10 hover:border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] transition-colors h-full">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <BookMarked className="w-5 h-5 text-[var(--accent-hex)]" />
                    {o.titulo}
                  </CardTitle>
                  {o.descripcion ? (
                    <CardDescription className="text-white/70 line-clamp-2">{o.descripcion}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <span className="text-sm text-[var(--accent-hex)]">Leer en la app →</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {!obras.length ? (
          <p className="text-white/60 text-center py-12">Aún no hay obras publicadas en la biblioteca.</p>
        ) : null}
      </div>
    </div>
  );
}
