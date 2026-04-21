/**
 * Importa un respaldo JSON (scripts/backup-mysql.ts) hacia PostgreSQL (Neon).
 * Requiere DATABASE_URL=postgresql://... y esquema aplicado: npx prisma db push
 *
 * Variables:
 * - IMPORT_BACKUP_DIR=ruta (opcional; por defecto la carpeta mysql-export-* más reciente)
 * - IMPORT_TRUNCATE_FIRST=1  vacía tablas de la app antes de importar
 *
 * Uso: npx tsx scripts/import-mysql-json-to-neon.ts
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const BATCH = 120;

const db = new PrismaClient();

function latestBackupDir(): string {
  const root = path.join(process.cwd(), "backups");
  if (!fs.existsSync(root)) throw new Error(`No existe ${root}`);
  const dirs = fs
    .readdirSync(root)
    .filter((d) => d.startsWith("mysql-export-"))
    .sort()
    .reverse();
  if (!dirs.length) throw new Error("No hay carpetas mysql-export-* en backups/");
  return path.join(root, dirs[0]!);
}

function readJson<T>(dir: string, fileBase: string): T[] {
  const p = path.join(dir, `${fileBase}.json`);
  if (!fs.existsSync(p)) {
    console.warn(`No existe ${fileBase}.json, se omite.`);
    return [];
  }
  return JSON.parse(fs.readFileSync(p, "utf-8")) as T[];
}

function toBool(v: unknown): boolean {
  return v === true || v === 1 || v === "1";
}

function toDate(v: unknown): Date | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === "string" && v.length) return new Date(v);
  return null;
}

function toInt(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && !Number.isNaN(v)) return Math.trunc(v);
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toFloat(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Convierte fila MySQL exportada a objeto válido para createMany de User */
function mapUser(r: Record<string, unknown>) {
  return {
    id: r.id as string,
    name: r.name as string,
    email: r.email as string,
    emailVerified: toDate(r.emailVerified),
    isEmailVerified: toBool(r.isEmailVerified),
    image: (r.image as string | null) ?? undefined,
    password: r.password as string | null,
    role: r.role as "CLIENT" | "ADMIN",
    isTwoFactorEnabled: toBool(r.isTwoFactorEnabled),
    twoFactorPreferredMethod: (r.twoFactorPreferredMethod as string) ?? "TOTP",
    twoFactorEmailFallbackEnabled: toBool(r.twoFactorEmailFallbackEnabled ?? 1),
    createdAt: toDate(r.createdAt) ?? new Date(),
    updatedAt: toDate(r.updatedAt) ?? new Date(),
    apellido: r.apellido as string | null,
    ciudadDeResidencia: r.ciudadDeResidencia as string | null,
    estadoDeResidencia: (r.estadoDeResidencia as string | null | undefined) ?? undefined,
    onboardingStatus: r.onboardingStatus as "PENDIENTE" | "FINALIZADO" | "CANCELADO",
    telefono: r.telefono as string | null,
    expediente: r.expediente as string | null,
    materiasActuales: r.materiasActuales as string | null,
    semestreActual: r.semestreActual as string | null,
    semestreActualManual: toBool(r.semestreActualManual ?? 0),
    universidadId: r.universidadId as string | null,
    carreraId: r.carreraId as string | null,
  };
}

async function clearDatabase() {
  console.log("Vaciando tablas (orden por FKs)…");
  const steps = [
    () => db.aiUsageLog.deleteMany(),
    () => db.paymentRecord.deleteMany(),
    () => db.manualPayment.deleteMany(),
    () => db.favorito.deleteMany(),
    () => db.metaAcademica.deleteMany(),
    () => db.descargaRecurso.deleteMany(),
    () => db.vistaRecurso.deleteMany(),
    () => db.comentarioRecurso.deleteMany(),
    () => db.calificacionRecurso.deleteMany(),
    () => db.tesisDocumento.deleteMany(),
    () => db.recurso.deleteMany(),
    () => db.notification.deleteMany(),
    () => db.curso.deleteMany(),
    () => db.blogPost.deleteMany(),
    () => db.materiaEstudiante.deleteMany(),
    () => db.pensumVersion.deleteMany(),
    () => db.userSubscription.deleteMany(),
    () => db.stripeCustomer.deleteMany(),
    () => db.twoFactorToken.deleteMany(),
    () => db.passwordResetToken.deleteMany(),
    () => db.verificationToken.deleteMany(),
    () => db.account.deleteMany(),
    () => db.twoFactorConfirmation.deleteMany(),
    () => db.passkey.deleteMany(),
    () => db.twoFactor.deleteMany(),
    () => db.authSession.deleteMany(),
    () => db.authAccount.deleteMany(),
    () => db.authVerification.deleteMany(),
    () => db.materiaPrerrequisito.deleteMany(),
    () => db.materia.deleteMany(),
    () => db.user.deleteMany(),
    () => db.carrera.deleteMany(),
    () => db.universidad.deleteMany(),
    () => db.blogCategory.deleteMany(),
    () => db.subscriptionType.deleteMany(),
    () => db.bibliotecaObra.deleteMany(),
  ];
  for (const run of steps) await run();
}

