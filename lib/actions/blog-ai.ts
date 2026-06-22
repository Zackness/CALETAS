"use server";

import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import { requireAdminUserId } from "@/lib/auth";
import { BLOG_EDITOR_AI_SYSTEM_PROMPT } from "@/lib/blog/ai-system-prompt";
import { BLOG_CATEGORY_IDS, getBlogCategoryLabel } from "@/lib/blog/categories";
import type { BlogCategory } from "@prisma/client";
import { slugifyBlogTitle } from "@/lib/blog/utils";

const openai = createOpenAI({ apiKey: process.env.OPENAI_API_KEY });

const blogCategoryEnum = z.enum(BLOG_CATEGORY_IDS);

const articleSchema = z.object({
  title: z.string().describe("Título principal del artículo (H1)"),
  content: z.string().describe("Cuerpo completo en Markdown, con H2/H3 y CTA final"),
  metaTitle: z.string().describe("Meta título SEO, ~60 caracteres"),
  metaDescription: z.string().describe("Meta descripción SEO, ~160 caracteres"),
  slug: z.string().describe("Slug URL en minúsculas con guiones"),
  excerpt: z.string().describe("Resumen corto para listados del blog"),
  category: blogCategoryEnum.describe("Pilar de contenido más adecuado"),
  /** OpenAI exige todos los campos en `required`; usar "" si no hay keyword. */
  primaryKeyword: z.string().describe("Palabra clave principal; cadena vacía si no aplica"),
});

const seoOnlySchema = z.object({
  metaTitle: z.string(),
  metaDescription: z.string(),
  slug: z.string(),
  excerpt: z.string(),
  primaryKeyword: z.string().describe("Palabra clave principal; cadena vacía si no aplica"),
});

export type BlogAiArticleResult = z.infer<typeof articleSchema>;
export type BlogAiSeoResult = z.infer<typeof seoOnlySchema>;

export type BlogAiMode = "generate" | "improve" | "seo";

const fragmentSchema = z.object({
  content: z
    .string()
    .describe(
      "Fragmento en Markdown para insertar en el artículo (##/###, listas, párrafos). Sin H1. Sin repetir el artículo entero."
    ),
});

export type BlogAiFragmentResult = z.infer<typeof fragmentSchema>;

async function requireBlogAdmin() {
  return requireAdminUserId("Solo administradores pueden usar la IA del blog.");
}

function buildUserPrompt(input: {
  mode: BlogAiMode;
  instructions: string;
  category: BlogCategory;
  currentTitle?: string;
  currentContent?: string;
}) {
  const categoryLabel = getBlogCategoryLabel(input.category);
  const lines: string[] = [
    `Modo: ${input.mode === "generate" ? "GENERAR artículo nuevo" : input.mode === "improve" ? "MEJORAR borrador existente" : "SOLO SEO (metadatos)"}`,
    `Categoría editorial asignada: ${categoryLabel} (ID: ${input.category})`,
    "",
    "Instrucciones del editor:",
    input.instructions.trim() || "(Sin instrucciones adicionales; propón un tema estratégico acorde a la categoría.)",
  ];

  if (input.mode !== "generate" && (input.currentTitle || input.currentContent)) {
    lines.push("", "--- Borrador actual ---");
    if (input.currentTitle) lines.push(`Título actual: ${input.currentTitle}`);
    if (input.currentContent) {
      lines.push("Contenido actual (Markdown):");
      lines.push(input.currentContent.slice(0, 12000));
    }
  }

  if (input.mode === "generate") {
    lines.push(
      "",
      "Genera un artículo completo siguiendo la estructura recomendada (introducción, desarrollo, aplicación práctica, relación con STARTUPVEN, conclusión, CTA)."
    );
  } else if (input.mode === "improve") {
    lines.push(
      "",
      "Mejora el borrador: más claridad, tono STVN, mejor estructura y valor estratégico. Mantén la intención del autor salvo que las instrucciones pidan otro enfoque."
    );
  } else {
    lines.push(
      "",
      "No reescribas el artículo. Solo devuelve meta título, meta descripción, slug, excerpt y palabra clave principal basados en el título y contenido actuales."
    );
  }

  return lines.join("\n");
}

export async function generateBlogWithAi(input: {
  mode: BlogAiMode;
  instructions: string;
  category: BlogCategory;
  currentTitle?: string;
  currentContent?: string;
}): Promise<BlogAiArticleResult | BlogAiSeoResult> {
  await requireBlogAdmin();

  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("No está configurada OPENAI_API_KEY en el entorno.");
  }

  const prompt = buildUserPrompt(input);

  if (input.mode === "seo") {
    if (!input.currentTitle?.trim() && !input.currentContent?.trim()) {
      throw new Error("Necesitas título o contenido para generar el SEO.");
    }
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      system: BLOG_EDITOR_AI_SYSTEM_PROMPT,
      prompt,
      schema: seoOnlySchema,
      temperature: 0.5,
    });
    return {
      ...object,
      slug: slugifyBlogTitle(object.slug || input.currentTitle || "articulo"),
    };
  }

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    system: BLOG_EDITOR_AI_SYSTEM_PROMPT,
    prompt,
    schema: articleSchema,
    temperature: 0.65,
  });

  return {
    ...object,
    slug: slugifyBlogTitle(object.slug || object.title),
    category: object.category ?? input.category,
  };
}

/** Genera un fragmento de contenido para insertar en la posición actual del cursor. */
export async function generateBlogFragmentWithAi(input: {
  instructions: string;
  category: BlogCategory;
  articleTitle?: string;
  contentBefore?: string;
  contentAfter?: string;
}): Promise<BlogAiFragmentResult> {
  await requireBlogAdmin();

  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error("No está configurada OPENAI_API_KEY en el entorno.");
  }

  const instructions = input.instructions.trim();
  if (!instructions) throw new Error("Escribe qué debe generar la IA en este fragmento.");

  const categoryLabel = getBlogCategoryLabel(input.category);
  const before = (input.contentBefore ?? "").trim().slice(-2000);
  const after = (input.contentAfter ?? "").trim().slice(0, 2000);

  const prompt = [
    "Modo: FRAGMENTO para insertar en un artículo existente (no reescribas el artículo completo).",
    `Categoría / pilar: ${categoryLabel}`,
    input.articleTitle?.trim() ? `Título del artículo: ${input.articleTitle.trim()}` : "",
    "",
    "Texto que va ANTES del cursor (contexto):",
    before || "(vacío)",
    "",
    "Texto que va DESPUÉS del cursor (contexto):",
    after || "(vacío)",
    "",
    "Instrucciones del editor para este fragmento:",
    instructions,
    "",
    "Entrega solo el bloque nuevo en Markdown, coherente con el contexto. Usa ## o ### si necesitas subtítulo, nunca #. Incluye párrafos completos. Sin emojis salvo petición explícita.",
  ]
    .filter(Boolean)
    .join("\n");

  const { object } = await generateObject({
    model: openai("gpt-4o-mini"),
    system: BLOG_EDITOR_AI_SYSTEM_PROMPT,
    prompt,
    schema: fragmentSchema,
    temperature: 0.6,
  });

  return object;
}
