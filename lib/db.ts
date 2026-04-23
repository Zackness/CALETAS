import { PrismaClient } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const TRANSIENT_PRISMA_CODES = new Set<string>([
  "P1017", // Server has closed the connection
  "P1001", // Can't reach database server
  "P1008", // Operations timed out
]);

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isTransientPrismaError(error: unknown): boolean {
  if (error instanceof PrismaClientKnownRequestError) {
    if (TRANSIENT_PRISMA_CODES.has(error.code)) return true;
    const msg = String(error.message ?? "");
    if (/server has closed the connection/i.test(msg)) return true;
    if (/connection reset/i.test(msg)) return true;
    if (/econnreset/i.test(msg)) return true;
  }
  if (error instanceof Error) {
    const msg = error.message;
    if (/server has closed the connection/i.test(msg)) return true;
    if (/connection reset/i.test(msg)) return true;
    if (/econnreset/i.test(msg)) return true;
  }
  return false;
}

async function runWithTransientRetry<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const maxAttempts = 4;
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (!isTransientPrismaError(error) || attempt === maxAttempts) {
        throw error;
      }
      const backoffMs = 75 * 2 ** (attempt - 1);
      if (process.env.NODE_ENV === "development") {
        console.warn(
          `[prisma] Reintentando ${operation} tras error transitorio (intento ${attempt}/${maxAttempts - 1}) en ${backoffMs}ms`
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
        return runWithTransientRetry(label, () => query(args));
      },
    },
  }) as unknown as PrismaClient;
}

export const db = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;