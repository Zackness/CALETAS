import { PrismaClient } from "@prisma/client";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
} from "@prisma/client/runtime/library";

/** Misma instancia entre recargas (dev) y entre invocaciones calientes (p. ej. serverless). */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/** Dentro de `$transaction(fn)` Prisma marca los args; reintentar aquí invalida el id (P2028). */
const PRISMA_ITX_ID_SYMBOL = Symbol.for("prisma.client.transaction.id");

function hasInteractiveTransactionId(args: unknown): boolean {
  if (typeof args !== "object" || args === null) return false;
  const id = (args as Record<symbol, unknown>)[PRISMA_ITX_ID_SYMBOL];
  return id !== undefined && id !== null;
}

const TRANSIENT_PRISMA_CODES = new Set<string>([
  "P1017", // Server has closed the connection
  "P1001", // Can't reach database server
  "P1008", // Operations timed out
  "P2024", // Timed out fetching a new connection from the connection pool
]);

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error ?? "");
}

/** True si el fallo suele ser temporal (Neon dormido, red, pool). */
export function isTransientDatabaseError(error: unknown): boolean {
  if (error instanceof PrismaClientKnownRequestError) {
    if (TRANSIENT_PRISMA_CODES.has(error.code)) return true;
  }
  if (error instanceof PrismaClientInitializationError) {
    const m = error.message;
    return /can't reach|database server|connect|timeout|ECONNREFUSED|ENOTFOUND|network|closed the connection/i.test(
      m,
    );
  }
  const msg = errorMessage(error);
  if (/can't reach database server/i.test(msg)) return true;
  if (/server has closed the connection/i.test(msg)) return true;
  if (/connection reset/i.test(msg)) return true;
  if (/econnreset/i.test(msg)) return true;
  if (/timeout/i.test(msg) && /prisma|database|connect/i.test(msg)) return true;
  return false;
}

/** Para mensajes al usuario (layout, error boundary). */
export function isDatabaseUnreachableError(error: unknown): boolean {
  if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P1001" || error.code === "P1008" || error.code === "P2024") return true;
  }
  if (error instanceof PrismaClientInitializationError) {
    return /can't reach|database server|ECONNREFUSED|ENOTFOUND|getaddrinfo/i.test(error.message);
  }
  const msg = errorMessage(error);
  return /can't reach database server|database server at|ECONNREFUSED|ENOTFOUND|getaddrinfo/i.test(msg);
}

function backoffMsForAttempt(attempt: number, error: unknown): number {
  const code = error instanceof PrismaClientKnownRequestError ? error.code : "";
  const init =
    error instanceof PrismaClientInitializationError &&
    /can't reach|database server|ECONNREFUSED|ENOTFOUND|getaddrinfo/i.test(error.message);
  // Neon al despertar o red inestable: esperar más al principio.
  if (code === "P1001" || code === "P1008" || code === "P2024" || init) {
    return Math.min(6000, 450 * 2 ** (attempt - 1));
  }
  return Math.min(2500, 80 * 2 ** (attempt - 1));
}

async function runWithTransientRetry<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const maxAttempts = process.env.NODE_ENV === "production" ? 8 : 10;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientDatabaseError(error) || attempt === maxAttempts) {
        throw error;
      }
      const backoffMs = backoffMsForAttempt(attempt, error);
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[prisma] Reintentando ${operation} (${attempt}/${maxAttempts - 1}) en ${backoffMs}ms:`,
          errorMessage(error).slice(0, 200),
        );
      }
      await sleep(backoffMs);
    }
  }
  throw lastError;
}

function assertPostgresDatabaseUrl() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("Falta DATABASE_URL en el entorno.");
  }
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URL debe ser PostgreSQL (postgresql:// o postgres://), por ejemplo la conexión de Neon."
    );
  }
}

function createPrismaClient() {
  assertPostgresDatabaseUrl();
  const base = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return base.$extends({
    query: {
      $allOperations({ operation, model, args, query }) {
        const label = model ? `${model}.${operation}` : operation;
        if (hasInteractiveTransactionId(args)) {
          return query(args);
        }
        return runWithTransientRetry(label, () => query(args));
      },
    },
  }) as unknown as PrismaClient;
}

const prismaDevFresh = process.env.NODE_ENV === "development";

export const db = prismaDevFresh ? createPrismaClient() : globalForPrisma.prisma ?? createPrismaClient();

if (!prismaDevFresh && !globalForPrisma.prisma) {
  globalForPrisma.prisma = db;
}
