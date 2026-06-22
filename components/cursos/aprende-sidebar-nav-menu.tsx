"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Braces,
  Cpu,
  ExternalLink,
  GraduationCap,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { detectAprendeCoursePlatform } from "@/lib/cursos/course-platform";
import type { CourseEnrollmentStatus } from "@/lib/cursos/course-enrollment";

type SidebarCurso = {
  id: string;
  titulo: string;
  slug: string | null;
  tipo: string;
  tema: string | null;
  externalUrl: string | null;
  progress?: { percent: number } | null;
  enrollment?: { status: CourseEnrollmentStatus };
};

const STATUS_CHIP: Record<CourseEnrollmentStatus, string> = {
  not_started: "Nuevo",
  in_progress: "En curso",
  completed: "Completado",
};

function courseIcon(curso: SidebarCurso) {
  const platform = detectAprendeCoursePlatform(curso);
  if (platform === "pic18") return Cpu;
  if (platform === "cpp-poo") return Braces;
  if (curso.tipo === "video") return PlayCircle;
  return GraduationCap;
}

function courseSubtitle(curso: SidebarCurso): string {
  const platform = detectAprendeCoursePlatform(curso);
  if (platform === "pic18") return "Microcontroladores · Curso web";
  if (platform === "cpp-poo") return "C++ POO · Curso web";
  if (curso.tipo === "video") return "Curso en video";
  return curso.tema?.trim() || "Curso Aprende";
}

type Props = {
  onNavigate?: () => void;
};

export function AprendeSidebarNavMenu({ onNavigate }: Props) {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const [cursos, setCursos] = useState<SidebarCurso[]>([]);
  const [loading, setLoading] = useState(true);

  const isCatalog = pathname === "/cursos";
  const activeCursoId = pathname.match(/^\/cursos\/([^/]+)$/)?.[1] ?? null;

  useEffect(() => {
    fetch("/api/cursos")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setCursos(Array.isArray(data?.cursos) ? data.cursos : []);
      })
      .catch(() => setCursos([]))
      .finally(() => setLoading(false));
  }, []);

  const close = () => onNavigate?.();

  return (
    <div className="aprende-sidebar-zone">
      <div className="aprende-sidebar-zone__glow" aria-hidden />

      <button
        type="button"
        onClick={() => {
          router.push("/home");
          close();
        }}
        className="aprende-sidebar-back mb-3 flex w-full items-center gap-2 rounded-xl border border-[var(--aprende-border)] bg-[color-mix(in_srgb,var(--aprende-surface)_40%,transparent)] px-3 py-2.5 text-sm text-white/85 transition-colors hover:border-[color-mix(in_oklab,var(--aprende-accent)_40%,transparent)] hover:bg-[color-mix(in_oklab,var(--aprende-accent)_12%,transparent)] hover:text-white"
      >
        <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--aprende-accent-bright)]" />
        <span>Volver a CALETAS</span>
      </button>

      <nav className="space-y-1" aria-label="Navegación Aprende">
        <Link
          href="/cursos"
          onClick={close}
          className={cn(
            "sidebar-link-aprende flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 text-white transition-colors",
            isCatalog && "sidebar-link-aprende--active",
          )}
        >
          <Sparkles className="h-4 w-4 shrink-0 text-[var(--aprende-accent-bright)]" aria-hidden />
          <span className="truncate font-medium">Catálogo de cursos</span>
        </Link>
      </nav>

      <div className="aprende-sidebar-courses mt-4">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="aprende-section-label text-[10px]">Tus cursos</p>
          {!loading && cursos.length > 0 ? (
            <span className="rounded-full border border-[var(--aprende-border)] bg-[color-mix(in_oklab,var(--aprende-accent)_10%,transparent)] px-2 py-0.5 text-[10px] font-semibold text-[var(--aprende-accent-bright)]">
              {cursos.length}
            </span>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-2 px-1">
            {[0, 1].map((i) => (
              <div key={i} className="aprende-sidebar-course aprende-sidebar-course--skeleton h-[4.25rem] animate-pulse" />
            ))}
          </div>
        ) : cursos.length === 0 ? (
          <p className="px-1 text-xs leading-relaxed text-white/50">
            Aún no hay cursos publicados en Aprende.
          </p>
        ) : (
          <ul className="space-y-2">
            {cursos.map((curso) => {
              const Icon = courseIcon(curso);
              const active = activeCursoId === curso.id;
              const status = curso.enrollment?.status ?? "not_started";
              const percent = curso.progress?.percent ?? 0;

              return (
                <li key={curso.id}>
                  <Link
                    href={`/cursos/${curso.id}`}
                    onClick={close}
                    className={cn(
                      "aprende-sidebar-course sidebar-link-aprende group flex min-w-0 items-start gap-3 rounded-xl px-2.5 py-2.5 text-white transition-colors",
                      active && "sidebar-link-aprende--active aprende-sidebar-course--active",
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors",
                        active
                          ? "border-[color-mix(in_oklab,var(--aprende-accent)_55%,transparent)] bg-[color-mix(in_oklab,var(--aprende-accent)_22%,#0f1419)] text-[var(--aprende-accent-bright)]"
                          : "border-[var(--aprende-border)] bg-[color-mix(in_srgb,var(--aprende-surface-card)_80%,transparent)] text-[var(--aprende-accent-bright)] group-hover:border-[color-mix(in_oklab,var(--aprende-accent)_35%,transparent)]",
                      )}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </div>

                    <div className="min-w-0 flex-1 pt-0.5">
                      <div className="flex items-start justify-between gap-2">
                        <span className="truncate text-sm font-semibold leading-tight text-white">
                          {curso.titulo}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                            status === "in_progress" &&
                              "bg-[color-mix(in_oklab,var(--aprende-accent)_20%,transparent)] text-[var(--aprende-accent-bright)]",
                            status === "not_started" && "bg-white/8 text-white/45",
                            status === "completed" &&
                              "bg-emerald-500/15 text-emerald-300",
                          )}
                        >
                          {STATUS_CHIP[status]}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-white/50">{courseSubtitle(curso)}</p>

                      {status !== "not_started" ? (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                            <div
                              className="h-full rounded-full bg-[var(--aprende-accent)] transition-all"
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[10px] font-semibold tabular-nums text-[var(--aprende-accent-bright)]">
                            {percent}%
                          </span>
                        </div>
                      ) : null}
                    </div>

                    {curso.externalUrl ? (
                      <ExternalLink
                        className="mt-1 h-3 w-3 shrink-0 text-white/25 group-hover:text-[var(--aprende-accent-bright)]/70"
                        aria-hidden
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="aprende-sidebar-invasion-note mt-5">
        <p className="text-[11px] leading-relaxed text-white/45">
          <span className="font-semibold text-[var(--aprende-accent-bright)]">Aprende</span> invade el
          campus verde de CALETAS. Cada curso es una experiencia conectada a tu cuenta.
        </p>
      </div>
    </div>
  );
}
