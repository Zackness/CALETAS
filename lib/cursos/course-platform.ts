export type AprendeCoursePlatform = "pic18" | "cpp-poo" | "video" | "generic";

export type CursoPlatformInput = {
  slug?: string | null;
  titulo: string;
  tipo?: string | null;
  externalUrl?: string | null;
  urlVideo?: string | null;
};

export function detectAprendeCoursePlatform(curso: CursoPlatformInput): AprendeCoursePlatform {
  const title = curso.titulo.toLowerCase();
  if (
    curso.slug === "aprende-pic18" ||
    curso.externalUrl?.includes("pic18.caleta.top") ||
    title.includes("pic18")
  ) {
    return "pic18";
  }
  if (
    curso.slug === "aprende-cpp-poo" ||
    curso.externalUrl?.includes("cpp.caleta.top") ||
    title.includes("aprendec++") ||
    title.includes("c++ poo")
  ) {
    return "cpp-poo";
  }
  if (curso.tipo === "video" || curso.urlVideo) return "video";
  return "generic";
}

export function courseHasSyncedProgress(platform: AprendeCoursePlatform): boolean {
  return platform === "pic18" || platform === "cpp-poo";
}
