import type { Pic18ProgressSummary } from "@/lib/aprende-pic18-progress-summary";
import type { CourseEnrollmentStatus } from "@/lib/cursos/course-enrollment";

const STATUS_LABEL: Record<CourseEnrollmentStatus, string> = {
  not_started: "Sin comenzar",
  in_progress: "En progreso",
  completed: "Completado",
};

type Props = {
  summary: Pic18ProgressSummary | null;
  status: CourseEnrollmentStatus;
  progressUpdatedAt?: string | null;
  compact?: boolean;
};

export function CursoProgressPanel({ summary, status, progressUpdatedAt, compact = false }: Props) {
  if (!summary && status === "not_started") return null;

  const percent = summary?.percent ?? 0;

  return (
    <div
      className={
        compact
          ? "rounded-xl border border-[var(--aprende-border)] bg-[color-mix(in_srgb,var(--aprende-surface)_85%,transparent)] p-3"
          : "aprende-card p-5"
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="aprende-section-label text-[10px]">Tu progreso en CALETAS</p>
          <p className="mt-1 text-sm font-medium text-white">{STATUS_LABEL[status]}</p>
        </div>
        <strong className="font-special text-2xl text-[var(--aprende-accent-bright)]">{percent}%</strong>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-[var(--aprende-accent)] transition-all"
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>

      {summary ? (
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div className="font-semibold text-white">
              {summary.lessonsCompleted}/{summary.lessonsTracked}
            </div>
            <div className="text-white/55">lecciones</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div className="font-semibold text-white">
              {summary.quizzesPassed}/{summary.quizzesTracked}
            </div>
            <div className="text-white/55">quizzes</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div className="font-semibold text-white">
              {summary.averageScore ?? "—"}
              {summary.averageScore === null ? "" : "%"}
            </div>
            <div className="text-white/55">promedio</div>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5">
            <div className="font-semibold text-white">
              {summary.checklistDone}/{summary.checklistTotal}
            </div>
            <div className="text-white/55">checklist</div>
          </div>
        </div>
      ) : null}

      {progressUpdatedAt ? (
        <p className="mt-3 text-[11px] text-white/45">
          Última actividad:{" "}
          {new Date(progressUpdatedAt).toLocaleDateString("es-VE", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      ) : null}
    </div>
  );
}
