"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Plus, Trash2, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

type MediaType = "IMAGE" | "VIDEO";

type StoryItem = {
  id: string;
  mediaUrl: string;
  mediaType: MediaType;
  expiresAt: string;
  createdAt: string;
};

type Bucket = {
  autor: { id: string; name: string; image: string | null };
  items: StoryItem[];
};

type ViewerProfile = { id: string; name: string; image: string | null };

function iniciales(nombre: string) {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (p.length === 0) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0] + p[1]![0]).toUpperCase();
}

function tiempoRelativo(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const h = Math.floor(ms / 3600000);
  if (h < 1) return "ahora";
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} d`;
}

function latestItem(items: StoryItem[]) {
  return items.length ? items[items.length - 1] : undefined;
}

function CoverMedia({ item, className }: { item: StoryItem; className?: string }) {
  if (item.mediaType === "VIDEO") {
    return (
      <video
        src={item.mediaUrl}
        className={cn("h-full w-full object-cover", className)}
        muted
        playsInline
        preload="metadata"
        aria-hidden
      />
    );
  }
  return <img src={item.mediaUrl} alt="" className={cn("h-full w-full object-cover", className)} />;
}

const THUMB_OUTER = "w-[76px] shrink-0 sm:w-[84px]";
/** Borde tipo “anillo” con la identidad Caletas (acento menta + verdes). */
const STORY_RING =
  "rounded-2xl bg-gradient-to-tr from-[#203324] via-[var(--accent-hex)] to-[color-mix(in_oklab,var(--accent-hex)_65%,#e8f3ed)] p-[2.5px] shadow-[0_0_0_1px_rgba(255,255,255,0.08)]";

/** Carrusel y visor tipo stories (9:16, progreso, toques); borde y + con acentos Caletas. */
export function HomeHistoriasStrip() {
  const [buckets, setBuckets] = useState<Bucket[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const [viewer, setViewer] = useState<ViewerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [bucketIdx, setBucketIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const bucketsRef = useRef(buckets);
  const bucketIdxRef = useRef(bucketIdx);
  const itemIdxRef = useRef(itemIdx);
  const openRef = useRef(open);
  bucketsRef.current = buckets;
  bucketIdxRef.current = bucketIdx;
  itemIdxRef.current = itemIdx;
  openRef.current = open;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/historias");
      const data = (await res.json()) as {
        buckets?: Bucket[];
        viewerId?: string;
        viewer?: ViewerProfile;
        error?: string;
      };
      if (res.ok && data.buckets) {
        setBuckets(data.buckets);
        setViewerId(data.viewerId ?? null);
        setViewer(data.viewer ?? null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const goNext = useCallback(() => {
    const b = bucketsRef.current;
    const bi = bucketIdxRef.current;
    const ii = itemIdxRef.current;
    const bucket = b[bi];
    if (!bucket) return;
    if (ii < bucket.items.length - 1) {
      setItemIdx(ii + 1);
      return;
    }
    if (bi < b.length - 1) {
      setBucketIdx(bi + 1);
      setItemIdx(0);
      return;
    }
    setOpen(false);
  }, []);

  const goPrev = useCallback(() => {
    const b = bucketsRef.current;
    let bi = bucketIdxRef.current;
    const ii = itemIdxRef.current;
    if (ii > 0) {
      setItemIdx(ii - 1);
      return;
    }
    if (bi > 0) {
      bi -= 1;
      const len = b[bi]?.items.length ?? 1;
      setBucketIdx(bi);
      setItemIdx(Math.max(0, len - 1));
    }
  }, []);

  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;

  const myBucketIndex = viewerId ? buckets.findIndex((x) => x.autor.id === viewerId) : -1;
  const myBucket = myBucketIndex >= 0 ? buckets[myBucketIndex] : undefined;
  const othersBuckets = viewerId ? buckets.filter((x) => x.autor.id !== viewerId) : buckets;

  const openBucket = (index: number) => {
    setBucketIdx(index);
    setItemIdx(0);
    setOpen(true);
  };

  const openMyBucket = () => {
    if (myBucketIndex >= 0) openBucket(myBucketIndex);
  };

  const currentBucket = buckets[bucketIdx];
  const currentItem = currentBucket?.items[itemIdx];

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/historias", { method: "POST", body: fd });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setUploadError(data.error ?? "No se pudo subir");
        return;
      }
      await load();
    } finally {
      setUploading(false);
    }
  };

  const deleteCurrent = async () => {
    if (!currentItem || !viewerId || currentBucket?.autor.id !== viewerId) return;
    const res = await fetch(`/api/historias/${encodeURIComponent(currentItem.id)}`, { method: "DELETE" });
    if (!res.ok) return;
    await load();
    setOpen(false);
  };

  const myLatest = myBucket ? latestItem(myBucket.items) : undefined;

  return (
    <section className="mb-5 border-b border-white/10 pb-4">
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm"
        className="hidden"
        onChange={(e) => void onPickFile(e)}
      />

      {uploadError ? <p className="mb-2 px-1 text-xs text-red-300/90">{uploadError}</p> : null}

      {loading ? (
        <div className="flex h-28 items-center justify-center text-white/50">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--accent-hex)]" />
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3.5">
          {viewerId && viewer ? (
            <div className={cn("flex flex-col items-stretch gap-1.5", THUMB_OUTER)}>
              <div className={STORY_RING}>
                <div
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (myBucket && myBucket.items.length > 0) openMyBucket();
                      else fileRef.current?.click();
                    }
                  }}
                  onClick={() => {
                    if (myBucket && myBucket.items.length > 0) openMyBucket();
                    else fileRef.current?.click();
                  }}
                  className="relative block w-full cursor-pointer overflow-hidden rounded-[14px] bg-black aspect-[9/16] outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                >
                  {myLatest ? (
                    <CoverMedia item={myLatest} />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-[#1a1a1a]">
                      <Avatar className="h-14 w-14 border-2 border-white/20">
                        <AvatarImage src={viewer.image ?? "/globe.svg"} alt="" />
                        <AvatarFallback className="bg-[#333] text-sm text-white">{iniciales(viewer.name)}</AvatarFallback>
                      </Avatar>
                    </div>
                  )}
                  {uploading ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                    </div>
                  ) : null}
                  <button
                    type="button"
                    className="absolute bottom-1.5 right-1.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-hex)] text-[#1C2D20] shadow-md ring-2 ring-[#203324]/90 ring-offset-1 ring-offset-[#1a1a1a]"
                    aria-label="Añadir historia"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileRef.current?.click();
                    }}
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>
              </div>
              <span className="truncate text-center text-[11px] font-medium leading-tight text-white">Tu historia</span>
            </div>
          ) : null}

          {othersBuckets.map((b) => {
            const cover = latestItem(b.items);
            const realIndex = buckets.findIndex((x) => x.autor.id === b.autor.id);
            return (
              <div key={b.autor.id} className={cn("flex flex-col items-stretch gap-1.5", THUMB_OUTER)}>
                <div className={STORY_RING}>
                  <button
                    type="button"
                    onClick={() => openBucket(realIndex >= 0 ? realIndex : 0)}
                    className="relative block w-full overflow-hidden rounded-[14px] bg-black aspect-[9/16]"
                  >
                    {cover ? (
                      <CoverMedia item={cover} />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#222]">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={b.autor.image ?? "/globe.svg"} alt="" />
                          <AvatarFallback className="text-xs text-white">{iniciales(b.autor.name)}</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-black/50" />
                  </button>
                </div>
                <span className="line-clamp-2 min-h-[2rem] text-center text-[11px] font-medium leading-tight text-white">
                  {b.autor.name}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {!loading && buckets.length === 0 && viewerId ? (
        <p className="mt-2 px-1 text-center text-[11px] text-white/50">
          Sigue a alguien en{" "}
          <Link className="text-[var(--accent-hex)] hover:underline" href="/caletas">
            Caletas
          </Link>{" "}
          para ver historias aquí.
        </p>
      ) : null}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className={cn(
            "fixed inset-0 left-0 top-0 z-[60] flex h-[100dvh] max-h-[100dvh] w-full max-w-none translate-x-0 translate-y-0 gap-0 border-0 bg-black p-0 text-white shadow-none duration-200",
            "rounded-none data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-100 data-[state=open]:zoom-in-100",
            "data-[state=closed]:slide-out-to-bottom-0 data-[state=open]:slide-in-from-bottom-0",
            "[&>button.absolute]:hidden",
          )}
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Historias</DialogTitle>
          </DialogHeader>

          {currentBucket && currentItem ? (
            <div className="relative flex h-[100dvh] w-full flex-col bg-black">
              <div className="absolute left-0 right-0 z-40 px-1.5 pt-[max(0.5rem,env(safe-area-inset-top))]">
                <div className="flex gap-[3px]">
                  {currentBucket.items.map((it, i) => (
                    <div key={it.id} className="h-[2px] min-w-0 flex-1 overflow-hidden rounded-full bg-white/35">
                      {i < itemIdx ? <div className="h-full w-full bg-white" /> : null}
                      {i === itemIdx ? (
                        currentItem.mediaType === "IMAGE" ? (
                          <motion.div
                            key={currentItem.id}
                            className="h-full w-full origin-left bg-white"
                            initial={{ scaleX: 0 }}
                            animate={{ scaleX: 1 }}
                            transition={{ duration: 5, ease: "linear" }}
                            onAnimationComplete={() => {
                              if (openRef.current) goNextRef.current();
                            }}
                          />
                        ) : (
                          <div className="h-full w-full bg-white/50" />
                        )
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-2 flex items-center gap-2 px-1">
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarImage src={currentBucket.autor.image ?? "/globe.svg"} alt="" />
                    <AvatarFallback className="bg-white/10 text-[10px]">{iniciales(currentBucket.autor.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{currentBucket.autor.name}</p>
                    <p className="text-[11px] text-white/60">{tiempoRelativo(currentItem.createdAt)}</p>
                  </div>
                  {viewerId === currentBucket.autor.id ? (
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-9 w-9 shrink-0 text-white hover:bg-white/10"
                      onClick={() => void deleteCurrent()}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                  <Button type="button" size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-white hover:bg-white/10" onClick={() => setOpen(false)}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="relative flex flex-1 items-center justify-center overflow-hidden pt-20">
                {currentItem.mediaType === "VIDEO" ? (
                  <video
                    key={currentItem.id}
                    src={currentItem.mediaUrl}
                    className="max-h-full w-full max-w-[min(100vw,56vh)] object-contain"
                    controls
                    playsInline
                    autoPlay
                  />
                ) : (
                  <img
                    key={currentItem.id}
                    src={currentItem.mediaUrl}
                    alt=""
                    className="h-full max-h-[85dvh] w-full max-w-[min(100vw,420px)] object-contain"
                  />
                )}

                <button
                  type="button"
                  aria-label="Anterior"
                  className="absolute bottom-28 left-0 top-24 z-20 w-[28%] cursor-pointer bg-transparent sm:bottom-32"
                  onClick={goPrev}
                />
                <button
                  type="button"
                  aria-label="Siguiente"
                  className="absolute bottom-28 right-0 top-24 z-20 w-[32%] cursor-pointer bg-transparent sm:bottom-32"
                  onClick={goNext}
                />
              </div>

              <div className="flex items-center justify-center gap-4 border-t border-white/10 bg-black/80 px-4 py-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-[11px] text-white/55">
                <Link href={`/u/${currentBucket.autor.id}`} className="text-[var(--accent-hex)] hover:underline">
                  Perfil
                </Link>
                <span>
                  {itemIdx + 1}/{currentBucket.items.length}
                </span>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
