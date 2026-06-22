"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Sparkles, Square } from "lucide-react";
import { useSubscriptionRequired } from "@/hooks/use-subscription-required";
import { IATrialBanner } from "@/components/ia-trial-banner";
import { IaModelPicker } from "@/components/ia-model-picker";
import { ChatMessageBubble } from "@/components/ia/chat-message";
import { IaChatThinkingIndicator } from "@/components/ia/chat-thinking-indicator";
import { CaletaContextPicker } from "@/components/ia/caleta-context-picker";
import { readIaChatStream, isAbortError, IaChatStreamAbortedError } from "@/lib/ia-chat-stream";
import {
  createThread,
  IAChatMessage,
  IAChatThread,
  IA_STORE_EVENT,
  loadIAStore,
  saveIAStore,
  threadTitleFromText,
  updateThread,
} from "@/lib/ia-chat-store";

type ChatMessage = IAChatMessage;

function apiMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter((m) => !m.error).map(({ role, content }) => ({ role, content }));
}

export default function ChatIA() {
  const { loading: subLoading, isActive, canUseChat } = useSubscriptionRequired({
    allowTrial: true,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeThread, setActiveThread] = useState<IAChatThread | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [streamDraft, setStreamDraft] = useState<string | null>(null);
  const [streamStatus, setStreamStatus] = useState<string | null>(null);
  const [streamThinking, setStreamThinking] = useState<string | null>(null);
  const [streamConnected, setStreamConnected] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const streamDraftRef = useRef("");

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending, editingIndex, streamDraft, streamStatus, streamThinking]);

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
      setEditingIndex(null);
      setEditDraft("");
      setStreamDraft(null);
      setStreamStatus(null);
      setStreamThinking(null);
      setStreamConnected(false);
    };

    sync();
    window.addEventListener(IA_STORE_EVENT, sync as EventListener);
    return () => window.removeEventListener(IA_STORE_EVENT, sync as EventListener);
  }, []);

  const canSend = useMemo(() => input.trim().length > 0 && !sending, [input, sending]);
  const isWelcomeOnly =
    messages.length <= 1 && messages[0]?.role === "assistant" && !messages[0]?.error;

  const persistThreadMessages = useCallback(
    (nextMessages: ChatMessage[], threadOverride?: IAChatThread | null) => {
      const thread = threadOverride ?? activeThread;
      if (!thread) return;
      const store = loadIAStore();
      const firstUser = nextMessages.find((m) => m.role === "user" && !m.error);
      const candidateTitle =
        thread.title === "Nuevo chat" && firstUser
          ? threadTitleFromText(firstUser.content)
          : thread.title;
      const nextThread: IAChatThread = {
        ...thread,
        title: candidateTitle,
        messages: nextMessages,
        updatedAt: new Date().toISOString(),
      };
      const next = updateThread(store, nextThread);
      saveIAStore(next);
      setActiveThread(nextThread);
    },
    [activeThread],
  );

  const persistThreadCaletas = useCallback(
    (ids: string[]) => {
      if (!activeThread) return;
      const store = loadIAStore();
      const nextThread: IAChatThread = {
        ...activeThread,
        caletaRecursoIds: ids,
        updatedAt: new Date().toISOString(),
      };
      const next = updateThread(store, nextThread);
      saveIAStore(next);
      setActiveThread(nextThread);
    },
    [activeThread],
  );

  const getProjectContext = useCallback((thread: IAChatThread) => {
    const store = loadIAStore();
    const projectId = thread.projectId;
    if (!projectId) return "";
    const files = store.projectFiles.filter((f) => f.projectId === projectId);
    if (!files.length) return "";
    return files.map((f, i) => `[Archivo ${i + 1}: ${f.name}]\n${f.textContent.slice(0, 4000)}`).join("\n\n");
  }, []);

  const requestCompletion = useCallback(
    async (
      history: ChatMessage[],
      thread: IAChatThread,
      signal: AbortSignal,
      callbacks: {
        onStatus: (status: string) => void;
        onThinking: (thinking: string) => void;
        onDelta: (accumulated: string) => void;
        onConnected: () => void;
      },
    ): Promise<{ text: string; careerName: string | null }> => {
      const payload = apiMessages(history);
      if (!payload.some((m) => m.role === "user")) {
        throw new Error("No hay mensaje de usuario para enviar");
      }

      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          messages: payload,
          projectContext: getProjectContext(thread),
          caletaRecursoIds: thread.caletaRecursoIds ?? [],
          stream: true,
        }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!res.ok) {
        if (contentType.includes("application/json")) {
          const data = await res.json();
          if (res.status === 402 && data?.code === "FREE_LIMIT_REACHED") {
            throw new Error(data?.error || "Límite gratis alcanzado. Suscríbete para continuar.");
          }
          throw new Error(data?.error || "No se pudo obtener respuesta");
        }
        throw new Error("No se pudo obtener respuesta");
      }

      if (!res.body) {
        throw new Error("El servidor no devolvió stream");
      }

      callbacks.onConnected();

      const { text, careerName } = await readIaChatStream(
        res.body,
        {
          onStatus: callbacks.onStatus,
          onThinking: callbacks.onThinking,
          onDelta: callbacks.onDelta,
        },
        signal,
      );
      return { text, careerName };
    },
    [getProjectContext],
  );

  const onStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const completeFromHistory = useCallback(
    async (history: ChatMessage[]) => {
      if (!activeThread) return;
      const chatAllowed = isActive ? canUseChat : true;
      if (subLoading || !chatAllowed) return;

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSending(true);
      setMessages(history);
      setStreamDraft(null);
      setStreamStatus("Conectando con la IA…");
      setStreamThinking(null);
      setStreamConnected(false);
      streamDraftRef.current = "";

      try {
        const { text: answer } = await requestCompletion(
          history,
          activeThread,
          controller.signal,
          {
            onConnected: () => setStreamConnected(true),
            onStatus: (status) => setStreamStatus(status),
            onThinking: (thinking) => setStreamThinking(thinking || null),
            onDelta: (accumulated) => {
              streamDraftRef.current = accumulated;
              setStreamDraft(accumulated);
              setStreamStatus(null);
            },
          },
        );
        const finalMessages: ChatMessage[] = [...history, { role: "assistant", content: answer }];
        setStreamDraft(null);
        setStreamStatus(null);
        setStreamThinking(null);
        setStreamConnected(false);
        streamDraftRef.current = "";
        setMessages(finalMessages);
        persistThreadMessages(finalMessages);
      } catch (e) {
        if (isAbortError(e)) {
          const partial =
            e instanceof IaChatStreamAbortedError
              ? e.partialText.trim()
              : streamDraftRef.current.trim();
          setStreamDraft(null);
          setStreamStatus(null);
          setStreamThinking(null);
          setStreamConnected(false);
          streamDraftRef.current = "";
          if (partial) {
            const finalMessages: ChatMessage[] = [
              ...history,
              { role: "assistant", content: partial },
            ];
            setMessages(finalMessages);
            persistThreadMessages(finalMessages);
          } else {
            setMessages(history);
          }
          return;
        }

        const detail = e instanceof Error ? e.message : "Error al contactar la IA";
        setStreamDraft(null);
        setStreamStatus(null);
        setStreamThinking(null);
        setStreamConnected(false);
        streamDraftRef.current = "";
        const withError: ChatMessage[] = [
          ...history,
          {
            role: "assistant",
            content: "No pude completar la respuesta.",
            error: true,
            errorDetail: detail,
          },
        ];
        setMessages(withError);
        persistThreadMessages(withError);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
        setSending(false);
        textareaRef.current?.focus();
      }
    },
    [activeThread, canUseChat, isActive, persistThreadMessages, requestCompletion, subLoading],
  );

  const onSend = async () => {
    const text = input.trim();
    const chatAllowed = isActive ? canUseChat : true;
    if (!text || sending || subLoading || !chatAllowed || !activeThread) return;

    setInput("");
    setEditingIndex(null);

    const history: ChatMessage[] = [...messages.filter((m) => !m.error), { role: "user", content: text }];
    persistThreadMessages(history);
    await completeFromHistory(history);
  };

  const onRetry = async (errorIndex: number) => {
    if (sending || !activeThread) return;
    const history = messages.slice(0, errorIndex).filter((m) => !m.error);
    if (!history.some((m) => m.role === "user")) return;
    await completeFromHistory(history);
  };

  const onStartEdit = (index: number) => {
    if (sending || messages[index]?.role !== "user") return;
    setEditingIndex(index);
    setEditDraft(messages[index].content);
  };

  const onCancelEdit = () => {
    setEditingIndex(null);
    setEditDraft("");
  };

  const onSaveEdit = async () => {
    if (editingIndex === null || sending || !activeThread) return;
    const text = editDraft.trim();
    if (!text) return;

    const history = [
      ...messages.slice(0, editingIndex).filter((m) => !m.error),
      { role: "user" as const, content: text },
    ];
    setEditingIndex(null);
    setEditDraft("");
    persistThreadMessages(history);
    await completeFromHistory(history);
  };

  return (
    <div className="flex min-h-[calc(100dvh-5.25rem)] flex-col md:min-h-[calc(100dvh-4.75rem)]">
      {!subLoading && !isActive ? (
        <div className="shrink-0 border-b border-white/10 px-2 py-2 sm:px-4">
          <IATrialBanner toolLabel="Chat" endpoint="ia/chat" />
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-3 py-6 sm:px-4">
            {isWelcomeOnly ? (
              <div className="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-24">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)] text-[var(--accent-hex)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="font-special text-xl text-white sm:text-2xl">
                  {activeThread?.title === "Nuevo chat" ? "¿En qué te ayudo hoy?" : activeThread?.title}
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/60">
                  Pregunta sobre tus materias, pide explicaciones paso a paso o adjunta caletas para consultar tus archivos.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((m, idx) => (
                  <ChatMessageBubble
                    key={idx}
                    message={m}
                    isUser={m.role === "user"}
                    isEditing={editingIndex === idx}
                    editDraft={editDraft}
                    onEditDraftChange={setEditDraft}
                    onStartEdit={() => onStartEdit(idx)}
                    onCancelEdit={onCancelEdit}
                    onSaveEdit={() => void onSaveEdit()}
                    onRetry={() => void onRetry(idx)}
                    sending={sending}
                    canEdit={m.role === "user" && (editingIndex === null || editingIndex === idx)}
                  />
                ))}

                {streamDraft !== null ? (
                  <ChatMessageBubble
                    message={{ role: "assistant", content: streamDraft }}
                    isUser={false}
                    isEditing={false}
                    editDraft=""
                    onEditDraftChange={() => {}}
                    onStartEdit={() => {}}
                    onCancelEdit={() => {}}
                    onSaveEdit={() => {}}
                    onRetry={() => {}}
                    sending={sending}
                    canEdit={false}
                    isStreaming
                    streamStatus={streamStatus}
                    streamThinking={streamThinking}
                  />
                ) : null}

                {sending && streamDraft === null ? (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70">
                      <Sparkles className="h-4 w-4 animate-pulse text-[var(--accent-hex)]" />
                    </div>
                    <IaChatThinkingIndicator
                      status={streamStatus ?? (streamConnected ? "Pensando en tu respuesta…" : "Conectando con la IA…")}
                      thinking={streamThinking}
                    />
                  </div>
                ) : null}

                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-white/10 bg-[color-mix(in_oklab,var(--mygreen)_88%,transparent)] px-2 py-3 backdrop-blur-md sm:px-4">
          <div className="mx-auto w-full max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-white/15 bg-[var(--mygreen-dark)] shadow-[0_8px_32px_rgba(0,0,0,0.22)]">
              <div className="flex flex-wrap items-center gap-1.5 border-b border-white/10 px-2 py-1.5">
                <CaletaContextPicker
                  selectedIds={activeThread?.caletaRecursoIds ?? []}
                  onChange={persistThreadCaletas}
                  disabled={subLoading || sending}
                  compact
                />
                <IaModelPicker
                  role="chat"
                  compact
                  disabled={subLoading || sending}
                />
              </div>
              <div className="flex items-end gap-2 px-2 py-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Escribe un mensaje…"
                  rows={1}
                  className="max-h-40 min-h-[44px] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-sm text-white placeholder:text-white/45 focus-visible:ring-0 focus-visible:ring-offset-0"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      if (sending) return;
                      void onSend();
                    }
                  }}
                />
                {sending ? (
                  <Button
                    type="button"
                    size="icon"
                    aria-label="Detener respuesta"
                    className="mb-0.5 h-9 w-9 shrink-0 rounded-xl bg-white text-[#1C2D20] hover:bg-white/90"
                    onClick={onStop}
                  >
                    <Square className="h-3.5 w-3.5 fill-current" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="icon"
                    aria-label="Enviar mensaje"
                    className="mb-0.5 h-9 w-9 shrink-0 rounded-xl bg-[var(--accent-hex)] text-[#1C2D20] hover:opacity-90 disabled:opacity-35"
                    disabled={!canSend}
                    onClick={() => void onSend()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <p className="mt-2 text-center text-[10px] text-white/40">
              La IA puede equivocarse. Verifica información importante.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
