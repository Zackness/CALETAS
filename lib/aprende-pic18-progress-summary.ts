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

export function summarizePic18Progress(payload: unknown): Pic18ProgressSummary | null {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;
  const studyPath = data.studyPath && typeof data.studyPath === "object" ? (data.studyPath as Record<string, unknown>) : {};
  const quizzes = data.quizzes && typeof data.quizzes === "object" ? (data.quizzes as Record<string, unknown>) : {};
  const checklists = data.checklists && typeof data.checklists === "object" ? data.checklists : {};

  const lessons = Object.values(studyPath).filter((v) => typeof v === "boolean");
  const lessonsCompleted = lessons.filter(Boolean).length;
  const quizRows = Object.values(quizzes).filter((v): v is Record<string, unknown> => !!v && typeof v === "object");
  const quizzesPassed = quizRows.filter((q) => q.passed === true).length;
  const scores = quizRows.map((q) => Number(q.score)).filter((n) => Number.isFinite(n));
  const averageScore = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;
  const checklist = countDoneDeep(checklists);

  const doneSignals = lessonsCompleted + quizzesPassed + checklist.done;
  const totalSignals = lessons.length + quizRows.length + checklist.total;
  if (totalSignals === 0) return null;

  return {
    percent: Math.round((doneSignals / totalSignals) * 100),
    lessonsCompleted,
    lessonsTracked: lessons.length,
    quizzesPassed,
    quizzesTracked: quizRows.length,
    averageScore,
    checklistDone: checklist.done,
    checklistTotal: checklist.total,
  };
}
