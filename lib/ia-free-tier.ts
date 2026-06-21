import { db } from "@/lib/db";
import type { StudentIaModelRole } from "@/lib/ia-models";
import { estimateMaxTotalTokensForHold } from "@/lib/ia-usage-pricing";
import type { IaWalletBillableEndpoint } from "@/lib/ia-wallet";
import { getCachedGatewayCatalog } from "@/lib/vercel-ai-gateway-catalog";

const DEFAULT_TZ = "America/Caracas";

export type IaFreeTierStatus = {
  active: boolean;
  periodKey: string;
  tokensUsed: number;
  tokensLimit: number;
  tokensRemaining: number;
  requestsUsed: number;
  requestsLimit: number;
  requestsRemaining: number;
  resetsAt: string;
  resetsAtLabel: string;
  message: string;
};

export type IaFreeTierGateOk = {
  ok: true;
  tokensRemaining: number;
  requestsRemaining: number;
  resetsAt: Date;
  resetsAtLabel: string;
};

export type IaFreeTierGateBlocked = {
  ok: false;
  code: "FREE_TIER_EXHAUSTED";
  error: string;
  resetsAt: string;
  resetsAtLabel: string;
  tokensUsed: number;
  tokensLimit: number;
  requestsUsed: number;
  requestsLimit: number;
};

export type IaFreeTierGateResult = IaFreeTierGateOk | IaFreeTierGateBlocked;

function freeTierTimezone(): string {
  return process.env.IA_FREE_RESET_TZ?.trim() || DEFAULT_TZ;
}

function freeTierDailyTokens(): number {
  const n = Number(process.env.IA_FREE_DAILY_TOKENS ?? "100000");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 100_000;
}

function freeTierDailyRequests(): number {
  const n = Number(process.env.IA_FREE_DAILY_REQUESTS ?? "50");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 50;
}

export function freeTierMaxOutputTokens(): number {
  const n = Number(process.env.IA_FREE_MAX_OUTPUT_TOKENS ?? "1024");
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1024;
}

function parseEnvModelList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return [...new Set(raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean))];
}

export function getFreeTierPeriodKey(now = new Date()): string {
  const tz = freeTierTimezone();
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function getFreeTierResetsAt(now = new Date()): Date {
  const periodKey = getFreeTierPeriodKey(now);
  const [y, m, d] = periodKey.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d + 1, 12, 0, 0));
  const nextKey = getFreeTierPeriodKey(probe);
  const [ny, nm, nd] = nextKey.split("-").map(Number);

  for (let hourUtc = 0; hourUtc < 48; hourUtc++) {
    const candidate = new Date(Date.UTC(ny, nm - 1, nd, hourUtc, 0, 0));
    if (
      getFreeTierPeriodKey(candidate) === nextKey &&
      getFreeTierPeriodKey(new Date(candidate.getTime() - 60_000)) === periodKey
    ) {
      return candidate;
    }
  }
  return new Date(Date.UTC(ny, nm - 1, nd, 4, 0, 0));
}

