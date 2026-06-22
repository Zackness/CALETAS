"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { CalendarDays, ChevronLeft, ChevronRight, Loader2, Sparkles, Trash2 } from "lucide-react";
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
  activityType: string | null;
  description: string | null;
  location: string | null;
  startAt: string;
  endAt: string;
  allDay: boolean;
  reminderMinutes: number | null;
  reminderSentAt?: string | null;
  color: string | null;
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

const ACTIVITY_TYPE_OPTIONS = [
  { value: "", label: "Sin tipo" },
  { value: "clase", label: "Clase" },
  { value: "examen", label: "Examen" },
  { value: "entrega", label: "Entrega" },
  { value: "reunion", label: "Reunión" },
  { value: "estudio", label: "Estudio" },
  { value: "personal", label: "Personal" },
] as const;

function activityTypeLabel(value: string | null | undefined) {
  return ACTIVITY_TYPE_OPTIONS.find((option) => option.value === (value ?? ""))?.label ?? value ?? "Sin tipo";
}

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

  const [viewDate, setViewDate] = useState(() => new Date());
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newActivityType, setNewActivityType] = useState("");
  const [newStart, setNewStart] = useState("");
  const [newEnd, setNewEnd] = useState("");
  const [newAllDay, setNewAllDay] = useState(false);
  const [newReminderMinutes, setNewReminderMinutes] = useState<string>("30");
  const [saving, setSaving] = useState(false);

  const [detailEvent, setDetailEvent] = useState<CalEvent | null>(null);
  const [detailTitle, setDetailTitle] = useState("");
  const [detailActivityType, setDetailActivityType] = useState("");
  const [detailDescription, setDetailDescription] = useState("");
  const [detailLocation, setDetailLocation] = useState("");
  const [detailStart, setDetailStart] = useState("");
  const [detailEnd, setDetailEnd] = useState("");
  const [detailAllDay, setDetailAllDay] = useState(false);
  const [detailReminderMinutes, setDetailReminderMinutes] = useState<string>("30");
  const [detailSaving, setDetailSaving] = useState(false);
  const [activityFilter, setActivityFilter] = useState("all");

  const { gridStart, gridEnd, days } = useMemo(() => {
    const monthStart = startOfMonth(viewDate);
    const monthEnd = endOfMonth(viewDate);
    const start = startOfWeek(monthStart, { weekStartsOn: 1 });
    const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return {
      gridStart: start,
      gridEnd: end,
      days: eachDayOfInterval({ start, end }),
    };
  }, [viewDate]);

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
    setDetailTitle(detailEvent?.title ?? "");
    setDetailActivityType(detailEvent?.activityType ?? "");
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

  const filteredEventsByDay = useMemo(() => {
    if (activityFilter === "all") return eventsByDay;
    const map = new Map<string, CalEvent[]>();
    for (const [key, list] of eventsByDay.entries()) {
      const filtered = list.filter((event) => (event.activityType ?? "") === activityFilter);
      if (filtered.length) map.set(key, filtered);
    }
    return map;
  }, [activityFilter, eventsByDay]);

  const dayEvents = useMemo(() => {
    if (!selectedDay) return [];
    const key = format(selectedDay, "yyyy-MM-dd");
    return (filteredEventsByDay.get(key) ?? []).sort(
      (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
    );
  }, [filteredEventsByDay, selectedDay]);

  const openNewDialog = (d?: Date) => {
    const base = d ?? new Date();
    const end = new Date(base.getTime() + 60 * 60 * 1000);
    setNewTitle("");
    setNewActivityType("");
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
          activityType: newActivityType || null,
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
          activityType: detailActivityType || null,
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
          onClick={() => router.push("/academico/calendario/nuevo/voz")}
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
            <select
              value={activityFilter}
              onChange={(e) => setActivityFilter(e.target.value)}
              className="h-10 rounded-md border border-white/20 bg-[#1C2D20] px-3 text-sm text-white outline-none"
            >
              <option value="all" className="bg-[#1C2D20] text-white">Todas las actividades</option>
              {ACTIVITY_TYPE_OPTIONS.filter((option) => option.value).map((option) => (
                <option key={option.value} value={option.value} className="bg-[#1C2D20] text-white">
                  {option.label}
                </option>
              ))}
            </select>
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
              <div className="grid auto-rows-fr grid-cols-7 gap-1 min-h-[32rem] sm:min-h-[38rem]">
                {days.map((day) => {
                  const key = format(day, "yyyy-MM-dd");
                  const list = filteredEventsByDay.get(key) ?? [];
                  const selected = selectedDay && isSameDay(day, selectedDay);

                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedDay(day)}
                      className={cn(
                        "flex min-h-[4.5rem] h-full flex-col rounded-lg border p-1.5 text-left transition-colors",
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
                      {ev.activityType ? (
                        <div className="mt-1 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/70">
                          {activityTypeLabel(ev.activityType)}
                        </div>
                      ) : null}
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
