"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Library } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownMath } from "@/components/markdown-math";
import { useSubscriptionRequired } from "@/hooks/use-subscription-required";

type Obra = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  cuerpo: string;
};

export default function BibliotecaObraPage() {
  const params = useParams();
  const slug = typeof params?.slug === "string" ? params.slug : "";
  const { loading: subLoading, isActive } = useSubscriptionRequired({ requireBiblioteca: true });
  const [obra, setObra] = useState<Obra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (subLoading || !isActive || !slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/biblioteca/${encodeURIComponent(slug)}`);
        const data = await res.json();
        if (!res.ok) {
          setError(data?.error || "No se pudo cargar");
          setObra(null);
        } else {
          setObra(data.obra);
          setError(null);
        }
      } catch {
        setError("Error de red");
        setObra(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [subLoading, isActive, slug]);

  if (subLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex items-center justify-center">
        <p className="text-white/80">Cargando…</p>
      </div>
    );
  }

  if (error || !obra) {
    return (
      <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light flex flex-col items-center justify-center gap-4 px-4">
        <p className="text-white/80">{error || "Obra no encontrada"}</p>
        <Button asChild className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white">
          <Link href="/biblioteca">Volver a la biblioteca</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Button
          asChild
          variant="outline"
          className="border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] bg-[var(--mygreen-dark)] text-[var(--accent-hex)] hover:bg-[var(--mygreen)]"
        >
          <Link href="/biblioteca" className="inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Biblioteca
          </Link>
        </Button>

        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white font-special text-2xl flex items-center gap-2">
              <Library className="w-7 h-7 text-[var(--accent-hex)]" />
              {obra.titulo}
            </CardTitle>
            {obra.descripcion ? <p className="text-white/70 text-sm">{obra.descripcion}</p> : null}
          </CardHeader>
          <CardContent className="border-t border-white/10 pt-6">
            <MarkdownMath>{obra.cuerpo}</MarkdownMath>
          </CardContent>
        </Card>

        <p className="text-xs text-white/50 text-center">
          El contenido es solo para lectura dentro de Caletas. No se ofrece descarga desde esta biblioteca.
        </p>
      </div>
    </div>
  );
}