export function formatFreeTierResetsAtLabel(resetsAt: Date, now = new Date()): string {
  const tz = freeTierTimezone();
  const sameLocalDay =
    getFreeTierPeriodKey(resetsAt) === getFreeTierPeriodKey(now) ||
    resetsAt.getTime() - now.getTime() < 24 * 60 * 60 * 1000;

  const time = new Intl.DateTimeFormat("es-VE", {
    timeZone: tz,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(resetsAt);

  if (sameLocalDay && resetsAt > now) {
    return `hoy a las ${time}`;
  }

  return new Intl.DateTimeFormat("es-VE", {
    timeZone: tz,
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(resetsAt);
}

export function buildFreeTierExhaustedMessage(resetsAt: Date): string {
  const label = formatFreeTierResetsAtLabel(resetsAt);
  return (
    `Alcanzaste el límite gratuito de IA de hoy. Podrás volver a usar tus tokens gratis ${label}. ` +
    `También puedes recargar tu billetera, conectar tu API key o mejorar tu plan.`
  );
}

export function buildFreeTierRemainingMessage(status: IaFreeTierStatus): string {
  if (!status.active || status.tokensRemaining <= 0) {
    return buildFreeTierExhaustedMessage(new Date(status.resetsAt));
  }
  return (
    `IA gratuita: te quedan aprox. ${status.tokensRemaining.toLocaleString("es-VE")} tokens ` +
    `(${status.requestsRemaining} consultas) hoy. Se renuevan ${status.resetsAtLabel}.`
  );
}

async function getOrCreateDailyRow(userId: string, periodKey: string) {
  return db.iaFreeTierDaily.upsert({
    where: { userId_periodKey: { userId, periodKey } },
    create: { userId, periodKey },
    update: {},
    select: { tokensUsed: true, requestsUsed: true },
  });
}

export async function getFreeTierStatusForUser(userId: string): Promise<IaFreeTierStatus> {
  const periodKey = getFreeTierPeriodKey();
  const tokensLimit = freeTierDailyTokens();
  const requestsLimit = freeTierDailyRequests();
  const resetsAt = getFreeTierResetsAt();
  const resetsAtLabel = formatFreeTierResetsAtLabel(resetsAt);

  const row = await db.iaFreeTierDaily.findUnique({
    where: { userId_periodKey: { userId, periodKey } },
    select: { tokensUsed: true, requestsUsed: true },
  });

  const tokensUsed = row?.tokensUsed ?? 0;
  const requestsUsed = row?.requestsUsed ?? 0;
  const tokensRemaining = Math.max(0, tokensLimit - tokensUsed);
  const requestsRemaining = Math.max(0, requestsLimit - requestsUsed);
  const active = tokensRemaining > 0 && requestsRemaining > 0;

  const status: IaFreeTierStatus = {
    active,
    periodKey,
    tokensUsed,
    tokensLimit,
    tokensRemaining,
    requestsUsed,
    requestsLimit,
    requestsRemaining,
    resetsAt: resetsAt.toISOString(),
    resetsAtLabel,
    message: "",
  };
  status.message = active ? buildFreeTierRemainingMessage(status) : buildFreeTierExhaustedMessage(resetsAt);
  return status;
}

export async function assertFreeTierAccess(params: {
  userId: string;
  endpoint: IaWalletBillableEndpoint;
  tokenEstimate?: number;
}): Promise<IaFreeTierGateResult> {
  const tokensLimit = freeTierDailyTokens();
  const requestsLimit = freeTierDailyRequests();
  const periodKey = getFreeTierPeriodKey();
  const resetsAt = getFreeTierResetsAt();
  const resetsAtLabel = formatFreeTierResetsAtLabel(resetsAt);
  const estimate = params.tokenEstimate ?? estimateMaxTotalTokensForHold(params.endpoint);

  const row = await getOrCreateDailyRow(params.userId, periodKey);
  const tokensRemaining = Math.max(0, tokensLimit - row.tokensUsed);
  const requestsRemaining = Math.max(0, requestsLimit - row.requestsUsed);

  if (requestsRemaining <= 0 || tokensRemaining <= 0 || tokensRemaining < estimate) {
    return {
      ok: false,
      code: "FREE_TIER_EXHAUSTED",
      error: buildFreeTierExhaustedMessage(resetsAt),
      resetsAt: resetsAt.toISOString(),
      resetsAtLabel,
      tokensUsed: row.tokensUsed,
      tokensLimit,
      requestsUsed: row.requestsUsed,
      requestsLimit,
    };
  }

  return { ok: true, tokensRemaining, requestsRemaining, resetsAt, resetsAtLabel };
}

export async function recordFreeTierUsage(params: {
  userId: string;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  fallbackTokens?: number;
}): Promise<void> {
  const periodKey = getFreeTierPeriodKey();
  const prompt = params.usage?.prompt_tokens ?? 0;
  const completion = params.usage?.completion_tokens ?? 0;
  const total =
    params.usage?.total_tokens && params.usage.total_tokens > 0
      ? params.usage.total_tokens
      : prompt + completion > 0
        ? prompt + completion
        : params.fallbackTokens ?? 500;

  await db.iaFreeTierDaily.upsert({
    where: { userId_periodKey: { userId: params.userId, periodKey } },
    create: { userId: params.userId, periodKey, tokensUsed: total, requestsUsed: 1 },
    update: { tokensUsed: { increment: total }, requestsUsed: { increment: 1 } },
  });
}

const FREE_MODEL_FALLBACK = [
  "google/gemini-2.5-flash-lite",
  "google/gemini-2.5-flash",
  "google/gemini-3.1-flash-lite",
  "meta/llama-3.2-1b",
  "meta/llama-3.1-8b",
];

const FREE_MODEL_PREFERENCES: Record<StudentIaModelRole, string[]> = {
  chat: [
    "google/gemini-2.5-flash-lite",
    "google/gemini-2.5-flash",
    "google/gemini-3.1-flash-lite",
    "meta/llama-3.2-1b",
    "meta/llama-3.1-8b",
    "meta/llama-3.3-70b",
  ],
  heavy: [
    "google/gemini-2.5-flash",
    "google/gemini-2.5-flash-lite",
    "google/gemini-3-flash",
    "meta/llama-3.3-70b",
    "meta/llama-3.1-8b",
  ],
  cronograma: [
    "google/gemini-2.5-flash-lite",
    "google/gemini-2.5-flash",
    "meta/llama-3.2-1b",
    "meta/llama-3.1-8b",
  ],
};

function pickKnownModels(candidates: string[], known: Set<string>): string[] {
  return [...new Set(candidates)].filter((id) => known.has(id));
}

export async function listGatewayFreeModelIds(): Promise<string[]> {
  const envList = parseEnvModelList(process.env.IA_FREE_MODEL_ALLOWLIST);
  try {
    const catalog = await getCachedGatewayCatalog();
    const known = new Set(catalog.languageModelIds);
    const fromCatalog = catalog.priceRows.filter((r) => r.isGatewayListedFree).map((r) => r.modelId);
    const candidates = [...envList, ...fromCatalog, ...FREE_MODEL_FALLBACK];
    const valid = pickKnownModels(candidates, known);
    if (valid.length > 0) return valid.sort((a, b) => a.localeCompare(b));
  } catch {
    // catálogo remoto no disponible
  }
  return envList.length > 0 ? envList : FREE_MODEL_FALLBACK;
}

export async function resolveFreeTierModelForRole(role: StudentIaModelRole): Promise<string> {
  let known = new Set<string>();
  try {
    const catalog = await getCachedGatewayCatalog();
    known = new Set(catalog.languageModelIds);
  } catch {
    // sin catálogo: confiar en preferencias/fallback
  }

  const available = new Set(await listGatewayFreeModelIds());
  for (const id of FREE_MODEL_PREFERENCES[role]) {
    if (available.has(id) && (known.size === 0 || known.has(id))) return id;
  }
  for (const id of [...available].sort((a, b) => a.localeCompare(b))) {
    if (known.size === 0 || known.has(id)) return id;
  }
  const budgetDefault = process.env.IA_GATEWAY_MODEL_CHAT?.trim() || "google/gemini-2.5-flash-lite";
  if (known.size === 0 || known.has(budgetDefault)) return budgetDefault;
  const firstKnown = catalogFirstLanguageModel(known);
  if (firstKnown) return firstKnown;
  return budgetDefault;
}

function catalogFirstLanguageModel(known: Set<string>): string | null {
  for (const id of FREE_MODEL_FALLBACK) {
    if (known.has(id)) return id;
  }
  return [...known].sort((a, b) => a.localeCompare(b))[0] ?? null;
}
