import { detectAprendeCoursePlatform, type CursoPlatformInput } from "@/lib/cursos/course-platform";

const CANONICAL_SLUGS: Record<string, string> = {
  pic18: "aprende-pic18",
  "cpp-poo": "aprende-cpp-poo",
};

type DedupeCurso = CursoPlatformInput & {
  id: string;
  slug?: string | null;
  descripcion?: string;
  orden?: number;
  createdAt?: Date | string;
};

function scoreCurso(curso: DedupeCurso, platform: string): number {
  let score = 0;
  const canonical = CANONICAL_SLUGS[platform];
  if (canonical && curso.slug === canonical) score += 100;
  if (curso.slug?.trim()) score += 20;
  if (curso.descripcion && curso.descripcion.length > 80) score += 10;
  score -= (curso.orden ?? 0) * 0.1;
  return score;
}

/** Una sola tarjeta por plataforma sincronizada (PIC18, C++ POO). */
export function dedupeCursosByPlatform<T extends DedupeCurso>(cursos: T[]): T[] {
  const syncedBuckets = new Map<string, T[]>();
  const rest: T[] = [];

  for (const curso of cursos) {
    const platform = detectAprendeCoursePlatform(curso);
    if (platform === "pic18" || platform === "cpp-poo") {
      const list = syncedBuckets.get(platform) ?? [];
      list.push(curso);
      syncedBuckets.set(platform, list);
    } else {
      rest.push(curso);
    }
  }

  const picked: T[] = [];
  for (const [platform, items] of syncedBuckets) {
    if (items.length === 1) {
      picked.push(items[0]);
      continue;
    }
    const best = [...items].sort((a, b) => scoreCurso(b, platform) - scoreCurso(a, platform))[0];
    picked.push(best);
  }

  return [...picked, ...rest].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));
}

export function isLegacyDuplicateCurso(curso: DedupeCurso): boolean {
  const platform = detectAprendeCoursePlatform(curso);
  if (platform !== "pic18" && platform !== "cpp-poo") return false;
  const canonical = CANONICAL_SLUGS[platform];
  return Boolean(canonical && curso.slug !== canonical);
}
