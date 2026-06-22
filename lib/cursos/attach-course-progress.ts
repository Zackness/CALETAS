import { summarizeCppPooProgress } from "@/lib/aprende-cpp-poo-progress-summary";
import { summarizePic18Progress } from "@/lib/aprende-pic18-progress-summary";
import type { AprendeProgressRow } from "@/lib/aprende-progress-db";
import { resolveCourseEnrollment } from "@/lib/cursos/course-enrollment";
import { detectAprendeCoursePlatform } from "@/lib/cursos/course-platform";

type CursoProgressInput = {
  id: string;
  titulo: string;
  slug: string | null;
  tipo: string;
  externalUrl: string | null;
  urlVideo?: string | null;
};

export function attachCourseProgressBundle(
  curso: CursoProgressInput,
  pic18: AprendeProgressRow,
  cpp: AprendeProgressRow,
) {
  const platform = detectAprendeCoursePlatform(curso);
  const isPic18 = platform === "pic18";
  const isCpp = platform === "cpp-poo";

  const payload = isPic18 ? pic18.payload : isCpp ? cpp.payload : null;
  const progressUpdatedAt = isPic18 ? pic18.updatedAt : isCpp ? cpp.updatedAt : null;
  const summary = isPic18
    ? summarizePic18Progress(pic18.payload)
    : isCpp
      ? summarizeCppPooProgress(cpp.payload)
      : null;

  const enrollment = resolveCourseEnrollment({
    curso,
    summary,
    payload,
    progressUpdatedAt,
  });

  return {
    progress: summary,
    progressUpdatedAt,
    enrollment,
  };
}
