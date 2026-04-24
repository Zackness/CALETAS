"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, FileText, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type TesisListItem = {
  id: string;
  titulo: string;
  createdAt: string;
  updatedAt: string;
};

export default function TesisPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [docs, setDocs] = useState<TesisListItem[]>([]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/tesis");
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo cargar");
      setDocs((data?.docs || []) as TesisListItem[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
      setDocs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const create = async () => {
    try {
      setCreating(true);
      const res = await fetch("/api/tesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: "Mi tesis" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear");
      router.push(`/editor/tesis/${encodeURIComponent(data.doc.id)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-special text-white">Mis tesis</h1>
            <p className="text-white/70">Tu editor tipo Overleaf (Markdown + LaTeX) para escribir tu tesis.</p>
          </div>
          <Button
            type="button"
            className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white"
            onClick={() => void create()}
            disabled={creating}
          >
            <Plus className="w-4 h-4 mr-2" />
            {creating ? "Creando…" : "Nueva tesis"}
          </Button>
        </div>

        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-[var(--accent-hex)]" />
              Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-white/70">Cargando…</div>
            ) : docs.length === 0 ? (
              <div className="rounded-lg border border-white/10 bg-[var(--mygreen-dark)] p-6 text-white/70">
                No tienes tesis creadas todavía. Crea una para empezar.
              </div>
            ) : (
              <div className="space-y-3">
                {docs.map((d) => (
                  <div
                    key={d.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[var(--mygreen-dark)] p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="truncate text-white font-medium">{d.titulo}</div>
                        <Badge className="bg-white/10 text-white/80 border-white/20">Privado</Badge>
                      </div>
                      <div className="text-xs text-white/50">
                        Última edición: {new Date(d.updatedAt).toLocaleString("es-VE")}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/10 bg-[var(--mygreen)] text-white/85 hover:bg-white/10"
                      onClick={() => router.push(`/editor/tesis/${encodeURIComponent(d.id)}`)}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

