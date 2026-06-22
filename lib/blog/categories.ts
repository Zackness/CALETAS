import type { BlogCategory } from "@prisma/client";

export type BlogCategoryMeta = {
  id: BlogCategory;
  label: string;
  slug: string;
  description: string;
};

export const BLOG_CATEGORIES: BlogCategoryMeta[] = [
  {
    id: "NOVEDADES",
    label: "Novedades",
    slug: "novedades",
    description: "Actualizaciones de Caletas, lanzamientos y mejoras de la plataforma.",
  },
  {
    id: "CONSEJOS_ESTUDIO",
    label: "Consejos de estudio",
    slug: "consejos-de-estudio",
    description: "Técnicas, hábitos y estrategias para rendir mejor en la universidad.",
  },
  {
    id: "VIDA_UNIVERSITARIA",
    label: "Vida universitaria",
    slug: "vida-universitaria",
    description: "Campus, semestres, organización y experiencias del día a día estudiantil.",
  },
  {
    id: "RECURSOS_ACADEMICOS",
    label: "Recursos académicos",
    slug: "recursos-academicos",
    description: "Caletas, materiales, guías y apoyo para tus materias.",
  },
  {
    id: "CARRERA",
    label: "Carrera profesional",
    slug: "carrera",
    description: "Prácticas, empleo, portafolio y crecimiento profesional.",
  },
  {
    id: "TECNOLOGIA",
    label: "Tecnología",
    slug: "tecnologia",
    description: "Herramientas digitales, apps y trucos tech para estudiantes.",
  },
  {
    id: "TUTORIALES",
    label: "Tutoriales",
    slug: "tutoriales",
    description: "Guías paso a paso para sacarle provecho a Caletas y otros recursos.",
  },
  {
    id: "COMUNIDAD",
    label: "Comunidad",
    slug: "comunidad",
    description: "Historias, eventos y lo que construimos juntos en Caletas.",
  },
];

export const BLOG_CATEGORY_IDS = BLOG_CATEGORIES.map((c) => c.id) as [
  BlogCategory,
  ...BlogCategory[],
];

const byId = new Map(BLOG_CATEGORIES.map((c) => [c.id, c]));
const bySlug = new Map(BLOG_CATEGORIES.map((c) => [c.slug, c]));

export function getBlogCategoryMeta(id: BlogCategory): BlogCategoryMeta {
  return byId.get(id)!;
}

export function getBlogCategoryLabel(id: BlogCategory | string): string {
  return byId.get(id as BlogCategory)?.label ?? String(id);
}

export function blogCategoryFromSlug(slug: string | null | undefined): BlogCategory | null {
  if (!slug?.trim()) return null;
  return bySlug.get(slug.trim())?.id ?? null;
}

export function blogCategorySlug(id: BlogCategory): string {
  return getBlogCategoryMeta(id).slug;
}

export function isBlogCategory(value: string): value is BlogCategory {
  return byId.has(value as BlogCategory);
}
