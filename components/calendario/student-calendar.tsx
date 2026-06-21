"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Loader2, Mic, MicOff, Sparkles, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type CalEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  reminderMinutes: number | null;
  reminderSentAt?: string | null;
  color: string | null;
};

type ProposedEvent = {
  title: string;
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

function getDirectOpenAiModelLabel() {
  return "ChatGPT API";
}

export function StudentCalendar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [viewDate, setViewDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newAllDay, setNewAllDay] = useState(false);
  const [newReminderMinutes, setNewReminderMinutes] = useState<string>("30");
  const [saving, setSaving] = useState(false);

  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPreview, setAiPreview] = useState<ProposedEvent[] | null>(null);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [micLevel, setMicLevel] = useState(0);

  const [detailEvent, setDetailEvent] = useState<CalEvent | null>(null);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [detailLocation, setDetailLocation] = useState("");
  const [detailStart, setDetailStart] = useState("");
  const [detailEnd, setDetailEnd] = useState("");
  const [detailAllDay, setDetailAllDay] = useState(false);
  const [detailReminderMinutes, setDetailReminderMinutes] = useState<string>("30");
  const [detailSaving, setDetailSaving] = useState(false);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const heardSpeechRef = useRef(false);
  const silenceStartedAtRef = useRef<number | null>(null);
  const autoCaptureStartedRef = useRef(false);
  const startRecordingRef = useRef<(() => Promise<void>) | null>(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const start = gridStart.toISOString();
      const end = gridEnd.toISOString();
      const res = await fetch(
        `/api/academico/cronograma/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error cargando eventos");
      setEvents(Array.isArray(data.events) ? data.events : []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error cargando calendario");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [gridEnd, gridStart]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    if (searchParams.get("capture") === "voice") {
      setVoiceAssistantOpen(true);
    } else {
      autoCaptureStartedRef.current = false;
    }
  }, [searchParams]);

  useEffect(() => {
    if (
      searchParams.get("capture") !== "voice" ||
      autoCaptureStartedRef.current ||
      !voiceAssistantOpen ||
      recording ||
      transcribing ||
      aiBusy
    ) {
      return;
    }

    autoCaptureStartedRef.current = true;
    void startRecordingRef.current?.();
  }, [aiBusy, recording, searchParams, transcribing, voiceAssistantOpen]);

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
      audioContextRef.current?.close().catch(() => undefined);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  useEffect(() => {
    setDetailTitle(detailEvent?.title ?? "");
    setDetailDescription(detailEvent?.description ?? "");
    setDetailLocation(detailEvent?.location ?? "");
    setDetailStart(
      detailEvent
        ? detailEvent.allDay
          ? toDateInputValue(detailEvent.startAt)
          : toDateTimeInputValue(detailEvent.startAt)
        : "",
    );
    setDetailEnd(
      detailEvent
        ? detailEvent.allDay
          ? toDateInputValue(detailEvent.endAt)
          : toDateTimeInputValue(detailEvent.endAt)
        : "",
    );
    setDetailAllDay(detailEvent?.allDay ?? false);
    setDetailReminderMinutes(detailEvent?.reminderMinutes == null ? "" : String(detailEvent.reminderMinutes));
  }, [detailEvent]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const ev of events) {
      const key = format(new Date(ev.startAt), "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(ev);
      map.set(key, list);
    }
    return map;
  }, [events]);

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return (eventsByDay.get(key) ?? []).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [eventsByDay, selectedDay]);

  const openNewDialog = (d?: Date) => {
    const base = d ?? new Date();
    const end = new Date(base.getTime() + 60 * 60 * 1000);
    setNewTitle("");
    setNewStart(toDatetimeLocalValue(base));
    setNewEnd(toDatetimeLocalValue(end));
    setNewAllDay(false);
    setNewReminderMinutes("30");
    setCreateOpen(true);
  };

  const applyAllDayBounds = (checked: boolean) => {
    setNewAllDay(checked);
    if (checked) {
      const base = newStart ? new Date(newStart) : new Date();
      if (Number.isNaN(base.getTime())) return;
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
      const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 0, 0);
      setNewStart(toDatetimeLocalValue(start));
      setNewEnd(toDatetimeLocalValue(end));
    }
  };

  const applyDetailAllDayBounds = (checked: boolean) => {
    setDetailAllDay(checked);
    if (checked) {
      const base = detailStart ? new Date(detailStart) : detailEvent ? new Date(detailEvent.startAt) : new Date();
      if (Number.isNaN(base.getTime())) return;
      const start = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 0, 0, 0, 0);
      const end = new Date(base.getFullYear(), base.getMonth(), base.getDate(), 23, 59, 0, 0);
      setDetailStart(toDatetimeLocalValue(start).slice(0, 10));
      setDetailEnd(toDatetimeLocalValue(end).slice(0, 10));
      return;
    }

    if (detailEvent) {
      setDetailStart(toDateTimeInputValue(detailEvent.startAt));
      setDetailEnd(toDateTimeInputValue(detailEvent.endAt));
    }
  };

  const resetAudioDetection = () => {
    if (rafRef.current) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    silenceStartedAtRef.current = null;
    heardSpeechRef.current = false;
    analyserRef.current = null;
    audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setMicLevel(0);
  };

  const cancelRecording = () => {
    const mr = mediaRecorderRef.current;
    chunksRef.current = [];
    mediaRecorderRef.current = null;
    setRecording(false);
    resetAudioDetection();
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (mr && mr.state !== "inactive") {
      mr.ondataavailable = null;
      mr.onstop = null;
      mr.stop();
    }
  };

  const saveNewEvent = async () => {
    const title = newTitle.trim();
    if (!title) {
      toast.error("El título es obligatorio");
      return;
    }
    let startAt = new Date(newStart);
    let endAt = new Date(newEnd);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      toast.error("Fechas inválidas");
      return;
    }
    if (newAllDay) {
      startAt = new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate(), 0, 0, 0, 0);
      endAt = new Date(endAt.getFullYear(), endAt.getMonth(), endAt.getDate(), 23, 59, 59, 999);
    }
    setSaving(true);
    try {
      const res = await fetch("/api/academico/cronograma/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          allDay: newAllDay,
          reminderMinutes: newReminderMinutes === "" ? null : Number(newReminderMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo crear");
      toast.success("Evento creado");
      setCreateOpen(false);
      await loadEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const runAiParse = async (rawText?: string) => {
    const text = (rawText ?? aiText).trim();
    if (!text) {
      toast.error("Escribe o dicta qué quieres agendar");
      return;
    }
    if (rawText !== undefined) setAiText(text);
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
        return;
      }
      if (!res.ok) throw new Error(data?.error || "IA no pudo interpretar el texto");
      const list = Array.isArray(data.events) ? data.events : [];
      if (!list.length) {
        toast.message("No se detectaron eventos. Prueba siendo más específico con fechas.");
        setAiPreview([]);
        return;
      }
      setAiPreview(list.map((event: ProposedEvent) => ({ ...event, reminderMinutes: event.reminderMinutes ?? 30 })));
      toast.success(`${list.length} evento(s) listos para guardar`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error con IA");
    } finally {
      setAiBusy(false);
    }
  };

  const saveAiBatch = async () => {
    if (!aiPreview?.length) return false;

    for (const ev of aiPreview) {
      const title = ev.title.trim();
      const startAt = new Date(ev.startAt);
      const endAt = new Date(ev.endAt);
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
      for (const ev of aiPreview) {
        const res = await fetch("/api/academico/cronograma/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: ev.title,
            startAt: ev.startAt,
            endAt: ev.endAt,
            allDay: !!ev.allDay,
            description: ev.description ?? null,
            location: ev.location ?? null,
            reminderMinutes: ev.reminderMinutes === undefined ? 30 : ev.reminderMinutes,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error guardando un evento");
      }
      toast.success("Eventos guardados en tu calendario");
      setAiPreview(null);
      setAiText("");
      await loadEvents();
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
      return false;
    } finally {
      setAiBusy(false);
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm("¿Eliminar este evento?")) return;
    try {
      const res = await fetch(`/api/academico/cronograma/events/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo eliminar");
      toast.success("Evento eliminado");
      setDetailEvent(null);
      await loadEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    }
  };

  const saveDetailEvent = async () => {
    if (!detailEvent) return;

    const title = detailTitle.trim();
    if (!title) {
      toast.error("El título es obligatorio");
      return;
    }

    let startAt = new Date(detailAllDay ? `${detailStart}T00:00` : detailStart);
    let endAt = new Date(detailAllDay ? `${detailEnd || detailStart}T23:59` : detailEnd);
    if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
      toast.error("Fechas inválidas");
      return;
    }
    if (detailAllDay) {
      startAt = new Date(startAt.getFullYear(), startAt.getMonth(), startAt.getDate(), 0, 0, 0, 0);
      endAt = new Date(endAt.getFullYear(), endAt.getMonth(), endAt.getDate(), 23, 59, 59, 999);
    }
    if (endAt.getTime() < startAt.getTime()) {
      toast.error("La fecha fin no puede ser menor a la de inicio");
      return;
    }

    setDetailSaving(true);
    try {
      const res = await fetch(`/api/academico/cronograma/events/${detailEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description: detailDescription.trim() || null,
          location: detailLocation.trim() || null,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          allDay: detailAllDay,
          reminderMinutes: detailReminderMinutes === "" ? null : Number(detailReminderMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "No se pudo actualizar el evento");
      setDetailEvent(null);
      await loadEvents();
      toast.success("Evento actualizado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error actualizando evento");
    } finally {
      setDetailSaving(false);
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      setRecording(false);
      resetAudioDetection();
      return;
    }

    mr.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setRecording(false);
      mediaRecorderRef.current = null;
      resetAudioDetection();

      const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
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
        await runAiParse(text);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error de transcripción");
      } finally {
        setTranscribing(false);
      }
    };

    mr.stop();
  };

  const startRecording = async () => {
    if (recording || transcribing || aiBusy) return;
    setVoiceAssistantOpen(true);
    setAiPreview(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      silenceStartedAtRef.current = null;
      heardSpeechRef.current = false;

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
          for (let i = 0; i < data.length; i += 1) {
            total += Math.abs(data[i] - 128);
          }

          const level = total / data.length / 24;
          setMicLevel(Math.max(0, Math.min(1, level)));

          const now = performance.now();
          if (level > 0.09) {
            heardSpeechRef.current = true;
            silenceStartedAtRef.current = null;
          } else if (heardSpeechRef.current) {
            if (!silenceStartedAtRef.current) {
              silenceStartedAtRef.current = now;
            } else if (now - silenceStartedAtRef.current > 1700) {
              stopRecording();
              return;
            }
          }

          rafRef.current = window.requestAnimationFrame(sample);
        };

        rafRef.current = window.requestAnimationFrame(sample);
      }

      recorder.start(200);
      setRecording(true);
    } catch {
      resetAudioDetection();
      toast.error("No se pudo acceder al micrófono");
    }
  };

  startRecordingRef.current = startRecording;

  const updatePreviewEvent = (index: number, patch: Partial<ProposedEvent>) => {
    setAiPreview((current) => {
      if (!current) return current;
      return current.map((event, eventIndex) => (eventIndex === index ? { ...event, ...patch } : event));
    });
  };

  const removePreviewEvent = (index: number) => {
    setAiPreview((current) => {
      if (!current) return current;
      const next = current.filter((_, eventIndex) => eventIndex !== index);
      return next;
    });
  };

  const movePreviewEvent = (index: number, direction: -1 | 1) => {
    setAiPreview((current) => {
      if (!current) return current;
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      const [item] = next.splice(index, 1);
      next.splice(targetIndex, 0, item);
      return next;
    });
  };

  const closeVoiceAssistant = () => {
    if (recording) {
      cancelRecording();
    }
    setVoiceAssistantOpen(false);
    if (searchParams.get("capture") === "voice") {
      router.replace(pathname, { scroll: false });
    }
  };

  const voiceStatus = transcribing
    ? "Transcribiendo tu instrucción"
    : aiBusy
      ? "Convirtiendo tu voz en eventos"
      : recording
        ? "Escuchando. Cuando detecte silencio termina sola"
        : aiPreview?.length
          ? `${aiPreview.length} evento(s) listos para guardar`
          : "Pulsa el círculo y habla como si fuera Siri";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-special text-white">Mi calendario</h1>
          <p className="mt-1 text-sm text-white/60">Vista limpia del calendario y creación por voz con {getDirectOpenAiModelLabel()}.</p>
        </div>
        <Button
          type="button"
          className="rounded-full bg-[var(--accent-hex)] px-5 text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
          onClick={() => {
            setVoiceAssistantOpen(true);
            void startRecording();
          }}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Crear con voz
        </Button>
      </div>

      <Card className="border-white/10 bg-[#354B3A]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="flex items-center gap-2 font-special text-white">
            <CalendarDays className="h-5 w-5 text-[var(--accent-hex)]" />
            {format(viewDate, "MMMM yyyy", { locale: es })}
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="border-white/20 bg-[#1C2D20] text-white hover:bg-white/10"
              onClick={() => setViewDate((d) => subMonths(d, 1))}
              aria-label="Mes anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-[#1C2D20] text-white hover:bg-white/10"
              onClick={() => setViewDate(new Date())}
            >
              Hoy
            </Button>
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="border-white/20 bg-[#1C2D20] text-white hover:bg-white/10"
              onClick={() => setViewDate((d) => addMonths(d, 1))}
              aria-label="Mes siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              className="bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
              onClick={() => openNewDialog(selectedDay ?? undefined)}
            >
              Nuevo evento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-16 text-white/60">
              <Loader2 className="h-8 w-8 animate-spin text-[var(--accent-hex)]" />
            </div>
          ) : (
            <>
              <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-medium text-white/55">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
                  <div key={day}>{day}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const list = eventsByDay.get(key) ?? [];
                  const selected = selectedDay && isSameDay(day, selectedDay);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "flex min-h-[4.5rem] flex-col rounded-lg border p-1.5 text-left transition-colors",
                        isSameMonth(day, viewDate)
                          ? "border-white/10 bg-[#1C2D20]/80 text-white"
                          : "border-white/5 bg-[#203324]/40 text-white/40",
                        selected && "ring-2 ring-[var(--accent-hex)]/60",
                      )}
                    >
                      <span className="text-xs font-semibold">{format(day, "d")}</span>
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {list.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className={cn(
                              "block h-1.5 max-w-full flex-1 rounded-full",
                              ev.reminderMinutes !== null ? "bg-sky-400/90" : "bg-[var(--accent-hex)]/80",
                            )}
                            title={ev.title}
                          />
                        ))}
                        {list.length > 3 ? <span className="text-[10px] text-white/50">+{list.length - 3}</span> : null}
                      </div>
                      {list.some((ev) => ev.reminderMinutes !== null) ? (
                        <span className="mt-1 inline-flex w-fit rounded-full border border-sky-400/20 bg-sky-400/10 px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-[0.18em] text-sky-200">
                          Mail
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selectedDay ? (
        <Card className="border-white/10 bg-[#354B3A]">
          <CardHeader>
            <CardTitle className="text-white">{`Eventos — ${format(selectedDay, "d MMMM yyyy", { locale: es })}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dayEvents.length === 0 ? (
              <p className="text-sm text-white/60">Sin eventos este día.</p>
            ) : (
              <ul className="space-y-2">
                {dayEvents.map((ev) => (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onClick={() => setDetailEvent(ev)}
                      className="w-full rounded-lg border border-white/10 bg-[#1C2D20] px-3 py-2 text-left text-sm text-white/90 hover:bg-white/5"
                    >
                      <div className="font-medium text-white">{ev.title}</div>
                      <div className="text-xs text-white/55">
                        {ev.allDay
                          ? "Todo el día"
                          : `${format(new Date(ev.startAt), "HH:mm")} – ${format(new Date(ev.endAt), "HH:mm")}`}
                      </div>
                      {ev.reminderMinutes !== null ? (
                        <div className="mt-1 inline-flex items-center rounded-full border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[11px] text-sky-200">
                          Recordatorio: {REMINDER_OPTIONS.find((option) => option.value === String(ev.reminderMinutes))?.label ?? `${ev.reminderMinutes} min antes`}
                        </div>
                      ) : null}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}

      <Dialog open={voiceAssistantOpen} onOpenChange={(open) => (!open ? closeVoiceAssistant() : setVoiceAssistantOpen(true))}>
        <DialogContent className="border-white/10 bg-[#203324] p-0 text-white sm:max-w-2xl">
          <div className="overflow-hidden rounded-[inherit] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(64,201,169,0.18),_transparent_45%),linear-gradient(180deg,#24372A_0%,#18261C_100%)]">
            <DialogHeader className="px-6 pb-2 pt-6 text-left">
              <DialogTitle className="flex items-center gap-2 font-special text-2xl">
                <Sparkles className="h-5 w-5 text-[var(--accent-hex)]" />
                Calendario con voz
              </DialogTitle>
              <p className="text-sm text-white/65">Usa tu API de ChatGPT para escuchar, transcribir y convertir instrucciones en eventos.</p>
            </DialogHeader>

            <div className="space-y-5 px-6 pb-6">
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-white/70">
                Motor activo: <span className="font-medium text-white">{getDirectOpenAiModelLabel()}</span>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 py-4 text-center">
                <button
                  type="button"
                  onClick={() => void (recording ? stopRecording() : startRecording())}
                  disabled={transcribing || aiBusy}
                  className="relative flex h-40 w-40 items-center justify-center rounded-full border border-white/10 bg-[#102017] transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={recording ? "Detener grabación" : "Iniciar grabación"}
                >
                  <span
                    className="absolute inset-0 rounded-full bg-[var(--accent-hex)]/20 blur-xl transition-all duration-150"
                    style={{ transform: `scale(${1 + micLevel * 0.35})`, opacity: recording ? 0.9 : 0.35 }}
                  />
                  <span
                    className="absolute inset-3 rounded-full border border-[var(--accent-hex)]/25"
                    style={{ transform: `scale(${1 + micLevel * 0.18})` }}
                  />
                  <span className="relative flex h-24 w-24 items-center justify-center rounded-full bg-[var(--accent-hex)] text-[#102017] shadow-[0_0_45px_rgba(64,201,169,0.35)]">
                    {transcribing || aiBusy ? (
                      <Loader2 className="h-9 w-9 animate-spin" />
                    ) : recording ? (
                      <MicOff className="h-9 w-9" />
                    ) : (
                      <Mic className="h-9 w-9" />
                    )}
                  </span>
                </button>

                <div className="space-y-2">
                  <p className="text-lg font-medium text-white">{voiceStatus}</p>
                  <p className="text-sm text-white/55">
                    Ejemplo: &quot;Agéndame la exposición final el viernes a las 10 de la mañana en el aula 2&quot;.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-2xl border border-white/10 bg-[#122017]/90 p-4">
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-white/80">
                    <Wand2 className="h-4 w-4 text-[var(--accent-hex)]" />
                    Instrucción detectada
                  </div>
                  <Textarea
                    value={aiText}
                    onChange={(e) => setAiText(e.target.value)}
                    placeholder='Ej: "Pon reunión con Mariana mañana a las 4pm"'
                    className="min-h-[180px] border-white/10 bg-[#0F1A13] text-white placeholder:text-white/35"
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      className="bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
                      disabled={aiBusy || transcribing || !aiText.trim()}
                      onClick={() => void runAiParse()}
                    >
                      {aiBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                      Interpretar con IA
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="border-white/15 bg-transparent text-white hover:bg-white/10"
                      disabled={recording || transcribing || aiBusy}
                      onClick={() => void startRecording()}
                    >
                      <Mic className="mr-2 h-4 w-4" />
                      Volver a grabar
                    </Button>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-[#122017]/90 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                    <CalendarDays className="h-4 w-4 text-[var(--accent-hex)]" />
                    Vista previa
                  </div>
                  {aiPreview && aiPreview.length > 0 ? (
                    <ul className="space-y-3 text-sm text-white/85">
                      {aiPreview.map((ev, i) => (
                        <li key={`${ev.title}-${i}`} className="rounded-xl border border-white/8 bg-[#0F1A13] p-3">
                          <div className="mb-3 flex items-start justify-between gap-2">
                            <div>
                              <div className="text-xs font-medium uppercase tracking-[0.18em] text-white/40">Evento {i + 1}</div>
                              <div className="mt-1 text-xs text-white/60">
                                {format(new Date(ev.startAt), "PPp", { locale: es })} → {format(new Date(ev.endAt), "PPp", { locale: es })}
                                {ev.allDay ? " · día completo" : ""}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/45 hover:bg-white/10 hover:text-white"
                              onClick={() => movePreviewEvent(i, -1)}
                              disabled={i === 0}
                              aria-label={`Subir evento ${i + 1}`}
                            >
                              <ChevronUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/45 hover:bg-white/10 hover:text-white"
                              onClick={() => movePreviewEvent(i, 1)}
                              disabled={i === aiPreview.length - 1}
                              aria-label={`Bajar evento ${i + 1}`}
                            >
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-white/45 hover:bg-white/10 hover:text-red-300"
                              onClick={() => removePreviewEvent(i)}
                              aria-label={`Eliminar evento ${i + 1}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <Label className="text-xs text-white/65">Título</Label>
                              <Input
                                value={ev.title}
                                onChange={(e) => updatePreviewEvent(i, { title: e.target.value })}
                                className="mt-1 border-white/10 bg-[#132118] text-white"
                              />
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                id={`preview-all-day-${i}`}
                                type="checkbox"
                                checked={!!ev.allDay}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  if (checked) {
                                    const day = toDateInputValue(ev.startAt);
                                    updatePreviewEvent(i, {
                                      allDay: true,
                                      startAt: new Date(`${day}T00:00`).toISOString(),
                                      endAt: new Date(`${day}T23:59`).toISOString(),
                                    });
                                    return;
                                  }
                                  const start = toDateTimeInputValue(ev.startAt);
                                  const end = toDateTimeInputValue(ev.endAt);
                                  updatePreviewEvent(i, {
                                    allDay: false,
                                    startAt: new Date(start).toISOString(),
                                    endAt: new Date(end).toISOString(),
                                  });
                                }}
                                className="rounded border-white/30"
                              />
                              <Label htmlFor={`preview-all-day-${i}`} className="text-xs text-white/70">
                                Todo el día
                              </Label>
                            </div>

                            <div className={cn("grid gap-3", ev.allDay ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2")}>
                              <div>
                                <Label className="text-xs text-white/65">Inicio</Label>
                                <Input
                                  type={ev.allDay ? "date" : "datetime-local"}
                                  value={ev.allDay ? toDateInputValue(ev.startAt) : toDateTimeInputValue(ev.startAt)}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    if (ev.allDay) {
                                      updatePreviewEvent(i, {
                                        startAt: new Date(`${value}T00:00`).toISOString(),
                                        endAt: new Date(`${value}T23:59`).toISOString(),
                                      });
                                      return;
                                    }
                                    updatePreviewEvent(i, { startAt: new Date(value).toISOString() });
                                  }}
                                  className="mt-1 border-white/10 bg-[#132118] text-white"
                                />
                              </div>

                              {!ev.allDay ? (
                                <div>
                                  <Label className="text-xs text-white/65">Fin</Label>
                                  <Input
                                    type="datetime-local"
                                    value={toDateTimeInputValue(ev.endAt)}
                                    onChange={(e) => updatePreviewEvent(i, { endAt: new Date(e.target.value).toISOString() })}
                                    className="mt-1 border-white/10 bg-[#132118] text-white"
                                  />
                                </div>
                              ) : null}
                            </div>

                            <div>
                              <Label className="text-xs text-white/65">Ubicación</Label>
                              <Input
                                value={ev.location ?? ""}
                                onChange={(e) => updatePreviewEvent(i, { location: e.target.value || null })}
                                className="mt-1 border-white/10 bg-[#132118] text-white"
                              />
                            </div>

                            <div>
                              <Label className="text-xs text-white/65">Recordatorio por correo</Label>
                              <select
                                value={ev.reminderMinutes == null ? "" : String(ev.reminderMinutes)}
                                onChange={(e) =>
                                  updatePreviewEvent(i, {
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

                            <div>
                              <Label className="text-xs text-white/65">Nota</Label>
                              <Textarea
                                value={ev.description ?? ""}
                                onChange={(e) => updatePreviewEvent(i, { description: e.target.value || null })}
                                className="mt-1 min-h-[90px] border-white/10 bg-[#132118] text-white"
                              />
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="rounded-xl border border-dashed border-white/10 bg-[#0F1A13] px-4 py-8 text-center text-sm text-white/45">
                      Cuando termines de hablar aparecerán aquí los eventos que se van a guardar.
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="flex-col gap-2 border-t border-white/10 px-0 pt-1 sm:flex-row sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-white/70 hover:bg-white/10 hover:text-white"
                  onClick={() => {
                    setAiPreview(null);
                    setAiText("");
                  }}
                >
                  Limpiar
                </Button>
                <div className="flex flex-wrap justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/20 bg-transparent text-white hover:bg-white/10"
                    onClick={closeVoiceAssistant}
                  >
                    Cerrar
                  </Button>
                  <Button
                    type="button"
                    className="bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
                    disabled={!aiPreview?.length || aiBusy}
                    onClick={async () => {
                      const saved = await saveAiBatch();
                      if (saved) closeVoiceAssistant();
                    }}
                  >
                    Guardar en calendario
                  </Button>
                </div>
              </DialogFooter>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-white/10 bg-[#203324] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-special">Nuevo evento</DialogTitle>
          </DialogHeader>
            <div className="space-y-3 py-2">
            <div>
              <Label className="text-white/80">Título</Label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="border-white/20 bg-[#1C2D20] text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                id="allDay"
                type="checkbox"
                checked={newAllDay}
                onChange={(e) => applyAllDayBounds(e.target.checked)}
                className="rounded border-white/30"
              />
              <Label htmlFor="allDay" className="text-white/80">
                Todo el día
              </Label>
            </div>
            <div>
              <Label className="text-white/80">Recordatorio por correo</Label>
              <select
                value={newReminderMinutes}
                onChange={(e) => setNewReminderMinutes(e.target.value)}
                className="mt-1 flex h-10 w-full rounded-md border border-white/20 bg-[#1C2D20] px-3 py-2 text-sm text-white outline-none"
              >
                {REMINDER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-[#1C2D20] text-white">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-white/80">Inicio</Label>
              <Input
                type={newAllDay ? "date" : "datetime-local"}
                value={newAllDay && newStart ? newStart.slice(0, 10) : newStart}
                onChange={(e) => {
                  const value = e.target.value;
                  if (newAllDay) {
                    setNewStart(`${value}T00:00`);
                    setNewEnd(`${value}T23:59`);
                  } else {
                    setNewStart(value);
                  }
                }}
                className="border-white/20 bg-[#1C2D20] text-white"
              />
            </div>
            {!newAllDay ? (
              <div>
                <Label className="text-white/80">Fin</Label>
                <Input
                  type="datetime-local"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                  className="border-white/20 bg-[#1C2D20] text-white"
                />
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10"
              onClick={() => setCreateOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              className="bg-[var(--accent-hex)] text-[#1C2D20]"
              disabled={saving}
              onClick={() => void saveNewEvent()}
            >
              {saving ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailEvent} onOpenChange={(open) => !open && setDetailEvent(null)}>
        <DialogContent className="border-white/10 bg-[#203324] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="pr-8 font-special">Editar evento</DialogTitle>
          </DialogHeader>
          {detailEvent ? (
            <div className="space-y-3 py-1 text-sm text-white/80">
              <div>
                <Label className="text-white/80">Título</Label>
                <Input
                  value={detailTitle}
                  onChange={(e) => setDetailTitle(e.target.value)}
                  className="mt-1 border-white/20 bg-[#1C2D20] text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  id="detailAllDay"
                  type="checkbox"
                  checked={detailAllDay}
                  onChange={(e) => applyDetailAllDayBounds(e.target.checked)}
                  className="rounded border-white/30"
                />
                <Label htmlFor="detailAllDay" className="text-white/80">
                  Todo el día
                </Label>
              </div>
              <div>
                <Label className="text-white/80">Inicio</Label>
                <Input
                  type={detailAllDay ? "date" : "datetime-local"}
                  value={detailStart}
                  onChange={(e) => {
                    const value = e.target.value;
                    setDetailStart(value);
                    if (detailAllDay) {
                      setDetailEnd(value);
                    }
                  }}
                  className="mt-1 border-white/20 bg-[#1C2D20] text-white"
                />
              </div>
              {!detailAllDay ? (
                <div>
                  <Label className="text-white/80">Fin</Label>
                  <Input
                    type="datetime-local"
                    value={detailEnd}
                    onChange={(e) => setDetailEnd(e.target.value)}
                    className="mt-1 border-white/20 bg-[#1C2D20] text-white"
                  />
                </div>
              ) : null}
              <div>
                <Label className="text-white/80">Ubicación</Label>
                <Input
                  value={detailLocation}
                  onChange={(e) => setDetailLocation(e.target.value)}
                  className="mt-1 border-white/20 bg-[#1C2D20] text-white"
                />
              </div>
              <div>
                <Label className="text-white/80">Nota</Label>
                <Textarea
                  value={detailDescription}
                  onChange={(e) => setDetailDescription(e.target.value)}
                  className="mt-1 min-h-[100px] border-white/20 bg-[#1C2D20] text-white"
                />
              </div>
              <div>
                <Label className="text-white/80">Recordatorio por correo</Label>
                <select
                  value={detailReminderMinutes}
                  onChange={(e) => setDetailReminderMinutes(e.target.value)}
                  className="mt-1 flex h-10 w-full rounded-md border border-white/20 bg-[#1C2D20] px-3 py-2 text-sm text-white outline-none"
                >
                  {REMINDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value} className="bg-[#1C2D20] text-white">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="border-red-500/40 text-red-300 hover:bg-red-500/10"
              onClick={() => detailEvent && void deleteEvent(detailEvent.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar
            </Button>
            <Button
              type="button"
              className="bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
              disabled={detailSaving}
              onClick={() => void saveDetailEvent()}
            >
              {detailSaving ? "Guardando…" : "Guardar cambios"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setDetailEvent(null)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
