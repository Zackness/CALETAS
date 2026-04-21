"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bot, Edit3, Plus, Send, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useSubscriptionRequired } from "@/hooks/use-subscription-required";
import { IATrialBanner } from "@/components/ia-trial-banner";
import {
  createThread,
  IAChatMessage,
  IAChatThread,
  IA_STORE_EVENT,
  loadIAStore,
  saveIAStore,
  deleteThread,
  threadTitleFromText,
  updateThread,
} from "@/lib/ia-chat-store";

type ChatMessage = IAChatMessage;

type ProfileResponse = {
  user: {
    id: string;
    carrera?: { nombre: string } | null;
  };
};

export default function ChatIA() {
  const { loading: subLoading, isActive, canUseChat } = useSubscriptionRequired({
    allowTrial: true,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeThread, setActiveThread] = useState<IAChatThread | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [careerName, setCareerName] = useState<string | null>(null);
  const [activeProjectName, setActiveProjectName] = useState<string | null>(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  useEffect(() => {
    const sync = () => {
      const store = loadIAStore();
      let thread = store.threads.find((t) => t.id === store.activeThreadId) || null;
      if (!thread) {
        const next = createThread(store, store.activeProjectId);
        saveIAStore(next);
        thread = next.threads.find((t) => t.id === next.activeThreadId) || null;
      }
      if (!thread) return;
      setActiveThread(thread);
      setMessages(thread.messages);
      const project = thread.projectId ? store.projects.find((p) => p.id === thread.projectId) : null;
      setActiveProjectName(project?.name || null);
    };

    sync();
    window.addEventListener(IA_STORE_EVENT, sync as EventListener);
    return () => window.removeEventListener(IA_STORE_EVENT, sync as EventListener);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user");
        if (!res.ok) return;
        const data = (await res.json()) as ProfileResponse;
        setCareerName(data.user?.carrera?.nombre || null);
      } catch {
        // silencioso
      }
    })();
  }, []);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);

  const persistThreadMessages = (nextMessages: ChatMessage[]) => {
    if (!activeThread) return;
    const store = loadIAStore();
    const candidateTitle =
      activeThread.title === "Nuevo chat" && nextMessages.length > 1
        ? threadTitleFromText(nextMessages.find((m) => m.role === "user")?.content || "")
        : activeThread.title;
    const nextThread: IAChatThread = {
      ...activeThread,
      title: candidateTitle,
      messages: nextMessages,
      updatedAt: new Date().toISOString(),
    };
    const next = updateThread(store, nextThread);
    saveIAStore(next);
    setActiveThread(nextThread);
  };

  const onSend = async () => {
    const text = input.trim();
    const chatAllowed = isActive ? canUseChat : true;
    if (!text || sending || subLoading || !chatAllowed || !activeThread) return;

    setInput("");
    setSending(true);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    persistThreadMessages(nextMessages);

    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          projectContext: (() => {
            const store = loadIAStore();
            const projectId = activeThread.projectId;
            if (!projectId) return "";
            const files = store.projectFiles.filter((f) => f.projectId === projectId);
            if (!files.length) return "";
            return files
              .map(
                (f, i) =>
                  `[Archivo ${i + 1}: ${f.name}]\n${f.textContent.slice(0, 4000)}`,
              )
              .join("\n\n");
          })(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (res.status === 402 && data?.code === "FREE_LIMIT_REACHED") {
          throw new Error(data?.error || "Límite gratis alcanzado. Suscríbete para continuar.");
        }
        throw new Error(data?.error || "No se pudo responder");
      }

      if (typeof data?.careerName === "string" || data?.careerName === null) {
        setCareerName(data.careerName);
      }

      const finalMessages = [...nextMessages, { role: "assistant" as const, content: data.message }];
      setMessages(finalMessages);
      persistThreadMessages(finalMessages);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar el mensaje");
      const fallbackMessages = [
        ...nextMessages,
        {
          role: "assistant" as const,
          content: "Se me complicó responder. Intenta de nuevo o reformula la pregunta.",
        },
      ];
      setMessages(fallbackMessages);
      persistThreadMessages(fallbackMessages);
    } finally {
      setSending(false);
    }
  };

  const createNewChat = () => {
    const store = loadIAStore();
    const next = createThread(store, store.activeProjectId);
    saveIAStore(next);
  };

  const renameChat = () => {
    if (!activeThread) return;
    setRenameValue(activeThread.title);
    setRenameDialogOpen(true);
  };

  const confirmRenameChat = () => {
    if (!activeThread) return;
    const value = renameValue.trim();
    if (!value) return;
    const store = loadIAStore();
    const nextThread = { ...activeThread, title: value, updatedAt: new Date().toISOString() };
    const next = updateThread(store, nextThread);
    saveIAStore(next);
    setActiveThread(nextThread);
    setRenameDialogOpen(false);
  };

  const requestDeleteChat = () => {
    if (!activeThread) return;
    setDeleteDialogOpen(true);
  };

  const confirmDeleteChat = () => {
    if (!activeThread) return;
    const store = loadIAStore();
    const next = deleteThread(store, activeThread.id);
    saveIAStore(next);
    setDeleteDialogOpen(false);
    toast.success("Chat eliminado");
  };

  return (
    <div className="min-h-screen">
      {!subLoading && !isActive ? (
        <div className="container mx-auto px-4 pt-6">
          <IATrialBanner toolLabel="Chat IA" endpoint="ia/chat" />
        </div>
      ) : null}

      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="bg-[#203324] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Renombrar chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label className="text-white/80" htmlFor="rename-chat-input">
              Nuevo nombre
            </Label>
            <Input
              id="rename-chat-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              className="bg-[#1C2D20] border-white/20 text-white"
              placeholder="Ej: Ejercicios de Control I"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmRenameChat();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
              onClick={confirmRenameChat}
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-[#203324] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Eliminar chat</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-white/80">
            Esta acción eliminará este chat de forma permanente del proyecto.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-red-500/90 hover:bg-red-500 text-white"
              onClick={confirmDeleteChat}
            >
              Eliminar chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="w-full px-2 md:px-4 py-4 md:py-6">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-3 flex-col lg:flex-row">
            <div>
              <h1 className="text-2xl md:text-3xl font-special text-white mb-2 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-[#40C9A9]" />
                Chat IA
              </h1>
              <p className="text-white/70">
                Espacio de conversación moderno con chats por proyecto y contexto académico.
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-[#354B3A] text-white border border-white/10">
                {activeThread?.title || "Cargando chat..."}
              </Badge>
              {careerName ? (
                <Badge className="bg-[#354B3A] text-white border border-white/10">
                  Carrera: {careerName}
                </Badge>
              ) : (
                <Badge className="bg-[#354B3A] text-white/80 border border-white/10">
                  Carrera: no configurada
                </Badge>
              )}
              {activeProjectName ? (
                <Badge className="bg-[#354B3A] text-white border border-white/10">
                  Proyecto: {activeProjectName}
                </Badge>
              ) : null}

              <Button
                type="button"
                variant="outline"
                className="border-[#40C9A9]/60 bg-[#203324] text-white hover:bg-[#354B3A]"
                onClick={renameChat}
              >
                <Edit3 className="w-4 h-4 mr-2" />
                Renombrar
              </Button>
              <Button
                type="button"
                className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                onClick={createNewChat}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nuevo chat
              </Button>
              <Button
                type="button"
                variant="outline"
                className="border-red-400/40 bg-[#203324] text-white hover:bg-red-500/20"
                onClick={requestDeleteChat}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar chat
              </Button>
            </div>
          </div>
        </div>

        <Card className="bg-[#354B3A] border-white/10 shadow-2xl shadow-black/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#40C9A9]" />
              Conversación
            </CardTitle>
            <CardDescription className="text-white/70">
              Tip: incluye semestre, materia y objetivo para respuestas más precisas.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="h-[60vh] overflow-y-auto rounded-xl bg-[#1C2D20] border border-white/10 p-4 space-y-3">
              {messages.map((m, idx) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex ${isUser ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${
                        isUser
                          ? "bg-[#40C9A9]/25 text-white border-[#40C9A9]/40"
                          : "bg-[#354B3A] text-white/90 border-white/10"
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{m.content}</div>
                    </div>
                  </div>
                );
              })}

              {sending ? (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 text-sm border bg-white/10 text-white/80 border-white/10">
                    Escribiendo...
                  </div>
                </div>
              ) : null}

              <div ref={bottomRef} />
            </div>

            <div className="space-y-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta… (Enter para enviar, Shift+Enter para salto de línea)"
                className="bg-[#1C2D20] border-white/10 text-white placeholder:text-white/50 min-h-[90px] rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void onSend();
                  }
                }}
                disabled={sending}
              />

              <div className="flex justify-end">
                <Button
                  type="button"
                  className="bg-[#40C9A9] hover:bg-[#40C9A9]/80 text-white"
                  disabled={!canSend}
                  onClick={() => void onSend()}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Enviar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

