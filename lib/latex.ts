export type LatexIssue = {
  severity: "error" | "warning";
  message: string;
  line: number;
};

export type LatexRenderResult = {
  markdown: string;
  issues: LatexIssue[];
  hasLatexDocument: boolean;
};

const LATEX_DOCUMENT_RE =
  /\\documentclass\b|\\begin\{document\}|\\(?:sub)*section\*?\{|\\begin\{(?:equation|align|itemize|enumerate|tabular)\}/;

export const DEFAULT_LIBRARY_LATEX_TEMPLATE = String.raw`\documentclass[12pt]{article}
\usepackage[spanish]{babel}
\usepackage[utf8]{inputenc}
\usepackage{amsmath, amssymb}

\title{Nuevo libro}
\author{Caletas}
\date{\today}

\begin{document}
\maketitle

\section{Introducción}
Escribe aquí el contenido para los estudiantes. Puedes usar texto normal, listas, tablas y fórmulas como $E=mc^2$.

\subsection{Ejemplo matemático}
\begin{equation}
\int_0^1 x^2\,dx = \frac{1}{3}
\end{equation}

\begin{itemize}
  \item Punto clave para recordar.
  \item Otro punto con una fórmula inline: $\alpha + \beta$.
\end{itemize}

\end{document}
`;

function lineForIndex(source: string, index: number) {
  return source.slice(0, Math.max(0, index)).split("\n").length;
}

function stripLatexComments(source: string) {
  return source
    .split("\n")
    .map((line) => {
      let escaped = false;
      for (let i = 0; i < line.length; i += 1) {
        const ch = line[i];
        if (ch === "\\" && !escaped) {
          escaped = true;
          continue;
        }
        if (ch === "%" && !escaped) return line.slice(0, i).trimEnd();
        escaped = false;
      }
      return line;
    })
    .join("\n");
}

function collectBraceIssues(source: string): LatexIssue[] {
  const issues: LatexIssue[] = [];
  const stack: number[] = [];
  let escaped = false;

  for (let i = 0; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === "\\" && !escaped) {
      escaped = true;
      continue;
    }
    if (ch === "{" && !escaped) stack.push(i);
    if (ch === "}" && !escaped) {
      const open = stack.pop();
      if (open === undefined) {
        issues.push({
          severity: "error",
          message: "Llave de cierre sin apertura.",
          line: lineForIndex(source, i),
        });
      }
    }
    escaped = false;
  }

  for (const index of stack.slice(-8)) {
    issues.push({
      severity: "error",
      message: "Llave de apertura sin cierre.",
      line: lineForIndex(source, index),
    });
  }

  return issues;
}

function collectEnvironmentIssues(source: string): LatexIssue[] {
  const issues: LatexIssue[] = [];
  const stack: { name: string; index: number }[] = [];
  const envRe = /\\(begin|end)\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = envRe.exec(source))) {
    const [, kind, name] = match;
    if (kind === "begin") {
      stack.push({ name, index: match.index });
      continue;
    }

    const open = stack.pop();
    if (!open) {
      issues.push({
        severity: "error",
        message: `\\end{${name}} no tiene \\begin correspondiente.`,
        line: lineForIndex(source, match.index),
      });
      continue;
    }
    if (open.name !== name) {
      issues.push({
        severity: "error",
        message: `Entorno cruzado: se abrió ${open.name} y se cerró ${name}.`,
        line: lineForIndex(source, match.index),
      });
    }
  }

  for (const open of stack.slice(-8)) {
    issues.push({
      severity: "error",
      message: `\\begin{${open.name}} no tiene \\end correspondiente.`,
      line: lineForIndex(source, open.index),
    });
  }

  return issues;
}

function extractDocumentBody(source: string) {
  const begin = source.match(/\\begin\{document\}/);
  const end = source.match(/\\end\{document\}/);
  if (!begin) return source;

  const start = (begin.index ?? 0) + begin[0].length;
  const finish = end?.index && end.index > start ? end.index : source.length;
  return source.slice(start, finish).trim();
}

function readLatexMeta(source: string, command: "title" | "author" | "date") {
  const re = new RegExp(String.raw`\\${command}\{([^}]*)\}`);
  return source.match(re)?.[1]?.trim() || "";
}

