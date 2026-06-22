import { expandPic18ProgressPayload, isPic18LessonComplete } from "@/lib/aprende-pic18/expand-progress-payload";
import {
  PIC18_LESSON_CATALOG,
  PIC18_LESSON_TOTAL,
} from "@/lib/aprende-pic18/lesson-catalog";

export type Pic18ProgressSummary = {
  percent: number;
  lessonsCompleted: number;
  lessonsTracked: number;
  quizzesPassed: number;
  quizzesTracked: number;
  averageScore: number | null;
  checklistDone: number;
  checklistTotal: number;
};

function countDoneDeep(value: unknown): { done: number; total: number } {
  if (typeof value === "boolean") return { done: value ? 1 : 0, total: 1 };
  if (!value || typeof value !== "object") return { done: 0, total: 0 };
  return Object.values(value as Record<string, unknown>).reduce<{ done: number; total: number }>(
    (acc, item) => {
      const next = countDoneDeep(item);
      return { done: acc.done + next.done, total: acc.total + next.total };
    },
    { done: 0, total: 0 },
  );
}

/**
 * Misma lógica que la barra global de AprendePIC18:
 * lecciones completadas / total de lecciones de la ruta de estudio.
 */
export function summarizePic18Progress(payload: unknown): Pic18ProgressSummary | null {
  if (!payload || typeof payload !== "object") return null;

  const expanded = expandPic18ProgressPayload(payload);
  const studyPath =
    expanded.studyPath && typeof expanded.studyPath === "object"
      ? (expanded.studyPath as Record<string, boolean>)
      : {};
  const quizzes =
    expanded.quizzes && typeof expanded.quizzes === "object"
      ? (expanded.quizzes as Record<string, { passed?: boolean; score?: number }>)
      : {};
  const checklists =
    expanded.checklists && typeof expanded.checklists === "object" ? expanded.checklists : {};
  const skillGuides =
    expanded.skillGuides && typeof expanded.skillGuides === "object"
      ? (expanded.skillGuides as Record<string, boolean>)
      : {};

  const lessonsCompleted = PIC18_LESSON_CATALOG.filter((lesson) =>
    isPic18LessonComplete(lesson, studyPath, quizzes, checklists as Record<string, unknown>, skillGuides),
  ).length;

  if (PIC18_LESSON_TOTAL === 0) return null;

  const quizRows = Object.values(quizzes).filter((v): v is Record<string, unknown> => !!v && typeof v === "object");
  const quizzesPassed = quizRows.filter((q) => q.passed === true).length;
  const scores = quizRows.map((q) => Number(q.score)).filter((n) => Number.isFinite(n));
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const checklist = countDoneDeep(checklists);

  return {
    percent: Math.round((lessonsCompleted / PIC18_LESSON_TOTAL) * 100),
    lessonsCompleted,
    lessonsTracked: PIC18_LESSON_TOTAL,
    quizzesPassed,
    quizzesTracked: quizRows.length,
    averageScore,
    checklistDone: checklist.done,
    checklistTotal: checklist.total,
  };
}
