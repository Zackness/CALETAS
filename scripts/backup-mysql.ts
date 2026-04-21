/**
 * Respaldo completo de MySQL (legado) en JSON por tabla.
 * Mismo enfoque que unexpo-comedor/scripts/backup-mysql-url1.ts.
 *
 * Origen de URL (en orden):
 * - MYSQL_BACKUP_URL si es mysql://
 * - DATABASE_URL_1 si es mysql:// (nombre usado en .env de Caletas)
 * - DATABASE_URL1 si es mysql://
 * - DATABASE_URL si es mysql://
 *
 * Con Neon en DATABASE_URL, define MYSQL_BACKUP_URL o DATABASE_URL1 con la
 * URL MySQL legada solo para exportar.
 *
 * Uso: npm run backup:mysql
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import mysql from "mysql2/promise";
import type { RowDataPacket } from "mysql2";

function resolveMysqlUrl(): string {
  const candidates = [
    process.env.MYSQL_BACKUP_URL?.trim(),
    process.env.DATABASE_URL_1?.trim(),
    process.env.DATABASE_URL1?.trim(),
    process.env.DATABASE_URL?.trim(),
  ];
  for (const u of candidates) {
    if (u?.startsWith("mysql://")) return u;
  }
  throw new Error(
    "No hay URL MySQL: define MYSQL_BACKUP_URL, DATABASE_URL_1 o DATABASE_URL1 con mysql:// (con Neon en DATABASE_URL usa DATABASE_URL_1 para el legado)."
  );
}

function parseMysqlUrl(urlStr: string) {
  const u = new URL(urlStr.trim());
  if (u.protocol !== "mysql:") {
    throw new Error(`Se esperaba mysql:// (recibido: ${u.protocol})`);
  }
  const database = u.pathname.replace(/^\//, "").split("?")[0];
  if (!database) {
    throw new Error("La URL debe incluir el nombre de la base de datos.");
  }
  return {
    host: u.hostname,
    port: u.port ? Number(u.port) : 3306,
    user: decodeURIComponent(u.username),
    password: decodeURIComponent(u.password),
    database,
  };
}

function jsonReplacer(_key: string, value: unknown) {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Date) return value.toISOString();
  if (Buffer.isBuffer(value)) return { __type: "Buffer", base64: value.toString("base64") };
  return value;
}

async function main() {
  const urlStr = resolveMysqlUrl();
  const cfg = parseMysqlUrl(urlStr);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const outDir = path.join(process.cwd(), "backups", `mysql-export-${timestamp}`);
  fs.mkdirSync(outDir, { recursive: true });

  console.log(`Conectando a MySQL: ${cfg.user}@${cfg.host}:${cfg.port}/${cfg.database}`);
  const conn = await mysql.createConnection({
    ...cfg,
    multipleStatements: false,
  });

  const [tablesRows] = await conn.query<RowDataPacket[]>(
    "SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME",
    [cfg.database]
  );

  const tables = tablesRows.map((r) => String(r.name));
  const rowCounts: Record<string, number> = {};

  for (const table of tables) {
    const safeTable = table.replace(/[^a-zA-Z0-9_]/g, "");
    if (safeTable !== table) {
      console.warn(`Omitiendo tabla con nombre no seguro: ${table}`);
      continue;
    }
    const [rows] = await conn.query<RowDataPacket[]>(`SELECT * FROM \`${safeTable}\``);
    rowCounts[table] = rows.length;
    const filePath = path.join(outDir, `${safeTable}.json`);
    fs.writeFileSync(filePath, JSON.stringify(rows, jsonReplacer, 2), "utf-8");
    console.log(`  ${table}: ${rows.length} filas → ${path.relative(process.cwd(), filePath)}`);
  }

  await conn.end();

  const manifest = {
    exportedAt: new Date().toISOString(),
    source: "mysql",
    database: cfg.database,
    host: cfg.host,
    tables,
    rowCounts,
    note: "Respaldo para migración a PostgreSQL/Neon. No publicar en repositorios.",
  };
  fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2), "utf-8");

  console.log("\nListo.");
  console.log(`Carpeta: ${outDir}`);
  console.log(`Tablas: ${tables.length}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
