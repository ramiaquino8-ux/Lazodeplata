import { DatabaseSync, type SQLInputValue } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";

const dataDir =
  process.env.LAZO_DATA_DIR ?? path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "lazodeplata.db");

export const db = new DatabaseSync(dbPath);

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec("PRAGMA busy_timeout = 8000;");

export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
  const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
  return rows.map((r) => ({ ...r })) as T[];
}

export function get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
  const row = db.prepare(sql).get(...params) as Record<string, unknown> | undefined;
  return row ? ({ ...row } as T) : undefined;
}

export function run(
  sql: string,
  ...params: SQLInputValue[]
): { lastInsertRowid: number; changes: number } {
  const res = db.prepare(sql).run(...params);
  return { lastInsertRowid: Number(res.lastInsertRowid), changes: Number(res.changes) };
}

export function transaccion<T>(fn: () => T): T {
  db.exec("BEGIN IMMEDIATE;");
  try {
    const res = fn();
    db.exec("COMMIT;");
    return res;
  } catch (e) {
    db.exec("ROLLBACK;");
    throw e;
  }
}