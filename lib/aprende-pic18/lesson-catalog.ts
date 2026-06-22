import catalog from "@/lib/aprende-pic18/lesson-catalog.json";

export type Pic18LessonCatalogEntry = {
  id: string;
  quizSlug: string | null;
  autoSkillSeries: string | null;
  autoPracticeSlug: string | null;
  practiceSteps: number;
  skillSteps: number;
};

export const PIC18_LESSON_CATALOG = catalog.lessons as Pic18LessonCatalogEntry[];
export const PIC18_LESSON_TOTAL = catalog.total;
