import { db, isDatabaseUnreachableError } from "@/lib/db";
import { expandPic18ProgressPayload } from "@/lib/aprende-pic18/expand-progress-payload";

function isMissingAprendeTableError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return /does not exist|relation.*does not exist|P2021|P2010|aprende_cpp_poo|aprende_pic18/i.test(
    msg,
  );
}

export type AprendeProgressRow = {
  payload: unknown;
  updatedAt: Date | null;
};

export async function getAprendeProgressForUser(userId: string): Promise<{
  pic18: AprendeProgressRow;
  cpp: AprendeProgressRow;
}> {
  const empty: AprendeProgressRow = { payload: null, updatedAt: null };

  let pic18: AprendeProgressRow = { ...empty };
  let cpp: AprendeProgressRow = { ...empty };

  try {
    const row = await db.aprendePic18Progress.findUnique({
      where: { userId },
      select: { payload: true, updatedAt: true },
    });
    pic18 = {
      payload: row?.payload ? expandPic18ProgressPayload(row.payload) : null,
      updatedAt: row?.updatedAt ?? null,
    };
  } catch (e) {
    if (isMissingAprendeTableError(e)) {
      console.warn("[aprende-progress] Tabla PIC18 no disponible:", e);
    } else if (isDatabaseUnreachableError(e)) {
      console.warn("[aprende-progress] BD no alcanzable, progreso PIC18 omitido");
    } else {
      throw e;
    }
  }

  try {
    const row = await db.aprendeCppPooProgress.findUnique({
      where: { userId },
      select: { payload: true, updatedAt: true },
    });
    cpp = { payload: row?.payload ?? null, updatedAt: row?.updatedAt ?? null };
  } catch (e) {
    if (isMissingAprendeTableError(e)) {
      console.warn("[aprende-progress] Tabla C++ POO no disponible:", e);
    } else if (isDatabaseUnreachableError(e)) {
      console.warn("[aprende-progress] BD no alcanzable, progreso C++ omitido");
    } else {
      throw e;
    }
  }

  return { pic18, cpp };
}

/** Atajo para la pestaña Aprende en home (solo payload). */
export async function getAprendeProgressPayloadsForUser(userId: string): Promise<{
  pic18Payload: unknown;
  cppPayload: unknown;
}> {
  const { pic18, cpp } = await getAprendeProgressForUser(userId);
  return { pic18Payload: pic18.payload, cppPayload: cpp.payload };
}
