import type { Pic18ProgressSummary } from "@/lib/aprende-pic18-progress-summary";
import {
  buildExternalCourseUrl,
  defaultStartPathForPlatform,
  resolveSyncedCourseResumePath,
} from "@/lib/cursos/resume-lesson-url";
import {
  courseHasSyncedProgress,
  detectAprendeCoursePlatform,
  type AprendeCoursePlatform,
  type CursoPlatformInput,
} from "@/lib/cursos/course-platform";

export type CourseEnrollmentStatus = "not_started" | "in_progress" | "completed";

export type CourseEnrollmentState = {
  platform: AprendeCoursePlatform;
  status: CourseEnrollmentStatus;
  summary: Pic18ProgressSummary | null;
  progressUpdatedAt: string | null;
  /** URL externa o interna para comenzar o continuar. */
  actionUrl: string;
  /** Etiqueta del botón principal. */
  actionLabel: string;
  /** Si conviene abrir en pestaña nueva. */
  openInNewTab: boolean;
  /** Enlace a la ficha informativa en CALETAS. */
  detailHref: string;
};

function hasProgressActivity(payload: unknown): boolean {
  if (!payload || typeof payload !== "object") return false;
  const p = payload as Record<string, unknown>;
  const studyPath = p.studyPath as Record<string, boolean> | undefined;
  const quizzes = p.quizzes as Record<string, unknown> | undefined;
  const checklists = p.checklists as Record<string, unknown> | undefined;
  const skillGuides = p.skillGuides as Record<string, unknown> | undefined;

  if (studyPath && Object.values(studyPath).some((v) => v === true)) return true;
  if (quizzes && Object.keys(quizzes).length > 0) return true;
  if (checklists && Object.keys(checklists).length > 0) return true;
  if (skillGuides && Object.values(skillGuides).some((v) => v === true)) return true;
  return false;
}

function actionLabelForStatus(status: CourseEnrollmentStatus): string {
  switch (status) {
    case "not_started":
      return "Comenzar curso";
    case "in_progress":
      return "Continuar curso";
    case "completed":
      return "Repasar curso";
  }
}

export function resolveCourseEnrollment(input: {
  curso: CursoPlatformInput & {
    id: string;
    externalUrl?: string | null;
    urlVideo?: string | null;
  };
  summary: Pic18ProgressSummary | null;
  payload: unknown;
  progressUpdatedAt: Date | null;
}): CourseEnrollmentState {
  const platform = detectAprendeCoursePlatform(input.curso);
  const detailHref = `/cursos/${input.curso.id}`;
  const synced = courseHasSyncedProgress(platform);
  const percent = input.summary?.percent ?? 0;
  const activity = hasProgressActivity(input.payload);

  let status: CourseEnrollmentStatus = "not_started";
  if (percent >= 100) status = "completed";
  else if (percent > 0 || activity || input.progressUpdatedAt) status = "in_progress";

  let actionUrl = detailHref;
  let openInNewTab = false;

  if (synced && input.curso.externalUrl) {
    openInNewTab = true;
    const syncedPlatform = platform as "pic18" | "cpp-poo";
    const startPath = defaultStartPathForPlatform(syncedPlatform);
    if (status === "not_started") {
      actionUrl = buildExternalCourseUrl(input.curso.externalUrl, startPath);
    } else {
      const resumePath = resolveSyncedCourseResumePath(input.payload);
      actionUrl = buildExternalCourseUrl(input.curso.externalUrl, resumePath);
    }
  } else if (input.curso.tipo === "video" || platform === "video") {
    if (input.curso.urlVideo) {
      actionUrl = `${detailHref}#curso-player`;
    } else {
      actionUrl = detailHref;
    }
  } else if (input.curso.externalUrl) {
    openInNewTab = true;
    actionUrl = input.curso.externalUrl;
  }

  return {
    platform,
    status,
    summary: input.summary,
    progressUpdatedAt: input.progressUpdatedAt?.toISOString() ?? null,
    actionUrl,
    actionLabel: actionLabelForStatus(status),
    openInNewTab,
    detailHref,
  };
}
