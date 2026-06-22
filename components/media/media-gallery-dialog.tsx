"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  deleteMediaAsset,
  listMediaAssets,
  syncMediaFromBunny,
  updateMediaAssetMeta,
  uploadMediaAsset,
  type MediaAssetDto,
} from "@/lib/actions/media-library";
import { cn } from "@/lib/utils";
import { ImagePlus, Loader2, RefreshCw, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function MediaGalleryDialog({
  open,
  onOpenChange,
  onSelect,
  title = "Galería de imágenes",
  description = "Elige una imagen de la biblioteca o sube una nueva. Al eliminar, también se borra en Bunny.net.",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (asset: MediaAssetDto) => void;
  title?: string;
  description?: string;
}) {
  const [items, setItems] = useState<MediaAssetDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaAlt, setMetaAlt] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listMediaAssets({ sync: true });
      setItems(list);
      if (selectedId && !list.some((i) => i.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se pudo cargar la galería");
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  useEffect(() => {
    if (!selected) return;
    setMetaTitle(selected.title ?? "");
    setMetaAlt(selected.altText ?? "");
    setMetaDescription(selected.description ?? "");
  }, [selected]);

  function onPick(asset: MediaAssetDto) {
    setSelectedId(asset.id);
  }

  function saveMeta() {
    if (!selected) return;
    startTransition(async () => {
      try {
        const updated = await updateMediaAssetMeta(selected.id, {
          title: metaTitle.trim() || null,
          altText: metaAlt.trim() || null,
          description: metaDescription.trim() || null,
        });
        setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        toast.success("Metadatos guardados");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  function onDelete() {
    if (!selected) return;
    const msg =
      selected.usageCount > 0
        ? `Esta imagen aparece en ${selected.usageCount} artículo(s) del blog. ¿Eliminarla igualmente de la plataforma y de Bunny.net?`
        : "¿Eliminar esta imagen de la plataforma y de Bunny.net? No se podrá deshacer.";
    if (!window.confirm(msg)) return;

    startTransition(async () => {
      try {
        await deleteMediaAsset(selected.id, { force: selected.usageCount > 0 });
        setItems((prev) => prev.filter((i) => i.id !== selected.id));
        setSelectedId(null);
        toast.success("Imagen eliminada de la plataforma y Bunny.net");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al eliminar");
      }
    });
  }

  function onUpload(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    startTransition(async () => {
      try {
        const created = await uploadMediaAsset(fd, "media");
        setItems((prev) => [created, ...prev]);
        setSelectedId(created.id);
        toast.success("Imagen subida");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al subir");
      }
    });
  }

  function onSync() {
    startTransition(async () => {
      try {
        const { imported } = await syncMediaFromBunny();
        await load();
        toast.success(
          imported > 0 ? `${imported} imagen(es) importadas desde Bunny` : "Galería actualizada"
        );
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al sincronizar");
      }
    });
  }

  function useImage() {
    if (!selected) {
      toast.error("Selecciona una imagen");
      return;
    }
    onSelect(selected);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b px-6 py-4 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => fileRef.current?.click()}
            >
              <ImagePlus className="mr-1.5 h-4 w-4" />
              Subir imagen
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={onSync}>
              <RefreshCw className={cn("mr-1.5 h-4 w-4", pending && "animate-spin")} />
              Sincronizar Bunny
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <div className="min-h-0 flex-1 overflow-y-auto border-b md:border-b-0 md:border-r">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Cargando galería…
              </div>
            ) : items.length === 0 ? (
              <p className="px-6 py-12 text-center text-sm text-muted-foreground">
                No hay imágenes. Sube una o sincroniza con Bunny.net.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 p-4 sm:grid-cols-4 md:grid-cols-5">
                {items.map((asset) => (
                  <button
                    key={asset.id}
                    type="button"
                    onClick={() => onPick(asset)}
                    className={cn(
                      "relative aspect-square overflow-hidden rounded-lg border bg-muted transition-all hover:ring-2 hover:ring-[#40C9A9]/50",
                      selectedId === asset.id && "ring-2 ring-[#40C9A9]"
                    )}
                  >
                    <Image
                      src={asset.url}
                      alt={asset.altText ?? asset.filename}
                      fill
                      className="object-cover"
                      sizes="120px"
                    />
                    {asset.usageCount > 0 ? (
                      <span className="absolute bottom-1 right-1 rounded bg-black/65 px-1 text-[9px] text-white">
                        {asset.usageCount} uso
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-4 p-4 md:w-[280px]">
            {selected ? (
              <>
                <div className="relative aspect-video overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={selected.url}
                    alt=""
                    fill
                    className="object-contain"
                    sizes="280px"
                  />
                </div>
                <p className="truncate text-[10px] text-muted-foreground" title={selected.path}>
                  {selected.path}
                </p>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Título</label>
                  <Input value={metaTitle} onChange={(e) => setMetaTitle(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Texto alternativo (alt)</label>
                  <Input value={metaAlt} onChange={(e) => setMetaAlt(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Descripción</label>
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    className="w-full resize-y rounded-md border border-input bg-background px-2 py-1.5 text-sm"
                  />
                </div>
                <Button type="button" size="sm" variant="outline" disabled={pending} onClick={saveMeta}>
                  Guardar metadatos
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                  disabled={pending}
                  onClick={onDelete}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" />
                  Eliminar de plataforma y Bunny
                </Button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                Selecciona una imagen para editar metadatos o pulsa «Usar imagen».
              </p>
            )}
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-3">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="button" disabled={!selected || pending} onClick={useImage}>
            Usar imagen
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
