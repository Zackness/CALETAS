import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import type { CppPooProgressSummary } from "@/lib/aprende-cpp-poo-progress-summary";

type CourseProgressCardProps = {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  href: string;
  summary: CppPooProgressSummary;
  updatedAt?: Date | null;
};

export function CourseProgressCard({
  icon: Icon,
  title,
  subtitle,
  href,
  summary,
  updatedAt,
}: CourseProgressCardProps) {
  return (
    <section className="mt-8 overflow-hidden rounded-2xl border border-[color-mix(in_oklab,var(--accent-hex)_35%,transparent)] bg-[#1C2D20] shadow-lg">
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-start gap-3">
          <div className="rounded-2xl bg-[color-mix(in_oklab,var(--accent-hex)_18%,transparent)] p-3 text-[var(--accent-hex)]">
            <Icon className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--accent-hex)]">Curso activo</p>
            <h2 className="mt-1 font-special text-xl text-white">{title}</h2>
            <p className="mt-1 text-sm text-white/60">{subtitle}</p>
          </div>
        </div>
        <Link
          href={href}
          className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/15"
        >
          Ver curso
        </Link>
      </div>
      <div className="border-t border-white/10 p-4 sm:p-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <div className="text-3xl font-bold text-white">{summary.percent}%</div>
            <div className="text-xs text-white/55">avance estimado</div>
          </div>
          {updatedAt ? (
            <div className="text-right text-xs text-white/45">
              Actualizado {updatedAt.toLocaleDateString("es-VE")}
            </div>
          ) : null}
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[var(--accent-hex)]"
            style={{ width: `${Math.min(100, Math.max(0, summary.percent))}%` }}
          />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-white/5 p-3">
            <div className="font-semibold text-white">
              {summary.lessonsCompleted}/{summary.lessonsTracked}
            </div>
            <div className="text-xs text-white/55">lecciones</div>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="font-semibold text-white">
              {summary.quizzesPassed}/{summary.quizzesTracked}
            </div>
            <div className="text-xs text-white/55">quizzes aprobados</div>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="font-semibold text-white">
              {summary.averageScore ?? "--"}
              {summary.averageScore === null ? "" : "%"}
            </div>
            <div className="text-xs text-white/55">promedio</div>
          </div>
          <div className="rounded-xl bg-white/5 p-3">
            <div className="font-semibold text-white">
              {summary.checklistDone}/{summary.checklistTotal}
            </div>
            <div className="text-xs text-white/55">checklist</div>
          </div>
        </div>
      </div>
    </section>
  );
}
