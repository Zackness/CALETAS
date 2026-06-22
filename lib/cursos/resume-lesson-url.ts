import {
  expandPic18ProgressPayload,
  isPic18LessonComplete,
} from "@/lib/aprende-pic18/expand-progress-payload";
import { PIC18_LESSON_CATALOG } from "@/lib/aprende-pic18/lesson-catalog";

function normalizeBaseUrl(externalUrl: string): string {
  return externalUrl.replace(/\/+$/, "");
}

/** Ruta relativa en la web del curso (locale en) donde debe continuar el estudiante. */
export function resolveSyncedCourseResumePath(payload: unknown): string {
  const expanded = expandPic18ProgressPayload(payload);
  const studyPath =
    expanded.studyPath && typeof expanded.studyPath === "object"
      ? (expanded.studyPath as Record<string, boolean>)
      : {};
  const quizzes =
    expanded.quizzes && typeof expanded.quizzes === "object"
      ? (expanded.quizzes as Record<string, { passed?: boolean }>)
      : {};
  const checklists =
    expanded.checklists && typeof expanded.checklists === "object"
      ? (expanded.checklists as Record<string, unknown>)
      : {};
  const skillGuides =
    expanded.skillGuides && typeof expanded.skillGuides === "object"
      ? (expanded.skillGuides as Record<string, boolean>)
      : {};

  for (const lesson of PIC18_LESSON_CATALOG) {
    if (isPic18LessonComplete(lesson, studyPath, quizzes, checklists, skillGuides)) continue;

    if (lesson.quizSlug) return `/en/${lesson.quizSlug}/`;
    if (lesson.autoSkillSeries) {
      const series = lesson.autoSkillSeries;
      const prefix = `${series}/`;
      const doneSteps = Object.entries(skillGuides)
        .filter(([key, value]) => value === true && key.startsWith(prefix))
        .map(([key]) => key.slice(prefix.length));
      if (doneSteps.length > 0) {
        return `/en/tutoriales/guias/${series}/${doneSteps[doneSteps.length - 1]}/`;
      }
      return `/en/tutoriales/guias/${series}/`;
    }
    if (lesson.autoPracticeSlug) return `/en/tutoriales/${lesson.autoPracticeSlug}/`;
  }

  return `/en/ruta-de-estudio/`;
}

export function buildExternalCourseUrl(externalUrl: string, path: string): string {
  const base = normalizeBaseUrl(externalUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

export function defaultStartPathForPlatform(platform: "pic18" | "cpp-poo"): string {
  return platform === "pic18" ? "/en/ruta-de-estudio/" : "/";
}
