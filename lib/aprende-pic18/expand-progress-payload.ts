import {
  PIC18_LESSON_CATALOG,
  type Pic18LessonCatalogEntry,
} from "@/lib/aprende-pic18/lesson-catalog";

function normalizeQuizSlug(slug: string): string {
  return slug
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/^en\//, "")
    .replace(/\/basico$/i, "");
}

function isQuizPassed(
  quizzes: Record<string, { passed?: boolean }>,
  lessonQuizSlug: string,
): boolean {
  const target = normalizeQuizSlug(lessonQuizSlug);
  return Object.entries(quizzes).some(([key, value]) => {
    if (!value?.passed) return false;
    const normalized = normalizeQuizSlug(key);
    return (
      normalized === target ||
      normalized.startsWith(`${target}/`) ||
      target.startsWith(`${normalized}/`)
    );
  });
}

function isPracticeComplete(
  checklists: Record<string, unknown>,
  slug: string,
  requiredSteps: number,
): boolean {
  if (requiredSteps <= 0) return false;
  const checklist = checklists[`practice-${slug}`];
  if (!checklist || typeof checklist !== "object") return false;
  const row = checklist as Record<string, boolean>;
  for (let i = 0; i < requiredSteps; i++) {
    if (!(row[String(i)] || row[i])) return false;
  }
  return true;
}

function isSkillSeriesComplete(
  skillGuides: Record<string, boolean>,
  seriesId: string,
  requiredSteps: number,
): boolean {
  if (requiredSteps <= 0) return false;
  const prefix = `${seriesId}/`;
  const done = Object.entries(skillGuides).filter(
    ([key, value]) => value === true && key.startsWith(prefix),
  ).length;
  return done >= requiredSteps;
}

function getSkillGuidesMap(payload: Record<string, unknown>): Record<string, boolean> {
  const raw = payload.skillGuides;
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (value === true) out[key] = true;
  }
  return out;
}

export function isPic18LessonComplete(
  lesson: Pic18LessonCatalogEntry,
  studyPath: Record<string, boolean>,
  quizzes: Record<string, { passed?: boolean }>,
  checklists: Record<string, unknown>,
  skillGuides: Record<string, boolean>,
): boolean {
  if (studyPath[lesson.id] === true) return true;
  if (lesson.quizSlug && isQuizPassed(quizzes, lesson.quizSlug)) return true;
  if (
    lesson.autoPracticeSlug &&
    isPracticeComplete(checklists, lesson.autoPracticeSlug, lesson.practiceSteps)
  ) {
    return true;
  }
  if (
    lesson.autoSkillSeries &&
    isSkillSeriesComplete(skillGuides, lesson.autoSkillSeries, lesson.skillSteps)
  ) {
    return true;
  }
  return false;
}

/** Expande studyPath como hace AprendePIC18 antes de mostrar/guardar progreso. */
export function expandPic18ProgressPayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const data = { ...(payload as Record<string, unknown>) };

  const studyPath =
    data.studyPath && typeof data.studyPath === "object"
      ? { ...(data.studyPath as Record<string, boolean>) }
      : {};
  const quizzes =
    data.quizzes && typeof data.quizzes === "object"
      ? (data.quizzes as Record<string, { passed?: boolean }>)
      : {};
  const checklists =
    data.checklists && typeof data.checklists === "object"
      ? (data.checklists as Record<string, unknown>)
      : {};
  const skillGuides = getSkillGuidesMap(data);

  for (const lesson of PIC18_LESSON_CATALOG) {
    if (isPic18LessonComplete(lesson, studyPath, quizzes, checklists, skillGuides)) {
      studyPath[lesson.id] = true;
    }
  }

  data.studyPath = studyPath;
  return data;
}
