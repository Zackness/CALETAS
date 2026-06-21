import "server-only";

import { db } from "@/lib/db";
import { extractTextFromCaletaFile, truncateText } from "@/lib/caleta-file-text";
import { canViewerAccessRecurso } from "@/lib/caletas-visibility";
import { getActiveSubscriptionForUser } from "@/lib/subscription";

const MAX_RECURSOS_PER_CHAT = 3;
const MAX_CHARS_PER_RECURSO = 12_000;
const MAX_TOTAL_CHARS = 28_000;

async function buildRecursoTextBlock(
  userId: string,
  recurso: {
    id: string;
    titulo: string;
    descripcion: string;
    contenido: string;
    tipo: string;
    tags: string;
    archivoUrl: string | null;
    materia: { codigo: string; nombre: string } | null;
  },
): Promise<string> {
  const header = [
    `### Caleta: ${recurso.titulo}`,
    `ID: ${recurso.id}`,
    `Tipo: ${recurso.tipo}`,
    recurso.materia ? `Materia: ${recurso.materia.codigo} — ${recurso.materia.nombre}` : null,
    `Descripción: ${recurso.descripcion}`,
    recurso.tags ? `Tags: ${recurso.tags}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  let body = recurso.contenido?.trim() ?? "";
  if (recurso.archivoUrl) {
    const extracted = await extractTextFromCaletaFile(recurso.archivoUrl, {
      userId,
      fileLabel: recurso.titulo,
    });
    if (extracted) {
      body = extracted;
    } else if (!body || body.startsWith("Archivo:")) {
      body = `(Archivo adjunto en la caleta; no se pudo extraer texto automáticamente. Usa título, descripción y metadatos.)`;
    }
  }

  const combined = `${header}\n\n${body}`.trim();
  return truncateText(combined, MAX_CHARS_PER_RECURSO);
}

export async function buildCaletaContextForChat(
  userId: string,
  recursoIds: string[],
): Promise<string> {
  const unique = [...new Set(recursoIds.filter(Boolean))].slice(0, MAX_RECURSOS_PER_CHAT);
  if (!unique.length) return "";

  const viewer = await db.user.findUnique({
    where: { id: userId },
    select: { universidadId: true },
  });
  const sub = await getActiveSubscriptionForUser(userId);

  const blocks: string[] = [];
  let total = 0;

  for (const id of unique) {
    const recurso = await db.recurso.findUnique({
      where: { id },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        contenido: true,
        tipo: true,
        tags: true,
        archivoUrl: true,
        autorId: true,
        universidadId: true,
        materia: {
          select: {
            codigo: true,
            nombre: true,
            carrera: { select: { universidadId: true } },
          },
        },
      },
    });

    if (!recurso) continue;

    const allowed = canViewerAccessRecurso(userId, viewer?.universidadId, sub, recurso);
    if (!allowed) continue;

    const block = await buildRecursoTextBlock(userId, {
      id: recurso.id,
      titulo: recurso.titulo,
      descripcion: recurso.descripcion,
      contenido: recurso.contenido,
      tipo: recurso.tipo,
      tags: recurso.tags,
      archivoUrl: recurso.archivoUrl,
      materia: recurso.materia
        ? { codigo: recurso.materia.codigo, nombre: recurso.materia.nombre }
        : null,
    });

    if (total + block.length > MAX_TOTAL_CHARS) {
      const room = MAX_TOTAL_CHARS - total;
      if (room > 500) blocks.push(truncateText(block, room));
      break;
    }
    blocks.push(block);
    total += block.length;
  }

  if (!blocks.length) return "";

  return [
    "Archivos de Caletas seleccionados por el estudiante (usa esta información para responder; cita el título del recurso cuando te bases en él):",
    "",
    blocks.join("\n\n---\n\n"),
  ].join("\n");
}
