"use client";

import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent, type TouchEvent, type WheelEvent } from "react";
import {
  ArrowLeft,
  BookMarked,
  Bold,
  Bot,
  ChevronDown,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  List,
  Minus,
  Plus,
  Redo2,
  Save,
  SendHorizontal,
  SlidersHorizontal,
  Sigma,
  Undo2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DualMarkdownEditor, type DualMarkdownEditorHandle, type EditorMode } from "@/components/dual-markdown-editor";
import { MarkdownMath } from "@/components/markdown-math";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Obra = {
  id: string;
  titulo: string;
  slug: string;
  descripcion: string | null;
  cuerpo: string;
  orden: number;
  isPublished: boolean;
};

type AiWidgetState = "hidden" | "minimized" | "expanded";

const AI_PANEL_W = 360;
const AI_PANEL_H = 460;

export default function AdminBibliotecaEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [aiWidget, setAiWidget] = useState<AiWidgetState>("hidden");
  const [aiPos, setAiPos] = useState({ x: 0, y: 0 });
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiScope, setAiScope] = useState<"selection" | "document">("selection");
  const [aiApplyMode, setAiApplyMode] = useState<"insert" | "replace">("insert");
  const [aiRunning, setAiRunning] = useState(false);
  const [aiMessages, setAiMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const aiMessagesEndRef = useRef<HTMLDivElement>(null);
  const aiDragRef = useRef({ active: false, startX: 0, startY: 0, originX: 0, originY: 0 });
  const [editorMode, setEditorMode] = useState<EditorMode>("codemirror");
  const [obra, setObra] = useState<Obra | null>(null);
  const editorRef = useRef<DualMarkdownEditorHandle>(null);
  const [previewZoom, setPreviewZoom] = useState(100); // %
  const [previewFontScale, setPreviewFontScale] = useState(0.92); // relativo
  const [previewPaperMode, setPreviewPaperMode] = useState<"light" | "dim">("light");
  const [previewPaperSize, setPreviewPaperSize] = useState<"a4" | "letter" | "tabloid">("a4");
  const [previewHeaderTpl, setPreviewHeaderTpl] = useState("{{title}}");
  const [previewFooterTpl, setPreviewFooterTpl] = useState("Página {{page}} de {{pages}}");
  const [form, setForm] = useState({
    titulo: "",
    slug: "",
    descripcion: "",
    cuerpo: "",
    orden: 0,
    isPublished: false,
  });

  const isDirty = useMemo(() => {
    if (!obra) return false;
    return (
      form.titulo !== obra.titulo ||
      form.slug !== obra.slug ||
      (form.descripcion || "") !== (obra.descripcion || "") ||
      form.cuerpo !== obra.cuerpo ||
      form.orden !== obra.orden ||
      form.isPublished !== obra.isPublished
    );
  }, [obra, form]);

  // Simulación de paginado para preview (sin compilar PDF):
  // divide por bloques de párrafos para evitar cortes bruscos.
  const previewPages = useMemo(() => {
    const source = form.cuerpo?.trim() || "";
    if (!source) return ["Escribe el cuerpo para ver el preview…"];

    const blocks = source.split(/\n\s*\n/);
    const maxCharsPerPage = 2300;
    const pages: string[] = [];
    let current = "";

    for (const block of blocks) {
      const candidate = current ? `${current}\n\n${block}` : block;
      if (candidate.length <= maxCharsPerPage) {
        current = candidate;
      } else {
        if (current) pages.push(current);
        if (block.length > maxCharsPerPage) {
          // bloque muy grande: partirlo por líneas
          const lines = block.split("\n");
          let chunk = "";
          for (const line of lines) {
            const next = chunk ? `${chunk}\n${line}` : line;
            if (next.length <= maxCharsPerPage) {
              chunk = next;
            } else {
              if (chunk) pages.push(chunk);
              chunk = line;
            }
          }
          current = chunk;
        } else {
          current = block;
        }
      }
    }
    if (current) pages.push(current);
    return pages.length ? pages : [source];
  }, [form.cuerpo]);

  const clampAiPos = useCallback((x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };
    const margin = 8;
    const nx = Math.min(Math.max(margin, x), window.innerWidth - AI_PANEL_W - margin);
    const ny = Math.min(Math.max(margin, y), window.innerHeight - AI_PANEL_H - margin);
    return { x: nx, y: ny };
  }, []);

  const openAiAssistant = useCallback(() => {
    setAiWidget("expanded");
    setAiPos((prev) => {
      if (typeof window === "undefined") return prev;
      if (prev.x === 0 && prev.y === 0) {
        return clampAiPos(window.innerWidth - AI_PANEL_W - 24, window.innerHeight - AI_PANEL_H - 24);
      }
      return clampAiPos(prev.x, prev.y);
    });
  }, [clampAiPos]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAiPos((p) =>
      p.x === 0 && p.y === 0
        ? clampAiPos(window.innerWidth - AI_PANEL_W - 24, window.innerHeight - AI_PANEL_H - 24)
        : clampAiPos(p.x, p.y),
    );
  }, [clampAiPos]);

  useEffect(() => {
    const onResize = () => setAiPos((p) => clampAiPos(p.x, p.y));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clampAiPos]);

  useEffect(() => {
    if (aiWidget !== "expanded") return;
    aiMessagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [aiMessages, aiWidget]);

  const minimizedChipPos = useMemo(() => {
    const margin = 12;
    const size = 56;
    if (typeof window === "undefined") {
      return { left: aiPos.x + AI_PANEL_W - size, top: aiPos.y + AI_PANEL_H - size };
    }
    const left = Math.min(
      Math.max(margin, aiPos.x + AI_PANEL_W - size),
      window.innerWidth - size - margin,
    );
    const top = Math.min(
      Math.max(margin, aiPos.y + AI_PANEL_H - size),
      window.innerHeight - size - margin,
    );
    return { left, top };
  }, [aiPos]);

  const renderTpl = useCallback(
    (tpl: string, ctx: { page: number; pages: number; title: string }) => {
      return (tpl || "")
        .replaceAll("{{page}}", String(ctx.page))
        .replaceAll("{{pages}}", String(ctx.pages))
        .replaceAll("{{title}}", ctx.title || "");
    },
    [],
  );

  const splitTwoCols = useCallback((tpl: string) => {
    const idx = tpl.indexOf("||");
    if (idx === -1) return { left: tpl, right: "" };
    return { left: tpl.slice(0, idx).trim(), right: tpl.slice(idx + 2).trim() };
  }, []);

  const paperPx = useMemo(() => {
    // Aproximación CSS px a 96dpi: suficiente para preview.
    if (previewPaperSize === "a4") return { w: 794, h: 1123 }; // 8.27" x 11.69"
    if (previewPaperSize === "tabloid") return { w: 1056, h: 1632 }; // 11" x 17"
    return { w: 816, h: 1056 }; // letter 8.5" x 11"
  }, [previewPaperSize]);

  const clampPreviewZoom = useCallback((z: number) => Math.min(160, Math.max(70, z)), []);

  const applyPreviewZoomDelta = useCallback(
    (delta: number) => {
      setPreviewZoom((z) => clampPreviewZoom(Math.round(z + delta)));
    },
    [clampPreviewZoom],
  );

  const previewPinchRef = useRef<{ active: boolean; startDist: number; startZoom: number }>({
    active: false,
    startDist: 0,
    startZoom: 100,
  });

  const onPreviewWheel = useCallback(
    (e: WheelEvent<HTMLDivElement>) => {
      // Trackpad pinch en muchos navegadores llega como wheel con ctrlKey
      if (!e.ctrlKey) return;
      e.preventDefault();
      const raw = -e.deltaY;
      // sensibilidad suave, clamp
      const delta = Math.max(-12, Math.min(12, raw / 20));
      applyPreviewZoomDelta(delta);
    },
    [applyPreviewZoomDelta],
  );

  const onPreviewTouchStart = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (e.touches.length !== 2) return;
      const [a, b] = Array.from(e.touches);
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      const dist = Math.hypot(dx, dy);
      previewPinchRef.current = { active: true, startDist: dist, startZoom: previewZoom };
    },
    [previewZoom],
  );

  const onPreviewTouchMove = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      if (!previewPinchRef.current.active) return;
      if (e.touches.length !== 2) return;
      e.preventDefault();
      const [a, b] = Array.from(e.touches);
      const dx = a.clientX - b.clientX;
      const dy = a.clientY - b.clientY;
      const dist = Math.hypot(dx, dy);
      const base = previewPinchRef.current.startDist || 1;
      const ratio = dist / base;
      const next = clampPreviewZoom(previewPinchRef.current.startZoom * ratio);
      setPreviewZoom(Math.round(next));
    },
    [clampPreviewZoom],
  );

  const onPreviewTouchEnd = useCallback(() => {
    previewPinchRef.current.active = false;
  }, []);

  const onAiHeaderPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    e.preventDefault();
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    aiDragRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      originX: aiPos.x,
      originY: aiPos.y,
    };
  };

  const onAiHeaderPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!aiDragRef.current.active) return;
    const d = aiDragRef.current;
    const nx = d.originX + (e.clientX - d.startX);
    const ny = d.originY + (e.clientY - d.startY);
    setAiPos(clampAiPos(nx, ny));
  };

  const onAiHeaderPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!aiDragRef.current.active) return;
    aiDragRef.current.active = false;
    try {
      (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/biblioteca/${encodeURIComponent(id)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error cargando obra");
        const o = data.obra as Obra;
        setObra(o);
        setForm({
          titulo: o.titulo,
          slug: o.slug,
          descripcion: o.descripcion || "",
          cuerpo: o.cuerpo,
          orden: o.orden,
          isPublished: o.isPublished,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error");
        setObra(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const save = async () => {
    if (!id) return;
    if (!form.titulo.trim() || !form.cuerpo.trim()) {
      toast.error("Título y cuerpo son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/biblioteca/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          slug: form.slug,
          descripcion: form.descripcion,
          cuerpo: form.cuerpo,
          orden: form.orden,
          isPublished: form.isPublished,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error guardando");
      setObra(data.obra as Obra);
      toast.success("Guardado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setSaving(false);
    }
  };

  const runAi = async () => {
    if (!id) return;
    const prompt = aiPrompt.trim();
    if (!prompt) {
      toast.error("Escribe una instrucción para la IA");
      return;
    }
    setAiRunning(true);
    try {
      const selectionText = editorRef.current?.getSelectedText() || "";
      setAiMessages((prev) => [...prev, { role: "user", content: prompt }]);
      const res = await fetch(`/api/admin/biblioteca/${encodeURIComponent(id)}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          scope: aiScope,
          applyMode: aiApplyMode,
          selectionText,
          documentText: form.cuerpo,
          titulo: form.titulo,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error ejecutando IA");
      const text = String(data?.text || "");
      if (!text.trim()) throw new Error("La IA no devolvió contenido");

      if (aiApplyMode === "replace") {
        if (aiScope === "selection" && selectionText.trim()) {
          editorRef.current?.replaceSelection(text);
        } else {
          // Reemplazar todo el documento (sin pasar por el editor)
          setForm((f) => ({ ...f, cuerpo: text }));
        }
      } else {
        editorRef.current?.insertAtCursor(`\n\n${text}\n`);
      }

      setAiMessages((prev) => [...prev, { role: "assistant", content: text }]);
      setAiPrompt("");
      toast.success("IA aplicada al documento");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error";
      setAiMessages((prev) => [...prev, { role: "assistant", content: `Error: ${msg}` }]);
      toast.error(msg);
    } finally {
      setAiRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="sticky top-0 z-50 border-b border-white/10 bg-[#203324]/95 backdrop-blur supports-[backdrop-filter]:bg-[#203324]/85">
        <div className="mx-auto max-w-[1680px] px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button
              type="button"
              variant="ghost"
              className="text-white/90 hover:bg-white/10 h-9"
              onClick={() => router.push("/admin/biblioteca")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Biblioteca
            </Button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <BookMarked className="w-5 h-5 text-[#40C9A9] shrink-0" />
                <input
                  value={form.titulo}
                  onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
                  className="font-special text-white text-lg md:text-xl truncate bg-transparent border border-transparent rounded px-2 py-0.5 focus:border-[#40C9A9]/40 focus:bg-white/5 outline-none min-w-[220px]"
                  placeholder="Título del libro"
                />
                <Badge
                  className={
                    form.isPublished
                      ? "bg-[#40C9A9]/20 text-[#40C9A9] border-[#40C9A9]/30"
                      : "bg-white/10 text-white/80 border-white/20"
                  }
                >
                  {form.isPublished ? "Publicada" : "Borrador"}
                </Badge>
                {isDirty ? <span className="text-xs text-white/60">Cambios sin guardar</span> : null}
              </div>
              <div className="text-xs text-white/60">Caletas Editor · Markdown + LaTeX (KaTeX)</div>
            </div>
          </div>

          <Button
            type="button"
            className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
            onClick={() => void save()}
            disabled={saving || loading || !obra}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>

      {/* Toolbar principal estilo Overleaf debajo del header */}
      <div className="sticky top-14 z-40 border-b border-white/10 bg-[#1C2D20]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1C2D20]/85">
        <div className="mx-auto max-w-[1680px] px-4 py-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={
                editorMode === "codemirror"
                  ? "h-7 border-[#40C9A9]/50 bg-[#40C9A9]/15 text-[#40C9A9] hover:bg-[#40C9A9]/20"
                  : "h-7 border-white/10 bg-[#1C2D20] text-white/80 hover:bg-white/10"
              }
              onClick={() => editorRef.current?.setMode("codemirror")}
            >
              Code Editor
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className={
                editorMode === "tiptap"
                  ? "h-7 border-[#40C9A9]/50 bg-[#40C9A9]/15 text-[#40C9A9] hover:bg-[#40C9A9]/20"
                  : "h-7 border-white/10 bg-[#1C2D20] text-white/80 hover:bg-white/10"
              }
              onClick={() => editorRef.current?.setMode("tiptap")}
            >
              Visual Editor
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 border-white/10 bg-[#203324] text-white/85 hover:bg-white/10 px-2"
                  title="Ajustes de documento (preview)"
                >
                  <SlidersHorizontal className="h-4 w-4 mr-2 text-[#40C9A9]" />
                  Documento
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                sideOffset={8}
                className="w-[360px] bg-[#354B3A] text-white border border-white/10 p-2.5 rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
              >
                <Tabs defaultValue="vista">
                  <TabsList className="w-full h-8 bg-[#203324] rounded-full p-1 border border-white/10">
                    <TabsTrigger
                      value="vista"
                      className="w-full !rounded-full !bg-transparent h-6 text-[12px] text-white/70 hover:text-white data-[state=active]:!bg-[#1C2D20] data-[state=active]:text-[#40C9A9]"
                    >
                      Vista
                    </TabsTrigger>
                    <TabsTrigger
                      value="hf"
                      className="w-full !rounded-full !bg-transparent h-6 text-[12px] text-white/70 hover:text-white data-[state=active]:!bg-[#1C2D20] data-[state=active]:text-[#40C9A9]"
                    >
                      Cabecera/Pie
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="vista" className="mt-2.5 space-y-2.5">
                    <div className="rounded-lg border border-white/10 bg-[#1C2D20] p-2.5">
                      <div className="text-[11px] text-white/70 mb-2">Tamaño de hoja</div>
                      <div className="flex gap-1.5">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={
                            previewPaperSize === "a4"
                              ? "h-7 flex-1 border-[#40C9A9]/40 bg-[#203324] text-[#40C9A9] rounded-full text-[11px]"
                              : "h-7 flex-1 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 rounded-full text-[11px]"
                          }
                          onClick={() => setPreviewPaperSize("a4")}
                        >
                          A4
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={
                            previewPaperSize === "letter"
                              ? "h-7 flex-1 border-[#40C9A9]/40 bg-[#203324] text-[#40C9A9] rounded-full text-[11px]"
                              : "h-7 flex-1 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 rounded-full text-[11px]"
                          }
                          onClick={() => setPreviewPaperSize("letter")}
                        >
                          Carta
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={
                            previewPaperSize === "tabloid"
                              ? "h-7 flex-1 border-[#40C9A9]/40 bg-[#203324] text-[#40C9A9] rounded-full text-[11px]"
                              : "h-7 flex-1 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 rounded-full text-[11px]"
                          }
                          onClick={() => setPreviewPaperSize("tabloid")}
                        >
                          Tabloide
                        </Button>
                      </div>
                      <div className="mt-2 text-[10.5px] text-white/45">
                        Usual: A4 o Carta. (El preview no es impresión real, pero respeta proporciones).
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-white/10 bg-[#1C2D20] p-2.5">
                        <div className="text-[11px] text-white/70 mb-2">Zoom</div>
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10"
                            onClick={() => setPreviewZoom((z) => Math.max(70, z - 5))}
                            aria-label="Reducir zoom"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="text-[13px] text-white font-semibold tabular-nums">{previewZoom}%</div>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10"
                            onClick={() => setPreviewZoom((z) => Math.min(130, z + 5))}
                            aria-label="Aumentar zoom"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 px-2 text-[11px] rounded-full"
                            onClick={() => setPreviewZoom(90)}
                          >
                            90%
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 px-2 text-[11px] rounded-full"
                            onClick={() => setPreviewZoom(100)}
                          >
                            100%
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 px-2 text-[11px] rounded-full"
                            onClick={() => setPreviewZoom(110)}
                          >
                            110%
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg border border-white/10 bg-[#1C2D20] p-2.5">
                        <div className="text-[11px] text-white/70 mb-2">Texto</div>
                        <div className="flex items-center justify-between gap-2">
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10"
                            onClick={() => setPreviewFontScale((s) => Math.max(0.82, Number((s - 0.03).toFixed(2))))}
                            aria-label="Reducir tamaño"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <div className="text-[13px] text-white font-semibold tabular-nums">{Math.round(previewFontScale * 100)}%</div>
                          <Button
                            type="button"
                            size="icon"
                            variant="outline"
                            className="h-7 w-7 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10"
                            onClick={() => setPreviewFontScale((s) => Math.min(1.08, Number((s + 0.03).toFixed(2))))}
                            aria-label="Aumentar tamaño"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 px-2 text-[11px] rounded-full"
                            onClick={() => setPreviewFontScale(0.88)}
                          >
                            Compacto
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 px-2 text-[11px] rounded-full"
                            onClick={() => setPreviewFontScale(0.92)}
                          >
                            Normal
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 flex-1 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 px-2 text-[11px] rounded-full"
                            onClick={() => setPreviewFontScale(0.98)}
                          >
                            Grande
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-[#1C2D20] p-2.5">
                      <div className="text-[11px] text-white/70 mb-2">Hoja</div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-[11px] text-white/55 leading-snug">
                          Modo noche (solo visual).
                        </div>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className={
                            previewPaperMode === "dim"
                              ? "h-7 border-[#40C9A9]/40 bg-[#203324] text-[#40C9A9] hover:bg-[#203324] rounded-full px-3 text-[11px]"
                              : "h-7 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10 rounded-full px-3 text-[11px]"
                          }
                          onClick={() => setPreviewPaperMode((m) => (m === "light" ? "dim" : "light"))}
                        >
                          {previewPaperMode === "dim" ? "On" : "Off"}
                        </Button>
                      </div>
                    </div>
                    <div className="text-[10.5px] text-white/45">
                      Zoom por gesto: <span className="text-white/70">pinch</span> (trackpad o táctil).
                    </div>
                  </TabsContent>

                  <TabsContent value="hf" className="mt-3 space-y-3">
                    <div className="text-[11px] text-white/60">
                      Variables: <span className="text-white/80">{"{{title}}"}</span>,{" "}
                      <span className="text-white/80">{"{{page}}"}</span>,{" "}
                      <span className="text-white/80">{"{{pages}}"}</span>. Para dos columnas usa{" "}
                      <span className="text-white/80">{"||"}</span> (izq || der).
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs text-white/75">Cabecera</div>
                      <Textarea
                        value={previewHeaderTpl}
                        onChange={(e) => setPreviewHeaderTpl(e.target.value)}
                        placeholder="{{title}} || {{page}}/{{pages}}"
                        className="min-h-[64px] bg-[#1C2D20] border-white/10 text-white text-sm"
                      />
                    </div>

                    <div className="grid gap-2">
                      <div className="text-xs text-white/75">Pie de página</div>
                      <Textarea
                        value={previewFooterTpl}
                        onChange={(e) => setPreviewFooterTpl(e.target.value)}
                        placeholder="Página {{page}} de {{pages}}"
                        className="min-h-[64px] bg-[#1C2D20] border-white/10 text-white text-sm"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/10 bg-[#203324] text-white/85 hover:bg-white/10"
                onClick={() => editorRef.current?.insertHeading(1)}
                title="Título 1"
                aria-label="Título 1"
              >
                <Heading1 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/10 bg-[#203324] text-white/85 hover:bg-white/10"
                onClick={() => editorRef.current?.insertHeading(2)}
                title="Título 2"
                aria-label="Título 2"
              >
                <Heading2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/10 bg-[#203324] text-white/85 hover:bg-white/10"
                onClick={() => editorRef.current?.insertHeading(3)}
                title="Título 3"
                aria-label="Título 3"
              >
                <Heading3 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <span className="mx-1 h-6 w-px bg-white/15" />

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/10 bg-[#203324] text-white/90 hover:bg-white/10"
                onClick={() => editorRef.current?.applyBold()}
                title="Negrita"
                aria-label="Negrita"
              >
                <Bold className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/10 bg-[#203324] text-white/90 hover:bg-white/10"
                onClick={() => editorRef.current?.applyItalic()}
                title="Cursiva"
                aria-label="Cursiva"
              >
                <Italic className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/10 bg-[#203324] text-white/90 hover:bg-white/10"
                onClick={() => editorRef.current?.insertList()}
                title="Lista"
                aria-label="Lista"
              >
                <List className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/10 bg-[#203324] text-white/90 hover:bg-white/10"
                onClick={() => editorRef.current?.insertFormulaBlock()}
                title="Bloque de fórmula"
                aria-label="Bloque de fórmula"
              >
                <Sigma className="h-3.5 w-3.5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 border-white/10 bg-[#203324] text-white/90 hover:bg-white/10 px-2"
                    title="Símbolos y atajos matemáticos"
                  >
                    <Sigma className="h-4 w-4 mr-1 text-[#40C9A9]" />
                    <ChevronDown className="h-4 w-4 text-white/70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[280px] max-h-[65vh]">
                  <DropdownMenuLabel className="text-white/80">Atajos</DropdownMenuLabel>
                  <DropdownMenuItem
                    className="focus:bg-white/10"
                    onSelect={() => editorRef.current?.insertInlineMath()}
                  >
                    Inline math <span className="ml-auto text-white/60">$x^2$</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-white/10"
                    onSelect={() => editorRef.current?.insertFraction()}
                  >
                    Fracción <span className="ml-auto text-white/60">a/b</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-white/10"
                    onSelect={() => editorRef.current?.insertIntegral()}
                  >
                    Integral <span className="ml-auto text-white/60">∫</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="focus:bg-white/10"
                    onSelect={() => editorRef.current?.insertSummation()}
                  >
                    Sumatoria <span className="ml-auto text-white/60">Σ</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuLabel className="text-white/80">Símbolos</DropdownMenuLabel>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\pi")}>
                    π <span className="ml-auto text-white/60">\\pi</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\alpha")}>
                    α <span className="ml-auto text-white/60">\\alpha</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\beta")}>
                    β <span className="ml-auto text-white/60">\\beta</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\gamma")}>
                    γ <span className="ml-auto text-white/60">\\gamma</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\theta")}>
                    θ <span className="ml-auto text-white/60">\\theta</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\Delta")}>
                    Δ <span className="ml-auto text-white/60">\\Delta</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\sqrt{x}")}>
                    √ <span className="ml-auto text-white/60">{"\\sqrt{x}"}</span>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\infty")}>
                    ∞ <span className="ml-auto text-white/60">\\infty</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\approx")}>
                    ≈ <span className="ml-auto text-white/60">\\approx</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\leq")}>
                    ≤ <span className="ml-auto text-white/60">\\leq</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\geq")}>
                    ≥ <span className="ml-auto text-white/60">\\geq</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\to")}>
                    → <span className="ml-auto text-white/60">\\to</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\in")}>
                    ∈ <span className="ml-auto text-white/60">\\in</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\notin")}>
                    ∉ <span className="ml-auto text-white/60">\\notin</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\pm")}>
                    ± <span className="ml-auto text-white/60">\\pm</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\cdot")}>
                    · <span className="ml-auto text-white/60">\\cdot</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\mathbb{R}")}>
                    ℝ <span className="ml-auto text-white/60">{"\\mathbb{R}"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\mathbb{N}")}>
                    ℕ <span className="ml-auto text-white/60">{"\\mathbb{N}"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-white/10" onSelect={() => editorRef.current?.insertSymbol("\\mathbb{Z}")}>
                    ℤ <span className="ml-auto text-white/60">{"\\mathbb{Z}"}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <span className="mx-1 h-6 w-px bg-white/15" />

            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10"
                onClick={() => editorRef.current?.undo()}
                title="Deshacer"
                aria-label="Deshacer"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="outline"
                className="h-7 w-7 border-white/10 bg-[#203324] text-white/80 hover:bg-white/10"
                onClick={() => editorRef.current?.redo()}
                title="Rehacer"
                aria-label="Rehacer"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <span className="mx-1 h-6 w-px bg-white/15" />

            <Button
              type="button"
              size="sm"
              variant="outline"
              className={
                aiWidget === "expanded"
                  ? "h-7 border-[#40C9A9]/60 bg-[#40C9A9]/15 text-[#40C9A9] hover:bg-[#40C9A9]/20"
                  : "h-7 border-[#40C9A9]/40 bg-[#203324] text-[#40C9A9] hover:bg-[#40C9A9]/10"
              }
              onClick={() => {
                if (aiWidget === "hidden") openAiAssistant();
                else if (aiWidget === "minimized") setAiWidget("expanded");
                else setAiWidget("minimized");
              }}
              title={
                aiWidget === "expanded"
                  ? "Minimizar asistente"
                  : aiWidget === "minimized"
                    ? "Abrir asistente"
                    : "Abrir asistente IA"
              }
            >
              <Bot className="h-4 w-4 mr-2" />
              IA
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1680px] px-4 py-4">
        {loading ? (
          <div className="h-[calc(100vh-146px)] flex items-center justify-center">
            <p className="text-white/80">Cargando…</p>
          </div>
        ) : !obra ? (
          <div className="h-[calc(100vh-146px)] flex items-center justify-center">
            <p className="text-white/80">No se pudo cargar la obra.</p>
          </div>
        ) : (
          <div className="h-[calc(100vh-146px)] grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-[#354B3A] overflow-hidden flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="p-4 flex-1 overflow-auto">
                <DualMarkdownEditor
                  ref={editorRef}
                  value={form.cuerpo}
                  onChange={(next) => setForm((f) => ({ ...f, cuerpo: next }))}
                  placeholder="Escribe el contenido… Usa $...$ o $$...$$ para fórmulas."
                  minHeightClassName="min-h-[560px]"
                  codeMirrorHeight="560px"
                  showToolbar={false}
                  defaultMode="codemirror"
                  onModeChange={setEditorMode}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#354B3A] overflow-hidden flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
              <div className="border-b border-white/10 bg-[#1C2D20] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-white font-medium">Preview PDF-like</div>
                    <div className="text-xs text-white/60">Renderizado Markdown + KaTeX</div>
                  </div>
                  <div className="text-xs text-white/70">{`Páginas ${previewPages.length} · Zoom ${previewZoom}% · Texto ${Math.round(
                    previewFontScale * 100,
                  )}%`}</div>
                </div>
              </div>
              <div
                className="p-4 flex-1 overflow-auto bg-[#203324]"
                onWheel={onPreviewWheel}
                onTouchStart={onPreviewTouchStart}
                onTouchMove={onPreviewTouchMove}
                onTouchEnd={onPreviewTouchEnd}
                onTouchCancel={onPreviewTouchEnd}
              >
                <div className="p-4 space-y-8">
                  {previewPages.map((page, index) => (
                    <div key={index} className="w-full flex justify-center">
                      <div
                        className="flex justify-center"
                        style={{
                          transform: `scale(${previewZoom / 100})`,
                          transformOrigin: "top center",
                        }}
                      >
                        <div
                          className={
                            previewPaperMode === "dim"
                              ? "bg-[#0F1411] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.55)] px-12 py-10 flex flex-col"
                              : "bg-white border border-black/10 shadow-[0_8px_30px_rgba(0,0,0,0.15)] px-12 py-10 flex flex-col"
                          }
                          style={{ width: `${paperPx.w}px`, minHeight: `${paperPx.h}px` }}
                        >
                          {(() => {
                            const tpl = renderTpl(previewHeaderTpl, {
                              page: index + 1,
                              pages: previewPages.length,
                              title: form.titulo,
                            });
                            const parts = splitTwoCols(tpl);
                            if (!tpl.trim()) return null;
                            return parts.right ? (
                              <div
                                className={
                                  previewPaperMode === "dim"
                                    ? "mb-6 text-[11px] text-white/55 flex items-center justify-between"
                                    : "mb-6 text-[11px] text-black/55 flex items-center justify-between"
                                }
                              >
                                <div className="truncate">{parts.left}</div>
                                <div className="truncate">{parts.right}</div>
                              </div>
                            ) : (
                              <div
                                className={
                                  previewPaperMode === "dim"
                                    ? "mb-6 text-[11px] text-white/55 text-center"
                                    : "mb-6 text-[11px] text-black/55 text-center"
                                }
                              >
                                {parts.left}
                              </div>
                            );
                          })()}
                        <MarkdownMath
                          className={[
                            "prose prose-sm md:prose-base max-w-none",
                            previewPaperMode === "dim"
                              ? [
                                  "text-white/90 prose-headings:text-white prose-strong:text-white",
                                  "prose-a:text-[#40C9A9] prose-code:text-[#9FE9D6]",
                                  "prose-pre:bg-[#0B1210] prose-pre:text-white prose-pre:border prose-pre:border-white/10",
                                  "prose-blockquote:text-white/75 prose-blockquote:border-white/20",
                                  "prose-hr:border-white/15",
                                ].join(" ")
                              : [
                                  "text-black prose-headings:text-black prose-strong:text-black",
                                  "prose-a:text-[#1f6f5f] prose-code:text-[#0b5f4f]",
                                  "prose-pre:bg-[#f5f7fa] prose-pre:text-black prose-pre:border prose-pre:border-black/15",
                                  "prose-blockquote:text-black/80 prose-blockquote:border-black/20",
                                  "prose-hr:border-black/15",
                                ].join(" "),
                            "font-serif leading-[1.65]",
                          ].join(" ")}
                          style={{ fontSize: `${Math.round(13 * previewFontScale)}px` }}
                        >
                          {page}
                        </MarkdownMath>
                          {(() => {
                            const tpl = renderTpl(previewFooterTpl, {
                              page: index + 1,
                              pages: previewPages.length,
                              title: form.titulo,
                            });
                            const parts = splitTwoCols(tpl);
                            if (!tpl.trim())
                              return (
                                <div
                                  className={
                                    previewPaperMode === "dim"
                                      ? "mt-auto pt-6 text-center text-xs text-white/45"
                                      : "mt-auto pt-6 text-center text-xs text-black/45"
                                  }
                                >
                                  Página {index + 1}
                                </div>
                              );
                            return parts.right ? (
                              <div
                                className={
                                  previewPaperMode === "dim"
                                    ? "mt-auto pt-6 text-[11px] text-white/55 flex items-center justify-between"
                                    : "mt-auto pt-6 text-[11px] text-black/55 flex items-center justify-between"
                                }
                              >
                                <div className="truncate">{parts.left}</div>
                                <div className="truncate">{parts.right}</div>
                              </div>
                            ) : (
                              <div
                                className={
                                  previewPaperMode === "dim"
                                    ? "mt-auto pt-6 text-[11px] text-white/55 text-center"
                                    : "mt-auto pt-6 text-[11px] text-black/55 text-center"
                                }
                              >
                                {parts.left}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {aiWidget === "expanded" ? (
        <div
          className="fixed z-[200] flex h-[min(520px,72vh)] w-[360px] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#354B3A] shadow-[0_16px_48px_rgba(0,0,0,0.45)]"
          style={{ left: aiPos.x, top: aiPos.y }}
          role="complementary"
          aria-label="Asistente IA del editor"
        >
          <div
            className="flex cursor-grab items-center justify-between gap-2 border-b border-white/10 bg-[#203324] px-3 py-2.5 active:cursor-grabbing touch-none select-none"
            onPointerDown={onAiHeaderPointerDown}
            onPointerMove={onAiHeaderPointerMove}
            onPointerUp={onAiHeaderPointerUp}
            onPointerCancel={onAiHeaderPointerUp}
          >
            <div className="flex min-w-0 items-center gap-2 text-white">
              <GripVertical className="h-4 w-4 shrink-0 text-white/45" aria-hidden />
              <Bot className="h-4 w-4 shrink-0 text-[#40C9A9]" aria-hidden />
              <span className="truncate text-sm font-medium">Asistente</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white/75 hover:bg-white/10 hover:text-white"
                onClick={() => setAiWidget("minimized")}
                title="Minimizar"
                aria-label="Minimizar asistente"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-white/75 hover:bg-white/10 hover:text-white"
                onClick={() => setAiWidget("hidden")}
                title="Cerrar"
                aria-label="Cerrar asistente"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
            {aiMessages.length === 0 ? (
              <p className="text-xs leading-relaxed text-white/55">
                Escribe abajo lo que necesitas (redactar, resumir, ejemplos, estructura…). Se aplicará al documento según el ámbito y el
                modo insertar o reemplazar.
              </p>
            ) : (
              <div className="space-y-2">
                {aiMessages.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={
                      m.role === "user"
                        ? "ml-4 rounded-lg bg-[#1C2D20] px-2.5 py-2 text-xs text-white/90"
                        : "mr-4 rounded-lg bg-[#283d32] px-2.5 py-2 text-xs text-white/85 border border-white/5"
                    }
                  >
                    <div className="mb-1 text-[10px] font-medium uppercase tracking-wide text-white/45">
                      {m.role === "user" ? "Tú" : "Asistente"}
                    </div>
                    <div className="whitespace-pre-wrap break-words max-h-[200px] overflow-y-auto">{m.content}</div>
                  </div>
                ))}
                <div ref={aiMessagesEndRef} />
              </div>
            )}
          </div>

          <div className="border-t border-white/10 bg-[#1C2D20]/90 px-3 py-2">
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 border-white/10 bg-[#203324] text-[11px] text-white/85 hover:bg-white/10"
                onClick={() => setAiPrompt("Mejora la redacción, claridad y estructura, manteniendo el significado.")}
              >
                Mejorar redacción
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 border-white/10 bg-[#203324] text-[11px] text-white/85 hover:bg-white/10"
                onClick={() => setAiPrompt("Crea una estructura con secciones (##) y puntos clave (bullets).")}
              >
                Estructurar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 border-white/10 bg-[#203324] text-[11px] text-white/85 hover:bg-white/10"
                onClick={() =>
                  setAiPrompt("Explica este contenido con ejemplos y agrega 5 preguntas de práctica al final.")
                }
              >
                Ejemplos + práctica
              </Button>
            </div>

            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="text-[10px] text-white/50">Ámbito</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={
                  aiScope === "selection"
                    ? "h-7 border-[#40C9A9]/40 bg-[#203324] text-[11px] text-[#40C9A9]"
                    : "h-7 border-white/10 bg-[#203324] text-[11px] text-white/80 hover:bg-white/10"
                }
                onClick={() => setAiScope("selection")}
              >
                Selección
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={
                  aiScope === "document"
                    ? "h-7 border-[#40C9A9]/40 bg-[#203324] text-[11px] text-[#40C9A9]"
                    : "h-7 border-white/10 bg-[#203324] text-[11px] text-white/80 hover:bg-white/10"
                }
                onClick={() => setAiScope("document")}
              >
                Documento
              </Button>
              <span className="text-[10px] text-white/35">|</span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={
                  aiApplyMode === "insert"
                    ? "h-7 border-[#40C9A9]/40 bg-[#203324] text-[11px] text-[#40C9A9]"
                    : "h-7 border-white/10 bg-[#203324] text-[11px] text-white/80 hover:bg-white/10"
                }
                onClick={() => setAiApplyMode("insert")}
              >
                Insertar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className={
                  aiApplyMode === "replace"
                    ? "h-7 border-[#40C9A9]/40 bg-[#203324] text-[11px] text-[#40C9A9]"
                    : "h-7 border-white/10 bg-[#203324] text-[11px] text-white/80 hover:bg-white/10"
                }
                onClick={() => setAiApplyMode("replace")}
              >
                Reemplazar
              </Button>
            </div>
            {aiScope === "selection" ? (
              <div className="mb-2 text-[10px] text-white/45">Selecciona texto en el editor antes de enviar.</div>
            ) : null}
            {aiApplyMode === "replace" && aiScope === "document" ? (
              <div className="mb-2 text-[10px] text-amber-200/80">Reemplazar + Documento sustituye todo el cuerpo.</div>
            ) : null}

            <div className="mt-1 flex items-end gap-2">
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    void runAi();
                  }
                }}
                placeholder="Escribe… (Ctrl+Enter)"
                className="min-h-[44px] max-h-[120px] resize-none bg-[#203324] border-white/10 text-white text-sm rounded-2xl px-3 py-2 leading-5"
              />
              <Button
                type="button"
                size="icon"
                className="h-10 w-10 rounded-2xl bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white disabled:opacity-60"
                onClick={() => void runAi()}
                disabled={aiRunning || !aiPrompt.trim()}
                title="Enviar"
                aria-label="Enviar"
              >
                <SendHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {aiWidget === "minimized" ? (
        <div
          className="fixed z-[200] flex items-center gap-0.5 rounded-2xl border border-white/10 bg-[#283d32] p-1 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
          style={{ left: minimizedChipPos.left, top: minimizedChipPos.top }}
        >
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#40C9A9]/20 text-[#40C9A9] hover:bg-[#40C9A9]/30"
            onClick={() => setAiWidget("expanded")}
            title="Abrir asistente"
            aria-label="Abrir asistente IA"
          >
            <Bot className="h-5 w-5" />
          </button>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-white"
            onClick={() => setAiWidget("hidden")}
            title="Cerrar"
            aria-label="Ocultar asistente"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

