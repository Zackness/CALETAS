"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Bot, Send, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useSubscriptionRequired } from "@/hooks/use-subscription-required";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ProfileResponse = {
  user: {
    id: string;
    carrera?: { nombre: string } | null;
  };
};

export default function ChatIA() {
  const { loading: subLoading, isActive } = useSubscriptionRequired();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hola. Soy tu tutor IA. Dime tu materia, tema y qué necesitas (explicar, resolver, practicar, repasar) y lo adapto a tu carrera.",
    },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [careerName, setCareerName] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

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

  const onSend = async () => {
    const text = input.trim();
    if (!text || sending || subLoading || !isActive) return;

    setInput("");
    setSending(true);

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);

    try {
      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || "No se pudo responder");
      }

      if (typeof data?.careerName === "string" || data?.careerName === null) {
        setCareerName(data.careerName);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al enviar el mensaje");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Se me complicó responder. Intenta de nuevo o reformula la pregunta.",
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-t from-mygreen to-mygreen-light">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-start justify-between gap-4 flex-col md:flex-row">
            <div>
              <h1 className="text-3xl font-special text-white mb-2 flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-[#40C9A9]" />
                Chat IA
              </h1>
              <p className="text-white/70">
                Tutor especializado según tu carrera para estudiar con ejemplos y práctica.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {careerName ? (
                <Badge className="bg-white/10 text-white border border-white/10">
                  Carrera: {careerName}
                </Badge>
              ) : (
                <Badge className="bg-white/10 text-white/80 border border-white/10">
                  Carrera: no configurada
                </Badge>
              )}

              <Button
                type="button"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => {
                  setMessages([
                    {
                      role: "assistant",
                      content:
                        "Nuevo chat. Dime tu materia, tema y objetivo (explicar, resolver, practicar) y empezamos.",
                    },
                  ]);
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            </div>
          </div>
        </div>

        <Card className="bg-[#354B3A] border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Bot className="w-5 h-5 text-[#40C9A9]" />
              Conversación
            </CardTitle>
            <CardDescription className="text-white/70">
              Tip: incluye tu semestre y el nombre de la materia para respuestas más precisas.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="h-[55vh] overflow-y-auto rounded-lg bg-[#1C2D20] border border-white/10 p-4 space-y-3">
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
                          ? "bg-[#40C9A9]/20 text-white border-[#40C9A9]/30"
                          : "bg-white/10 text-white/90 border-white/10"
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
                className="bg-[#1C2D20] border-white/10 text-white placeholder:text-white/50 min-h-[90px]"
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

