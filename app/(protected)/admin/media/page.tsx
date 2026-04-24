"use client";

import { useEffect, useState } from "react";
import { Copy, Image as ImageIcon, RefreshCw, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type MediaItem = {
  name: string;
  size: number;
  type: string;
  url: string;
  lastModified: string;
};

export default function AdminMediaPage() {
  const [files, setFiles] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [subfolder, setSubfolder] = useState("media");

  const loadFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/media?subfolder=${encodeURIComponent(subfolder)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo listar archivos");
      setFiles(Array.isArray(data.files) ? data.files : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error listando archivos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, []);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subfolder", subfolder);
      const res = await fetch("/api/admin/media", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error subiendo archivo");
      toast.success("Archivo subido");
      await loadFiles();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error subiendo archivo");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileUrl: string) => {
    if (!confirm("¿Eliminar este archivo de Bunny?")) return;
    try {
      const res = await fetch(`/api/admin/media?fileUrl=${encodeURIComponent(fileUrl)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error eliminando archivo");
      toast.success("Archivo eliminado");
      await loadFiles();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error eliminando archivo");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-special text-white mb-2">Panel Admin - Biblioteca de medios</h1>
          <p className="text-white/70">
            Gestiona archivos en Bunny bajo la carpeta <span className="text-[var(--accent-hex)]">caletas/</span>.
          </p>
        </div>

        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Subir archivo</CardTitle>
            <CardDescription className="text-white/70">
              Estos archivos pueden usarse luego en cursos, blog y recursos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <Label className="text-white/80">Subcarpeta dentro de caletas/</Label>
                <Input
                  value={subfolder}
                  onChange={(e) => setSubfolder(e.target.value)}
                  className="bg-[var(--mygreen-dark)] border-white/20 text-white"
                  placeholder="media o blog o cursos"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button
                  type="button"
                  className="bg-[var(--accent-hex)] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)] text-white w-full"
                  onClick={() => void loadFiles()}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refrescar
                </Button>
              </div>
            </div>

            <Input
              type="file"
              className="bg-[var(--mygreen-dark)] border-white/20 text-white"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleUpload(file);
              }}
            />
          </CardContent>
        </Card>

        <Card className="bg-[var(--mygreen-light)] border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Archivos</CardTitle>
            <CardDescription className="text-white/70">
              Copia URL para reutilizar en portada de blog/cursos o donde lo necesites.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-white/70">Cargando...</p>
            ) : files.length === 0 ? (
              <p className="text-white/70">No hay archivos en esta subcarpeta.</p>
            ) : (
              <div className="space-y-2">
                {files.map((f) => (
                  <div key={f.url} className="rounded-lg border border-white/10 bg-[var(--mygreen-dark)] p-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-white truncate">{f.name}</p>
                      <p className="text-xs text-white/60 truncate">{f.url}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={async () => {
                          await navigator.clipboard.writeText(f.url);
                          toast.success("URL copiada");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="border-red-500/30 text-red-300 hover:bg-red-500/10"
                        onClick={() => void handleDelete(f.url)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
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
