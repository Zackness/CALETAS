"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ArrowLeft, CalendarDays, Check, Loader2, Mic, RotateCcw, Sparkles, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ProposedEvent = {
  title: string;
  activityType?: string | null;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  description?: string | null;
  location?: string | null;
  reminderMinutes?: number | null;
};

const REMINDER_OPTIONS = [
  { value: "", label: "Sin recordatorio" },
  { value: "0", label: "Al momento" },
  { value: "10", label: "10 minutos antes" },
  { value: "30", label: "30 minutos antes" },
  { value: "60", label: "1 hora antes" },
  { value: "180", label: "3 horas antes" },
  { value: "1440", label: "1 día antes" },
] as const;

const WELCOME_AUDIO_SRC = "/audio/bienvenida-calendario.mp3";
const RELEASE_AUDIO_SRC = "/audio/soltar-mic.mp3";

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : toDatetimeLocalValue(d).slice(0, 10);
}

function toDateTimeInputValue(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : toDatetimeLocalValue(d);
}

async function playLocalAudio(src: string) {
  const audio = new Audio(src);
  audio.preload = "auto";
  await audio.play();
}

function speakWelcomeFallback() {
  if (!("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance("Bienvenido, ¿qué haremos hoy?");
  utterance.lang = "es-VE";
  utterance.rate = 1;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function playFallbackBeep() {
  const AudioContextCtor =
    window.AudioContext ||
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return;

  const context = new AudioContextCtor();
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 700;
  gain.gain.value = 0.0001;
  oscillator.connect(gain);
  gain.connect(context.destination);

  const now = context.currentTime;
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
  oscillator.start(now);
  oscillator.stop(now + 0.14);
  oscillator.onended = () => void context.close().catch(() => undefined);
}

export function StudentCalendarVoiceFlow() {
  const router = useRouter();

  const [step, setStep] = useState<"listen" | "review" | "confirm">("listen");
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [aiText, setAiText] = useState("");
  const [aiPreview, setAiPreview] = useState<ProposedEvent[] | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const welcomePlayedRef = useRef(false);
  const holdShouldStopRef = useRef(false);
  const feedbackPlayedRef = useRef(false);

  useEffect(() => {
    if (welcomePlayedRef.current) return;
    welcomePlayedRef.current = true;
    void playLocalAudio(WELCOME_AUDIO_SRC).catch(() => speakWelcomeFallback());
  }, []);

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      audioContextRef.current?.close().catch(() => undefined);
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const resetAudioDetection = () => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setMicLevel(0);
  };

  const cancelRecording = () => {
    const recorder = mediaRecorderRef.current;
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    setRecording(false);
    resetAudioDetection();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (recorder && recorder.state !== "inactive") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setRecording(false);
      resetAudioDetection();
      return;
    }

    recorder.onstop = async () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setRecording(false);
      mediaRecorderRef.current = null;
      resetAudioDetection();

      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      chunksRef.current = [];
      if (blob.size < 512) {
        toast.error("Grabación demasiado corta");
        return;
      }

      setTranscribing(true);
      try {
        const formData = new FormData();
        formData.append("audio", blob, "nota.webm");
        const res = await fetch("/api/academico/cronograma/ai/transcribe", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        if (res.status === 402) {
          toast.error(data?.error || "Límite de prueba");
          return;
        }
        if (!res.ok) throw new Error(data?.error || "Transcripción fallida");

        const text = String(data.text || "").trim();
        if (!text) {
          toast.error("No se entendió el audio");
          return;
        }

        setAiText(text);
        setAiPreview(null);
        setStep("review");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Error de transcripción");
      } finally {
        setTranscribing(false);
      }
    };

    recorder.stop();
  };

  const startRecording = async () => {
    if (recording || transcribing || aiBusy) return;

    holdShouldStopRef.current = false;
    feedbackPlayedRef.current = false;
    setStep("listen");
    setAiText("");
    setAiPreview(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const recorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);

      mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      };

      const AudioContextCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextCtor) {
        const audioContext = new AudioContextCtor();
        const source = audioContext.createMediaStreamSource(stream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);
        audioContextRef.current = audioContext;
        analyserRef.current = analyser;

        const data = new Uint8Array(analyser.frequencyBinCount);
        const sample = () => {
          if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive" || !analyserRef.current) {
            return;
          }

          analyserRef.current.getByteTimeDomainData(data);
          let total = 0;
          for (let i = 0; i < data.length; i += 1) total += Math.abs(data[i] - 128);
          const level = total / data.length / 24;
          setMicLevel(Math.max(0, Math.min(1, level)));

          rafRef.current = window.requestAnimationFrame(sample);
        };

        rafRef.current = window.requestAnimationFrame(sample);
      }

      recorder.start(200);
      setRecording(true);

      if (holdShouldStopRef.current) {
        stopRecording();
      }
    } catch {
      resetAudioDetection();
      toast.error("No se pudo acceder al micrófono");
    }
  };

  const playReleaseFeedback = () => {
    if (feedbackPlayedRef.current) return;
    feedbackPlayedRef.current = true;
    void playLocalAudio(RELEASE_AUDIO_SRC).catch(() => playFallbackBeep());
  };

  const finishHold = () => {
    holdShouldStopRef.current = true;
    playReleaseFeedback();
    if (recording || mediaRecorderRef.current?.state === "recording") {
      stopRecording();
    }
  };

  const updatePreviewEvent = (index: number, patch: Partial<ProposedEvent>) => {
    setAiPreview((current) => {
      if (!current) return current;
      return current.map((event, eventIndex) => (eventIndex === index ? { ...event, ...patch } : event));
    });
  };

  const runAiParse = async () => {
    const text = aiText.trim();
    if (!text) {
      toast.error("Escribe o dicta qué quieres agendar");
      return false;
    }

    setAiBusy(true);
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Caracas";
      const res = await fetch("/api/academico/cronograma/ai/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, timezone: tz }),
      });
      const data = await res.json();
      if (res.status === 402) {
        toast.error(data?.error || "Límite de prueba alcanzado");
        return false;
      }
      if (!res.ok) throw new Error(data?.error || "IA no pudo interpretar el texto");

      const list = Array.isArray(data.events) ? data.events : [];
      if (!list.length) {
        toast.message("No se detectaron eventos. Prueba siendo más específico con fechas.");
        setAiPreview([]);
        setStep("confirm");
        return true;
      }

      setAiPreview(
        list.map((event: ProposedEvent) => ({
          ...event,
          activityType: event.activityType ?? null,
          reminderMinutes: event.reminderMinutes ?? 30,
        })),
      );
      setStep("confirm");
      toast.success(`${list.length} evento(s) listos para guardar`);
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error con IA");
      return false;
    } finally {
      setAiBusy(false);
    }
  };

  const saveAiBatch = async () => {
    if (!aiPreview?.length) return false;

    for (const event of aiPreview) {
      const title = event.title.trim();
      const startAt = new Date(event.startAt);
      const endAt = new Date(event.endAt);
      if (!title) {
        toast.error("Cada evento debe tener título");
        return false;
      }
      if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
        toast.error("Revisa las fechas de la vista previa");
        return false;
      }
      if (endAt.getTime() < startAt.getTime()) {
        toast.error("La fecha final no puede ser menor que la inicial");
        return false;
      }
    }

    setAiBusy(true);
    try {
      for (const event of aiPreview) {
        const res = await fetch("/api/academico/cronograma/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: event.title,
            activityType: event.activityType ?? null,
            startAt: event.startAt,
            endAt: event.endAt,
            allDay: !!event.allDay,
            description: event.description ?? null,
            location: event.location ?? null,
            reminderMinutes: event.reminderMinutes === undefined ? 30 : event.reminderMinutes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error guardando un evento");
      }

      toast.success("Eventos guardados en tu calendario");
      router.push("/academico/calendario");
      router.refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error al guardar");
      return false;
    } finally {
      setAiBusy(false);
    }
  };

  const rerecord = () => {
    if (recording) cancelRecording();
    holdShouldStopRef.current = false;
    setAiText("");
    setAiPreview(null);
    setStep("listen");
  };

  const status = transcribing
    ? "Transcribiendo tu instrucción"
    : aiBusy
      ? step === "review"
        ? "Preparando la vista previa"
        : "Guardando en tu calendario"
      : recording
        ? "Escuchando... suelta el micrófono cuando termines"
        : step === "review"
          ? "Revisa la transcripción antes de continuar"
          : "Mantén pulsado el micrófono para hablar";

  return (
    <div className="-mx-3 -my-4 min-h-[calc(100dvh-4rem)] bg-[radial-gradient(circle_at_top,_rgba(64,201,169,0.18),_transparent_35%),linear-gradient(180deg,#1F3125_0%,#132118_55%,#0B130E_100%)] px-3 py-4 sm:-mx-4 sm:px-4 md:-mx-8 md:-my-6 md:px-8 md:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-7rem)] w-full max-w-5xl flex-col rounded-[2rem] border border-white/10 bg-[#102017]/70 p-4 text-white shadow-[0_30px_120px_rgba(0,0,0,0.35)] backdrop-blur sm:p-6 md:p-8">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            className="text-white/70 hover:bg-white/10 hover:text-white"
            onClick={() => router.push("/academico/calendario")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/55">
            Paso {step === "listen" ? "1 de 3" : step === "review" ? "2 de 3" : "3 de 3"}
          </div>
        </div>

        <div className="mt-6 flex flex-1 flex-col justify-center">
          <div className="mx-auto w-full max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-[0.2em] text-[var(--accent-hex)]">
              <Sparkles className="h-3.5 w-3.5" />
              Calendario con voz
            </div>
            <h1 className="mt-4 text-3xl font-special text-white sm:text-4xl">Bienvenido, ¿qué haremos hoy?</h1>
            <p className="mt-3 text-sm text-white/60 sm:text-base">{status}</p>
          </div>

          <div className={cn("mt-10 flex flex-col items-center justify-center gap-8 transition-all duration-300", step !== "listen" && "md:mt-6") }>
            <button
              type="button"
              onPointerDown={() => void startRecording()}
              onPointerUp={finishHold}
              onPointerCancel={finishHold}
              onPointerLeave={(event) => {
                if (event.buttons === 1) finishHold();
              }}
              onKeyDown={(event) => {
                if ((event.key === " " || event.key === "Enter") && !event.repeat) {
                  event.preventDefault();
                  void startRecording();
                }
              }}
              onKeyUp={(event) => {
                if (event.key === " " || event.key === "Enter") {
                  event.preventDefault();
                  finishHold();
                }
              }}
              disabled={transcribing || aiBusy}
              aria-label="Mantén pulsado para grabar"
              className={cn(
                "relative flex items-center justify-center rounded-full border border-white/10 bg-[#0D1912] transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60",
                step === "listen" ? "h-72 w-72 sm:h-80 sm:w-80" : "h-24 w-24 sm:h-28 sm:w-28",
              )}
            >
              <span
                className="absolute inset-0 rounded-full bg-[var(--accent-hex)]/20 blur-2xl transition-all duration-150"
                style={{ transform: `scale(${1 + micLevel * 0.35})`, opacity: recording ? 0.95 : 0.45 }}
              />
              <span
                className="absolute rounded-full border border-[var(--accent-hex)]/30 transition-all duration-150"
                style={{
                  inset: step === "listen" ? "1.25rem" : "0.75rem",
                  transform: `scale(${1 + micLevel * 0.16})`,
                }}
              />
              <span className={cn(
                "relative flex items-center justify-center rounded-full bg-[var(--accent-hex)] text-[#102017] shadow-[0_0_60px_rgba(64,201,169,0.32)] transition-all",
                step === "listen" ? "h-40 w-40 sm:h-44 sm:w-44" : "h-14 w-14 sm:h-16 sm:w-16",
              )}>
                {transcribing || aiBusy ? <Loader2 className="h-8 w-8 animate-spin" /> : <Mic className={cn(step === "listen" ? "h-16 w-16" : "h-6 w-6")} />}
              </span>
            </button>

            {step === "review" ? (
              <div className="w-full max-w-3xl rounded-[1.5rem] border border-white/10 bg-[#122017]/90 p-5 text-left sm:p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                  <Wand2 className="h-4 w-4 text-[var(--accent-hex)]" />
                  Transcripción detectada
                </div>
                <Textarea
                  value={aiText}
                  onChange={(event) => setAiText(event.target.value)}
                  placeholder='Ej: "Agéndame la exposición final el viernes a las 10"'
                  className="min-h-[180px] border-white/10 bg-[#0F1A13] text-white placeholder:text-white/35"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    disabled={transcribing || aiBusy}
                    onClick={rerecord}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Volver a grabar
                  </Button>
                  <Button
                    type="button"
                    className="bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
                    disabled={transcribing || aiBusy || !aiText.trim()}
                    onClick={() => void runAiParse()}
                  >
                    {aiBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                    Siguiente
                  </Button>
                </div>
              </div>
            ) : null}

            {step === "confirm" ? (
              <div className="w-full max-w-4xl rounded-[1.5rem] border border-white/10 bg-[#122017]/95 p-5 text-left sm:p-6">
                <div className="mb-4 flex items-center gap-2 text-sm font-medium text-white/80">
                  <CalendarDays className="h-4 w-4 text-[var(--accent-hex)]" />
                  Vista previa final
                </div>

                {aiPreview && aiPreview.length > 0 ? (
                  <div className="space-y-4">
                    {aiPreview.map((event, index) => (
                      <div key={`${event.title}-${index}`} className="rounded-2xl border border-white/8 bg-[#0F1A13] p-4">
                        <div className="mb-3 text-xs uppercase tracking-[0.18em] text-white/40">Evento {index + 1}</div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="sm:col-span-2">
                            <Label className="text-xs text-white/65">Título</Label>
                            <Input
                              value={event.title}
                              onChange={(e) => updatePreviewEvent(index, { title: e.target.value })}
                              className="mt-1 border-white/10 bg-[#132118] text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-white/65">Inicio</Label>
                            <Input
                              type={event.allDay ? "date" : "datetime-local"}
                              value={event.allDay ? toDateInputValue(event.startAt) : toDateTimeInputValue(event.startAt)}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (event.allDay) {
                                  updatePreviewEvent(index, {
                                    startAt: new Date(`${value}T00:00`).toISOString(),
                                    endAt: new Date(`${value}T23:59`).toISOString(),
                                  });
                                  return;
                                }
                                updatePreviewEvent(index, { startAt: new Date(value).toISOString() });
                              }}
                              className="mt-1 border-white/10 bg-[#132118] text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-white/65">Fin</Label>
                            <Input
                              type={event.allDay ? "date" : "datetime-local"}
                              value={event.allDay ? toDateInputValue(event.endAt) : toDateTimeInputValue(event.endAt)}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (event.allDay) {
                                  updatePreviewEvent(index, { endAt: new Date(`${value}T23:59`).toISOString() });
                                  return;
                                }
                                updatePreviewEvent(index, { endAt: new Date(value).toISOString() });
                              }}
                              className="mt-1 border-white/10 bg-[#132118] text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-white/65">Ubicación</Label>
                            <Input
                              value={event.location ?? ""}
                              onChange={(e) => updatePreviewEvent(index, { location: e.target.value || null })}
                              className="mt-1 border-white/10 bg-[#132118] text-white"
                            />
                          </div>
                          <div>
                            <Label className="text-xs text-white/65">Recordatorio</Label>
                            <select
                              value={event.reminderMinutes == null ? "" : String(event.reminderMinutes)}
                              onChange={(e) =>
                                updatePreviewEvent(index, {
                                  reminderMinutes: e.target.value === "" ? null : Number(e.target.value),
                                })
                              }
                              className="mt-1 flex h-10 w-full rounded-md border border-white/10 bg-[#132118] px-3 py-2 text-sm text-white outline-none"
                            >
                              {REMINDER_OPTIONS.map((option) => (
                                <option key={option.value} value={option.value} className="bg-[#132118] text-white">
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2">
                            <Label className="text-xs text-white/65">Nota</Label>
                            <Textarea
                              value={event.description ?? ""}
                              onChange={(e) => updatePreviewEvent(index, { description: e.target.value || null })}
                              className="mt-1 min-h-[100px] border-white/10 bg-[#132118] text-white"
                            />
                          </div>
                        </div>
                        <div className="mt-3 text-xs text-white/45">
                          {format(new Date(event.startAt), "PPp", { locale: es })} {"->"} {format(new Date(event.endAt), "PPp", { locale: es })}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-white/10 bg-[#0F1A13] px-4 py-8 text-center text-sm text-white/45">
                    No se detectaron eventos todavía. Puedes volver y ajustar la transcripción.
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={() => setStep("review")}
                  >
                    Volver
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/15 bg-transparent text-white hover:bg-white/10"
                    onClick={rerecord}
                  >
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Volver a grabar
                  </Button>
                  <Button
                    type="button"
                    className="bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
                    disabled={!aiPreview?.length || aiBusy}
                    onClick={() => void saveAiBatch()}
                  >
                    {aiBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Guardar final
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
