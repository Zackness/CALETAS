import { StudentCalendar } from "@/components/calendario/student-calendar";

export default function AcademicoCalendarioPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-special text-white">Mi calendario</h1>
        <p className="mt-1 text-white/70">
          Organiza entregas, clases y recordatorios. Usa texto o voz: la IA propone fechas y tú confirmas.
        </p>
      </div>
      <StudentCalendar />
    </div>
  );
}
