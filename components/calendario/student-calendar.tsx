"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Mic, MicOff, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { IaModelPicker } from "@/components/ia-model-picker";

type CalEvent = {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  color: string | null;
};

type ProposedEvent = {
  title: string;
  startAt: string;
  endAt: string;
  allDay?: boolean;
  description?: string | null;
  location?: string | null;
};

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function StudentCalendar() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newAllDay, setNewAllDay] = useState(false);
  const [saving, setSaving] = useState(false);

  const [aiText, setAiText] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiPreview, setAiPreview] = useState<ProposedEvent[] | null>(null);

  const [detailEvent, setDetailEvent] = useState<CalEvent | null>(null);

  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

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
  }, [gridStart, gridEnd]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const eventsByDay = useMemo(() => {
    const m = new Map<string, CalEvent[]>();
    for (const ev of events) {
      const key = format(new Date(ev.startAt), "yyyy-MM-dd");
      const arr = m.get(key) ?? [];
      arr.push(ev);
      m.set(key, arr);
    }
    return m;
  }, [events]);

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return (eventsByDay.get(key) ?? []).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [selectedDay, eventsByDay]);

  const openNewDialog = (d?: Date) => {
    const base = d ?? new Date();
    const end = new Date(base.getTime() + 60 * 60 * 1000);
    setNewTitle("");
    setNewStart(toDatetimeLocalValue(base));
    setNewEnd(toDatetimeLocalValue(end));
    setNewAllDay(false);
    setCreateOpen(true);
  };

  const applyAllDayBounds = (checked: boolean) => {
    setNewAllDay(checked);
    if (checked) {
      const base = newStart ? new Date(newStart) : new Date();
      if (Number.isNaN(base.getTime())) return;
      const y = base.getFullYear();
      const m = base.getMonth();
      const day = base.getDate();
      const start = new Date(y, m, day, 0, 0, 0, 0);
      const end = new Date(y, m, day, 23, 59, 0, 0);
      setNewStart(toDatetimeLocalValue(start));
      setNewEnd(toDatetimeLocalValue(end));
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

  const runAiParse = async () => {
    const text = aiText.trim();
    if (!text) {
      toast.error("Escribe o dicta qué quieres agendar");
      return;
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
        return;
      }
      if (!res.ok) throw new Error(data?.error || "IA no pudo interpretar el texto");
      const list = Array.isArray(data.events) ? data.events : [];
      if (!list.length) {
        toast.message("No se detectaron eventos. Prueba siendo más específico con fechas.");
        setAiPreview([]);
        return;
      }
      setAiPreview(list);
      toast.success(`${list.length} evento(s) propuesto(s). Revisa y guarda.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error con IA");
    } finally {
      setAiBusy(false);
    }
  };

  const saveAiBatch = async () => {
    if (!aiPreview?.length) return;
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
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Error guardando un evento");
      }
      toast.success("Eventos guardados en tu calendario");
      setAiPreview(null);
      setAiText("");
      await loadEvents();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error al guardar");
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "";
      const mr = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mr;
      mr.ondataavailable = (ev) => {
        if (ev.data.size > 0) chunksRef.current.push(ev.data);
      };
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      };
      mr.start(200);
      setRecording(true);
    } catch {
      toast.error("No se pudo acceder al micrófono");
    }
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr || mr.state === "inactive") {
      setRecording(false);
      return;
    }
    mr.onstop = async () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setRecording(false);
      mediaRecorderRef.current = null;
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
      chunksRef.current = [];
      if (blob.size < 512) {
        toast.error("Grabación demasiado corta");
        return;
      }
      setTranscribing(true);
      try {
        const fd = new FormData();
        fd.append("audio", blob, "nota.webm");
        const res = await fetch("/api/academico/cronograma/ai/transcribe", { method: "POST", body: fd });
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
        setAiText((prev) => (prev ? `${prev}\n${text}` : text));
        toast.success("Audio transcrito. Puedes ajustar el texto y usar “Interpretar con IA”.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error de transcripción");
      } finally {
        setTranscribing(false);
      }
    };
    mr.stop();
  };

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-[#354B3A]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-special text-white">
            <Sparkles className="h-5 w-5 text-[var(--accent-hex)]" />
            Agendar con IA o voz
          </CardTitle>
          <CardDescription className="text-white/70">
            Describe en texto qué debes hacer y cuándo (incluye días u horas), o graba un audio. La IA propone
            eventos; luego los confirmas. Sin suscripción: solo hay prueba gratuita si no tienes saldo en billetera;
            con saldo o con plan activo se usa consumo o tu suscripción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <IaModelPicker
            role="cronograma"
            label="Modelo IA (interpretar texto a eventos)"
            className="max-w-md"
            disabled={aiBusy || transcribing}
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              className="border-[var(--accent-hex)]/40 bg-[#1C2D20] text-[var(--accent-hex)] hover:bg-white/10"
              disabled={recording || transcribing}
              onClick={() => void (recording ? stopRecording() : startRecording())}
            >
              {transcribing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : recording ? (
                <MicOff className="mr-2 h-4 w-4" />
              ) : (
                <Mic className="mr-2 h-4 w-4" />
              )}
              {transcribing ? "Transcribiendo…" : recording ? "Detener y transcribir" : "Grabar audio"}
            </Button>
          </div>
          <Textarea
            value={aiText}
            onChange={(e) => setAiText(e.target.value)}
            placeholder='Ej: "El martes 10 tengo entrega de cálculo a las 8pm" o "cada lunes y miércoles clases de inglés de 4 a 6"'
            className="min-h-[100px] border-white/15 bg-[#1C2D20] text-white placeholder:text-white/45"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              className="bg-[var(--accent-hex)] text-[#1C2D20] hover:bg-[color-mix(in_oklab,var(--accent-hex)_80%,transparent)]"
              disabled={aiBusy}
              onClick={() => void runAiParse()}
            >
              {aiBusy && !aiPreview ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Interpretar con IA
            </Button>
            {aiPreview && aiPreview.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                className="border-white/20 bg-[#203324] text-white hover:bg-white/10"
                disabled={aiBusy}
                onClick={() => void saveAiBatch()}
              >
                Guardar {aiPreview.length} en calendario
              </Button>
            ) : null}
            {aiPreview ? (
              <Button
                type="button"
                variant="ghost"
                className="text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setAiPreview(null)}
              >
                Descartar vista previa
              </Button>
            ) : null}
          </div>
          {aiPreview && aiPreview.length > 0 ? (
            <ul className="space-y-2 rounded-lg border border-white/10 bg-[#1C2D20] p-3 text-sm text-white/85">
              {aiPreview.map((ev, i) => (
                <li key={`${ev.title}-${i}`} className="border-b border-white/5 pb-2 last:border-0 last:pb-0">
                  <div className="font-medium text-white">{ev.title}</div>
                  <div className="text-xs text-white/60">
                    {format(new Date(ev.startAt), "PPp", { locale: es })} →{" "}
                    {format(new Date(ev.endAt), "PPp", { locale: es })}
                    {ev.allDay ? " · día completo" : ""}
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </CardContent>
      </Card>

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
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const list = eventsByDay.get(key) ?? [];
                  const sel = selectedDay && isSameDay(day, selectedDay);
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
                        sel && "ring-2 ring-[var(--accent-hex)]/60",
                      )}
                    >
                      <span className="text-xs font-semibold">{format(day, "d")}</span>
                      <div className="mt-1 flex flex-wrap gap-0.5">
                        {list.slice(0, 3).map((ev) => (
                          <span
                            key={ev.id}
                            className="block h-1.5 max-w-full flex-1 rounded-full bg-[var(--accent-hex)]/80"
                            title={ev.title}
                          />
                        ))}
                        {list.length > 3 ? (
                          <span className="text-[10px] text-white/50">+{list.length - 3}</span>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-[#354B3A]">
        <CardHeader>
          <CardTitle className="text-white">
            {selectedDay
              ? `Eventos — ${format(selectedDay, "d MMMM yyyy", { locale: es })}`
              : "Selecciona un día en el calendario"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {!selectedDay ? (
            <p className="text-sm text-white/60">Toca un día en la cuadrícula para ver y editar actividades.</p>
          ) : dayEvents.length === 0 ? (
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
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

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
              <Label className="text-white/80">Inicio</Label>
              <Input
                type={newAllDay ? "date" : "datetime-local"}
                value={
                  newAllDay && newStart
                    ? newStart.slice(0, 10)
                    : newStart
                }
                onChange={(e) => {
                  const v = e.target.value;
                  if (newAllDay) {
                    setNewStart(`${v}T00:00`);
                    setNewEnd(`${v}T23:59`);
                  } else {
                    setNewStart(v);
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

      <Dialog open={!!detailEvent} onOpenChange={(o) => !o && setDetailEvent(null)}>
        <DialogContent className="border-white/10 bg-[#203324] text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-special pr-8">{detailEvent?.title}</DialogTitle>
          </DialogHeader>
          {detailEvent ? (
            <div className="space-y-2 text-sm text-white/80">
              <p>
                {detailEvent.allDay
                  ? `Todo el día · ${format(new Date(detailEvent.startAt), "PP", { locale: es })}`
                  : `${format(new Date(detailEvent.startAt), "PPp", { locale: es })} → ${format(new Date(detailEvent.endAt), "p", { locale: es })}`}
              </p>
              {detailEvent.description ? <p className="text-white/70">{detailEvent.description}</p> : null}
              {detailEvent.location ? <p className="text-[var(--accent-hex)]">{detailEvent.location}</p> : null}
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
