"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, MessageSquare, Send } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Comentario = {
  id: string;
  contenido: string;
  createdAt: string;
  autor: {
    id: string;
    name: string;
    username: string | null;
    image: string | null;
  };
};

function iniciales(nombre: string) {
  const p = nombre.trim().split(/\s+/).filter(Boolean);
  if (!p.length) return "?";
  if (p.length === 1) return p[0]!.slice(0, 2).toUpperCase();
  return (p[0]![0] + p[1]![0]).toUpperCase();
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString("es", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  recursoId: string;
  className?: string;
  compact?: boolean;
};

export function CaletaComentariosSection({ recursoId, className = "", compact = false }: Props) {
  const [comentarios, setComentarios] = useState<Comentario[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [texto, setTexto] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/caletas/recursos/${encodeURIComponent(recursoId)}/comentarios`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudieron cargar los comentarios");
      setComentarios(data.comentarios ?? []);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error cargando comentarios");
    } finally {
      setLoading(false);
    }
  }, [recursoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    const contenido = texto.trim();
    if (!contenido || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/caletas/recursos/${encodeURIComponent(recursoId)}/comentarios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contenido }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo publicar el comentario");
      setComentarios((prev) => [data.comentario, ...prev]);
      setTexto("");
      toast.success("Comentario publicado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error publicando comentario");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[color-mix(in_srgb,var(--mygreen-dark)_92%,black)] ${className}`}
    >
      <div className="border-b border-white/10 px-4 py-3 sm:px-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-white sm:text-base">
          <MessageSquare className="h-4 w-4 text-[var(--caleta-accent)]" />
          Comentarios
          {!loading ? (
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs font-medium text-white/70">
              {comentarios.length}
            </span>
          ) : null}
        </h2>
      </div>

      <div className={`space-y-4 p-4 sm:p-5 ${compact ? "max-h-[420px] overflow-y-auto" : ""}`}>
        <div className="space-y-2">
          <Textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un comentario sobre esta caleta…"
            maxLength={2000}
            rows={compact ? 2 : 3}
            className="resize-none border-white/15 bg-white/10 text-white placeholder:text-white/45 focus-visible:ring-[var(--caleta-accent)]"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-white/45">{texto.length}/2000</span>
            <Button
              type="button"
              size="sm"
              disabled={submitting || !texto.trim()}
              onClick={() => void submit()}
              className="bg-[var(--caleta-accent)] text-white hover:bg-[color-mix(in_oklab,var(--caleta-accent)_82%,transparent)]"
            >
              {submitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Publicar
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--caleta-accent)]" />
          </div>
        ) : comentarios.length === 0 ? (
          <p className="py-4 text-center text-sm text-white/55">
            Sé el primero en comentar esta caleta.
          </p>
        ) : (
          <ul className="space-y-3">
            {comentarios.map((c) => (
              <li
                key={c.id}
                className="rounded-xl border border-white/8 bg-white/[0.03] p-3 sm:p-4"
              >
                <div className="flex gap-3">
                  <Avatar className="h-9 w-9 shrink-0 border border-white/10">
                    <AvatarImage src={c.autor.image ?? undefined} alt={c.autor.name} />
                    <AvatarFallback className="bg-[var(--mygreen-dark)] text-xs text-white">
                      {iniciales(c.autor.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      {c.autor.username ? (
                        <Link
                          href={`/u/${c.autor.username}`}
                          className="text-sm font-semibold text-[var(--caleta-accent)] hover:underline"
                        >
                          {c.autor.name}
                        </Link>
                      ) : (
                        <span className="text-sm font-semibold text-white">{c.autor.name}</span>
                      )}
                      <span className="text-xs text-white/45">{formatFecha(c.createdAt)}</span>
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-white/78">
                      {c.contenido}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
