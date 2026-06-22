import { execFile } from "child_process";
import fs from "fs/promises";
import path from "path";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();

const STOP_WORDS = new Set([
  "para",
  "como",
  "este",
  "esta",
  "esto",
  "sobre",
  "desde",
  "donde",
  "cuando",
  "quien",
  "qué",
  "que",
  "con",
  "sin",
  "por",
  "los",
  "las",
  "del",
  "una",
  "uno",
  "unos",
  "unas",
  "the",
  "and",
  "artículo",
  "articulo",
  "blog",
  "caletas",
  "aprende",
  "curso",
  "escribe",
  "genera",
  "crear",
  "hacer",
]);

const RESEARCH_FILE_HINTS = [
  "app/(public)",
  "app/(protected)",
  "lib/",
  "components/",
  "scripts/",
  "blog/",
  "prisma/",
] as const;

function extractSearchTerms(instructions: string): string[] {
  const tokens = instructions
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .split(/[^a-z0-9+#]+/i)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4 && !STOP_WORDS.has(t));

  return [...new Set(tokens)].slice(0, 6);
}

async function readSnippet(relativePath: string, maxChars = 2500): Promise<string | null> {
  try {
    const full = path.join(ROOT, relativePath);
    const content = await fs.readFile(full, "utf-8");
    return `#### ${relativePath}\n${content.slice(0, maxChars)}`;
  } catch {
    return null;
  }
}

async function findMatchingFiles(terms: string[]): Promise<string[]> {
  if (terms.length === 0) return [];

  const pattern = terms.join("|");
  try {
    const { stdout } = await execFileAsync(
      "rg",
      [
        "-l",
        pattern,
        "--glob",
        "!node_modules/**",
        "--glob",
        "!.next/**",
        "--glob",
        "!*.lock",
        "--glob",
        "!package-lock.json",
        ROOT,
      ],
      { maxBuffer: 2 * 1024 * 1024 }
    );
    return stdout
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((abs) => path.relative(ROOT, abs))
      .filter((rel) => RESEARCH_FILE_HINTS.some((hint) => rel.startsWith(hint)))
      .slice(0, 8);
  } catch {
    return [];
  }
}

/**
 * Investiga el proyecto localmente (grep + lectura de archivos) según el tema pedido.
 * No hace búsqueda web; prioriza código y borradores del repo.
 */
export async function gatherProjectResearch(instructions: string): Promise<string> {
  const terms = extractSearchTerms(instructions);
  if (!instructions.trim()) return "";

  const matchedFiles = await findMatchingFiles(terms);
  const snippets: string[] = [];

  for (const file of matchedFiles) {
    const snippet = await readSnippet(file);
    if (snippet) snippets.push(snippet);
  }

  if (snippets.length === 0) return "";

  return [
    "## Investigación en el proyecto (archivos relevantes)",
    `Términos usados: ${terms.join(", ") || "(generales)"}`,
    snippets.join("\n\n"),
    "Usa estos datos como fuente factual. No inventes features que no aparezcan aquí o en el contexto de Caletas.",
  ].join("\n\n");
}
