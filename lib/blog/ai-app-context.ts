import fs from "fs/promises";
import path from "path";
import { BLOG_CATEGORIES } from "@/lib/blog/categories";

const ROOT = process.cwd();

const STATIC_CONTEXT_FILES = [
  "README.md",
  "blog/blog1.md",
  "scripts/seed-aprende-cursos.js",
  "scripts/seed-aprende-cpp-poo-curso.js",
] as const;

const MAX_FILE_CHARS = 12_000;

async function readProjectFile(relativePath: string, maxChars = MAX_FILE_CHARS): Promise<string | null> {
  try {
    const content = await fs.readFile(path.join(ROOT, relativePath), "utf-8");
    return content.slice(0, maxChars);
  } catch {
    return null;
  }
}

/** Contexto fijo de producto para la IA editorial. */
export const CALETAS_APP_OVERVIEW = `# Contexto de producto — Caletas

Caletas (caleta.top) es una plataforma académica colaborativa para estudiantes universitarios en Venezuela y la región.

## Qué es
- Campus digital donde estudiantes comparten **caletas** (apuntes, guías, PDFs, recursos).
- Panel **académico**: materias, notas, metas, recomendaciones, calendario.
- **Herramientas IA** de estudio (chat, resúmenes, etc.).
- Sub-marca **Aprende** (/cursos): cursos web con progreso sincronizado a la cuenta Caletas.
- **Comunidad**: perfiles, seguir usuarios, notificaciones, comentarios y likes.
- **Biblioteca**, **tareas y notas**, **blog** público en /blog.

## Cursos Aprende actuales
- **Aprende PIC18** (pic18.caleta.top): PIC18F4550, 44 lecciones, laboratorios UNEXPO, tutor IA.
- **AprendeC++ POO** (cpp.caleta.top): Computación II, C++/POO, laboratorios, proyecto final Arduino + GUI.

## Tono del blog
- Cercano pero profesional, dirigido a estudiantes universitarios.
- Español de Venezuela/LATAM, sin marketing vacío ni jerga corporativa.
- Enlazar a rutas reales: /register, /cursos, /blog/[slug], pic18.caleta.top, cpp.caleta.top.

## Categorías editoriales
${BLOG_CATEGORIES.map((c) => `- ${c.label} (${c.id}): ${c.description}`).join("\n")}
`;

/** Carga archivos del repo como referencia editorial. */
export async function loadProjectReferenceFiles(): Promise<string> {
  const chunks: string[] = [];

  for (const file of STATIC_CONTEXT_FILES) {
    const content = await readProjectFile(file);
    if (content?.trim()) {
      chunks.push(`### Archivo: ${file}\n${content}`);
    }
  }

  return chunks.join("\n\n");
}

/** Contexto completo inyectado en cada generación de IA del blog. */
export async function buildAppContextForAi(): Promise<string> {
  const references = await loadProjectReferenceFiles();
  return [CALETAS_APP_OVERVIEW, references ? `## Referencias del proyecto\n${references}` : ""]
    .filter(Boolean)
    .join("\n\n");
}