function convertTabular(body: string) {
  return body.replace(/\\begin\{tabular\}\{[^}]*\}([\s\S]*?)\\end\{tabular\}/g, (_, rows: string) => {
    const parsedRows = String(rows)
      .replace(/\\hline/g, "")
      .split(/\\\\/)
      .map((row) =>
        row
          .split("&")
          .map((cell) => cell.trim())
          .filter(Boolean),
      )
      .filter((row) => row.length);

    if (!parsedRows.length) return "";
    const width = Math.max(...parsedRows.map((row) => row.length));
    const normalized = parsedRows.map((row) => [...row, ...Array(Math.max(0, width - row.length)).fill("")]);
    const header = normalized[0];
    const separator = Array(width).fill("---");
    const rest = normalized.slice(1);

    return [
      "",
      `| ${header.join(" | ")} |`,
      `| ${separator.join(" | ")} |`,
      ...rest.map((row) => `| ${row.join(" | ")} |`),
      "",
    ].join("\n");
  });
}

function convertLists(body: string) {
  return body
    .replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/g, (_, content: string) =>
      String(content).replace(/\\item\s+/g, "\n- ").trim(),
    )
    .replace(/\\begin\{enumerate\}([\s\S]*?)\\end\{enumerate\}/g, (_, content: string) => {
      let index = 0;
      return String(content)
        .replace(/\\item\s+/g, () => `\n${(index += 1)}. `)
        .trim();
    });
}

function convertMathEnvironments(body: string) {
  return body
    .replace(/\\begin\{(equation\*?|displaymath)\}([\s\S]*?)\\end\{\1\}/g, (_, _env, content: string) => `\n$$\n${content.trim()}\n$$\n`)
    .replace(/\\begin\{(align\*?|gather\*?|multline\*?)\}([\s\S]*?)\\end\{\1\}/g, (_, _env, content: string) => {
      const math = String(content).replace(/&/g, "").trim();
      return `\n$$\n\\begin{aligned}\n${math}\n\\end{aligned}\n$$\n`;
    });
}

function convertInlineCommands(body: string) {
  return body
    .replace(/\\section\*?\{([^}]*)\}/g, "\n# $1\n")
    .replace(/\\subsection\*?\{([^}]*)\}/g, "\n## $1\n")
    .replace(/\\subsubsection\*?\{([^}]*)\}/g, "\n### $1\n")
    .replace(/\\paragraph\*?\{([^}]*)\}/g, "\n**$1.** ")
    .replace(/\\textbf\{([^}]*)\}/g, "**$1**")
    .replace(/\\textit\{([^}]*)\}/g, "*$1*")
    .replace(/\\emph\{([^}]*)\}/g, "*$1*")
    .replace(/\\underline\{([^}]*)\}/g, "$1")
    .replace(/\\href\{([^}]*)\}\{([^}]*)\}/g, "[$2]($1)")
    .replace(/\\url\{([^}]*)\}/g, "[$1]($1)")
    .replace(/\\\[/g, "$$")
    .replace(/\\\]/g, "$$")
    .replace(/\\\(/g, "$")
    .replace(/\\\)/g, "$")
    .replace(/\\maketitle/g, "");
}

function removePreambleCommands(body: string) {
  return body
    .replace(/\\documentclass(?:\[[^\]]*\])?\{[^}]*\}/g, "")
    .replace(/\\usepackage(?:\[[^\]]*\])?\{[^}]*\}/g, "")
    .replace(/\\(?:title|author|date)\{[^}]*\}/g, "")
    .replace(/\\label\{[^}]*\}/g, "")
    .replace(/\\ref\{([^}]*)\}/g, "$1")
    .replace(/\\cite\{([^}]*)\}/g, "[$1]");
}

function normalizeWhitespace(body: string) {
  return body
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function renderLatexToMarkdown(source: string): LatexRenderResult {
  const raw = source || "";
  const hasLatexDocument = LATEX_DOCUMENT_RE.test(raw);
  const withoutComments = stripLatexComments(raw);
  const issues = [...collectBraceIssues(withoutComments), ...collectEnvironmentIssues(withoutComments)];

  if (!hasLatexDocument) {
    return { markdown: raw, issues, hasLatexDocument };
  }

  const title = readLatexMeta(withoutComments, "title");
  const author = readLatexMeta(withoutComments, "author");
  const date = readLatexMeta(withoutComments, "date");
  let body = extractDocumentBody(withoutComments);

  body = convertTabular(body);
  body = convertLists(body);
  body = convertMathEnvironments(body);
  body = convertInlineCommands(body);
  body = removePreambleCommands(body);
  body = normalizeWhitespace(body);

  const heading = [
    title ? `# ${title}` : "",
    [author, date].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .join("\n\n");

  return {
    markdown: normalizeWhitespace([heading, body].filter(Boolean).join("\n\n")),
    issues,
    hasLatexDocument,
  };
}
