"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, Pencil, PlusCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Obra = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  cuerpo: string;
  orden: number;
  isPublished: boolean;
};

export default function AdminBibliotecaPage() {
  const router = useRouter();
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/biblioteca");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando obras");
      setObras(Array.isArray(data.obras) ? data.obras : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const createDraftAndOpen = async () => {
    try {
      const res = await fetch("/api/admin/biblioteca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: "Nuevo libro",
          cuerpo: "## Nuevo libro\n\nEscribe aquí. Puedes usar fórmulas: $E=mc^2$ y bloques:\n\n$$\\int_0^1 x^2\\,dx$$\n",
          isPublished: false,
          orden: 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear el borrador");
      toast.success("Borrador creado");
      router.push(`/editor/admin/biblioteca/${data.obra.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const remove = async (o: Obra) => {
    if (!confirm(`¿Eliminar "${o.titulo}"?`)) return;
    try {
      const res = await fetch(`/api/admin/biblioteca/${o.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error || "Error");
      }
      toast.success("Eliminado");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-special text-white mb-1 flex items-center gap-2">
              <BookMarked className="w-7 h-7 text-[var(--accent-hex)]" />
              Biblioteca (admin)
            </h1>
            <p className="text-white/70 text-sm">Obras en Markdown. Los usuarios leen en la app; no hay descarga.</p>
          </div>
          <Button className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white" onClick={() => void createDraftAndOpen()}>
            <PlusCircle className="w-4 h-4 mr-2" />
            Nueva obra
          </Button>
        </div>

        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Obras</CardTitle>
            <CardDescription className="text-white/70">Solo publicadas las ve el usuario.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-white/70">Cargando…</p>
            ) : (
              <div className="rounded-lg border border-white/10 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--mygreen-dark)] text-white/70">
                    <tr>
                      <th className="px-3 py-2 text-left">Título</th>
                      <th className="px-3 py-2 text-left">Slug</th>
                      <th className="px-3 py-2 text-left">Estado</th>
                      <th className="px-3 py-2 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obras.map((o) => (
                      <tr key={o.id} className="border-t border-white/5 bg-[var(--mygreen)]">
                        <td className="px-3 py-2 text-white">{o.titulo}</td>
                        <td className="px-3 py-2 text-white/80">{o.slug}</td>
                        <td className="px-3 py-2">
                          <Badge
                            className={
                              o.isPublished
                                ? "bg-[color-mix(in_oklab,var(--accent-hex)_20%,transparent)] text-[var(--accent-hex)] border-[color-mix(in_oklab,var(--accent-hex)_30%,transparent)]"
                                : "bg-white/10 text-white/80 border-white/20"
                            }
                          >
                            {o.isPublished ? "Publicada" : "Borrador"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 border-[color-mix(in_oklab,var(--accent-hex)_40%,transparent)] bg-[var(--mygreen-dark)] text-[var(--accent-hex)] hover:bg-[var(--mygreen)]"
                              onClick={() => router.push(`/editor/admin/biblioteca/${o.id}`)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 border-red-500/30 bg-[var(--mygreen-dark)] text-red-300 hover:bg-red-500/10"
                              onClick={() => void remove(o)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