async function createManyBatched<T>(
  label: string,
  rows: T[],
  insert: (batch: T[]) => Promise<unknown>
) {
  if (!rows.length) {
    console.log(`  ${label}: 0 filas`);
    return;
  }
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    await insert(batch);
  }
  console.log(`  ${label}: ${rows.length} filas`);
}

async function main() {
  const url = process.env.DATABASE_URL?.trim() ?? "";
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    throw new Error("DATABASE_URL debe ser PostgreSQL (Neon).");
  }

  const dir = process.env.IMPORT_BACKUP_DIR?.trim() || latestBackupDir();
  if (!fs.existsSync(dir)) throw new Error(`Carpeta no encontrada: ${dir}`);
  console.log(`Importando desde: ${dir}\n`);

  if (process.env.IMPORT_TRUNCATE_FIRST === "1" || process.env.IMPORT_TRUNCATE_FIRST === "true") {
    await clearDatabase();
  }

  const subscriptionTypes = readJson<Record<string, unknown>>(dir, "SubscriptionType");
  await createManyBatched("SubscriptionType", subscriptionTypes, (b) =>
    db.subscriptionType.createMany({ data: b as never[], skipDuplicates: true })
  );

  const blogCategories = readJson<Record<string, unknown>>(dir, "BlogCategory");
  await createManyBatched("BlogCategory", blogCategories, (b) =>
    db.blogCategory.createMany({ data: b as never[], skipDuplicates: true })
  );

  const universidades = readJson<Record<string, unknown>>(dir, "Universidad").map((r) => ({
    ...r,
    isActive: toBool(r.isActive ?? 1),
  }));
  await createManyBatched("Universidad", universidades, (b) =>
    db.universidad.createMany({ data: b as never[], skipDuplicates: true })
  );

  const carreras = readJson<Record<string, unknown>>(dir, "Carrera").map((r) => ({
    ...r,
    isActive: toBool(r.isActive ?? 1),
  }));
  await createManyBatched("Carrera", carreras, (b) =>
    db.carrera.createMany({ data: b as never[], skipDuplicates: true })
  );

  const materias = readJson<Record<string, unknown>>(dir, "Materia").map((r) => ({
    ...r,
    isActive: toBool(r.isActive ?? 1),
  }));
  await createManyBatched("Materia", materias, (b) =>
    db.materia.createMany({ data: b as never[], skipDuplicates: true })
  );

  const materiaPrerrequisitos = readJson<Record<string, unknown>>(dir, "MateriaPrerrequisito");
  await createManyBatched("MateriaPrerrequisito", materiaPrerrequisitos, (b) =>
    db.materiaPrerrequisito.createMany({ data: b as never[], skipDuplicates: true })
  );

  const usersRaw = readJson<Record<string, unknown>>(dir, "User");
  const users = usersRaw.map(mapUser);
  await createManyBatched("User", users, (b) => db.user.createMany({ data: b as never[], skipDuplicates: true }));

  const baVerification = readJson<Record<string, unknown>>(dir, "ba_verification");
  await createManyBatched("AuthVerification", baVerification, (b) =>
    db.authVerification.createMany({ data: b as never[], skipDuplicates: true })
  );

  const baAccount = readJson<Record<string, unknown>>(dir, "ba_account");
  await createManyBatched("AuthAccount", baAccount, (b) =>
    db.authAccount.createMany({ data: b as never[], skipDuplicates: true })
  );

  const baSession = readJson<Record<string, unknown>>(dir, "ba_session");
  await createManyBatched("AuthSession", baSession, (b) =>
    db.authSession.createMany({ data: b as never[], skipDuplicates: true })
  );

  const baTwoFactor = readJson<Record<string, unknown>>(dir, "ba_twoFactor");
  await createManyBatched("TwoFactor", baTwoFactor, (b) =>
    db.twoFactor.createMany({ data: b as never[], skipDuplicates: true })
  );

  const passkeys = readJson<Record<string, unknown>>(dir, "passkey").map((r) => ({
    ...r,
    backedUp: toBool(r.backedUp),
    createdAt: toDate(r.createdAt),
  }));
  await createManyBatched("Passkey", passkeys, (b) =>
    db.passkey.createMany({ data: b as never[], skipDuplicates: true })
  );

  const twoFactorConfirmations = readJson<Record<string, unknown>>(dir, "TwoFactorConfirmation");
  await createManyBatched("TwoFactorConfirmation", twoFactorConfirmations, (b) =>
    db.twoFactorConfirmation.createMany({ data: b as never[], skipDuplicates: true })
  );

  const accounts = readJson<Record<string, unknown>>(dir, "Account");
  await createManyBatched("Account", accounts, (b) =>
    db.account.createMany({ data: b as never[], skipDuplicates: true })
  );

  const verificationTokens = readJson<Record<string, unknown>>(dir, "VerificationToken");
  await createManyBatched("VerificationToken", verificationTokens, (b) =>
    db.verificationToken.createMany({ data: b as never[], skipDuplicates: true })
  );

  const passwordResetTokens = readJson<Record<string, unknown>>(dir, "PasswordResetToken");
  await createManyBatched("PasswordResetToken", passwordResetTokens, (b) =>
    db.passwordResetToken.createMany({ data: b as never[], skipDuplicates: true })
  );

  const twoFactorTokens = readJson<Record<string, unknown>>(dir, "TwoFactorToken");
  await createManyBatched("TwoFactorToken", twoFactorTokens, (b) =>
    db.twoFactorToken.createMany({ data: b as never[], skipDuplicates: true })
  );

  const stripeCustomers = readJson<Record<string, unknown>>(dir, "StripeCustomer");
  await createManyBatched("StripeCustomer", stripeCustomers, (b) =>
    db.stripeCustomer.createMany({ data: b as never[], skipDuplicates: true })
  );

  const userSubscriptions = readJson<Record<string, unknown>>(dir, "UserSubscription");
  await createManyBatched("UserSubscription", userSubscriptions, (b) =>
    db.userSubscription.createMany({ data: b as never[], skipDuplicates: true })
  );

  const pensumRows = readJson<Record<string, unknown>>(dir, "PensumVersion").map((r) => {
    let snapshot = r.snapshot;
    if (typeof snapshot === "string") {
      try {
        snapshot = JSON.parse(snapshot);
      } catch {
        snapshot = [];
      }
    }
    return { ...r, snapshot };
  });
  await createManyBatched("PensumVersion", pensumRows, (b) =>
    db.pensumVersion.createMany({ data: b as never[], skipDuplicates: true })
  );

  const materiaEstudiantes = readJson<Record<string, unknown>>(dir, "MateriaEstudiante").map((r) => ({
    ...r,
    nota: toFloat(r.nota),
    fechaInicio: toDate(r.fechaInicio),
    fechaFin: toDate(r.fechaFin),
  }));
  await createManyBatched("MateriaEstudiante", materiaEstudiantes, (b) =>
    db.materiaEstudiante.createMany({ data: b as never[], skipDuplicates: true })
  );

  const blogPosts = readJson<Record<string, unknown>>(dir, "BlogPost").map((r) => ({
    ...r,
    isPublished: toBool(r.isPublished),
  }));
  await createManyBatched("BlogPost", blogPosts, (b) =>
    db.blogPost.createMany({ data: b as never[], skipDuplicates: true })
  );

  const cursos = readJson<Record<string, unknown>>(dir, "Curso");
  await createManyBatched("Curso", cursos, (b) => db.curso.createMany({ data: b as never[], skipDuplicates: true }));

  const notifications = readJson<Record<string, unknown>>(dir, "Notification").map((r) => ({
    ...r,
    read: toBool(r.read),
  }));
  await createManyBatched("Notification", notifications, (b) =>
    db.notification.createMany({ data: b as never[], skipDuplicates: true })
  );

  const recursos = readJson<Record<string, unknown>>(dir, "Recurso").map((r) => ({
    ...r,
    esPublico: toBool(r.esPublico),
    esAnonimo: toBool(r.esAnonimo),
    archivoSizeBytes: toInt(r.archivoSizeBytes),
  }));
  await createManyBatched("Recurso", recursos, (b) =>
    db.recurso.createMany({ data: b as never[], skipDuplicates: true })
  );

  const biblioteca = readJson<Record<string, unknown>>(dir, "BibliotecaObra").map((r) => ({
    ...r,
    isPublished: toBool(r.isPublished),
  }));
  await createManyBatched("BibliotecaObra", biblioteca, (b) =>
    db.bibliotecaObra.createMany({ data: b as never[], skipDuplicates: true })
  );

  const tesis = readJson<Record<string, unknown>>(dir, "TesisDocumento");
  await createManyBatched("TesisDocumento", tesis, (b) =>
    db.tesisDocumento.createMany({ data: b as never[], skipDuplicates: true })
  );

  const calificaciones = readJson<Record<string, unknown>>(dir, "CalificacionRecurso");
  await createManyBatched("CalificacionRecurso", calificaciones, (b) =>
    db.calificacionRecurso.createMany({ data: b as never[], skipDuplicates: true })
  );

  const comentarios = readJson<Record<string, unknown>>(dir, "ComentarioRecurso").map((r) => ({
    ...r,
    esRespuesta: toBool(r.esRespuesta),
  }));
  await createManyBatched("ComentarioRecurso", comentarios, (b) =>
    db.comentarioRecurso.createMany({ data: b as never[], skipDuplicates: true })
  );

  const vistas = readJson<Record<string, unknown>>(dir, "VistaRecurso");
  await createManyBatched("VistaRecurso", vistas, (b) =>
    db.vistaRecurso.createMany({ data: b as never[], skipDuplicates: true })
  );

  const descargas = readJson<Record<string, unknown>>(dir, "DescargaRecurso");
  await createManyBatched("DescargaRecurso", descargas, (b) =>
    db.descargaRecurso.createMany({ data: b as never[], skipDuplicates: true })
  );

  const favoritos = readJson<Record<string, unknown>>(dir, "Favorito");
  await createManyBatched("Favorito", favoritos, (b) =>
    db.favorito.createMany({ data: b as never[], skipDuplicates: true })
  );

  const metas = readJson<Record<string, unknown>>(dir, "MetaAcademica").map((r) => ({
    ...r,
    completada: toBool(r.completada),
    valorObjetivo: toFloat(r.valorObjetivo) ?? 0,
    valorActual: toFloat(r.valorActual) ?? 0,
    fechaLimite: toDate(r.fechaLimite),
  }));
  await createManyBatched("MetaAcademica", metas, (b) =>
    db.metaAcademica.createMany({ data: b as never[], skipDuplicates: true })
  );

  const manualPayments = readJson<Record<string, unknown>>(dir, "ManualPayment").map((r) => ({
    ...r,
    reviewedAt: toDate(r.reviewedAt),
  }));
  await createManyBatched("ManualPayment", manualPayments, (b) =>
    db.manualPayment.createMany({ data: b as never[], skipDuplicates: true })
  );

  const paymentRecords = readJson<Record<string, unknown>>(dir, "PaymentRecord").map((r) => ({
    ...r,
    periodStart: toDate(r.periodStart),
    periodEnd: toDate(r.periodEnd),
    paidAt: toDate(r.paidAt),
    amountBs: toInt(r.amountBs),
    amountUsdCents: toInt(r.amountUsdCents),
  }));
  await createManyBatched("PaymentRecord", paymentRecords, (b) =>
    db.paymentRecord.createMany({ data: b as never[], skipDuplicates: true })
  );

  const aiLogs = readJson<Record<string, unknown>>(dir, "AiUsageLog").map((r) => ({
    ...r,
    promptTokens: toInt(r.promptTokens) ?? 0,
    completionTokens: toInt(r.completionTokens) ?? 0,
    totalTokens: toInt(r.totalTokens) ?? 0,
  }));
  await createManyBatched("AiUsageLog", aiLogs, (b) =>
    db.aiUsageLog.createMany({ data: b as never[], skipDuplicates: true })
  );

  console.log("\nImportación terminada.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
