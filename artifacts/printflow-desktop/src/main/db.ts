import Database from "better-sqlite3";
import { app } from "electron";
import path from "path";
import fs from "fs";

const dbDir = app.getPath("userData");
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
const dbPath = path.join(dbDir, "printflow.db");

export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    bw_a4_price REAL NOT NULL DEFAULT 2,
    bw_a3_price REAL NOT NULL DEFAULT 4,
    color_a4_price REAL NOT NULL DEFAULT 10,
    color_a3_price REAL NOT NULL DEFAULT 20,
    glossy_price REAL NOT NULL DEFAULT 25,
    photo_price REAL NOT NULL DEFAULT 30,
    auto_sync_enabled INTEGER NOT NULL DEFAULT 0,
    sync_interval INTEGER NOT NULL DEFAULT 60
  );

  INSERT OR IGNORE INTO settings (id) VALUES (1);

  CREATE TABLE IF NOT EXISTS print_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    print_date TEXT NOT NULL,
    print_time TEXT NOT NULL,
    printer_name TEXT NOT NULL,
    pages INTEGER NOT NULL,
    print_type TEXT NOT NULL,
    paper_size TEXT NOT NULL,
    paper_type TEXT NOT NULL,
    rate REAL NOT NULL,
    amount REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sync_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    last_sync_time TEXT,
    records_synced INTEGER NOT NULL DEFAULT 0
  );

  INSERT OR IGNORE INTO sync_state (id) VALUES (1);
`);

// Settings helpers
export function getSettings() {
  return db.prepare("SELECT * FROM settings WHERE id = 1").get() as any;
}

export function updateSettings(updates: Record<string, unknown>) {
  const keys = Object.keys(updates);
  if (keys.length === 0) return getSettings();
  const cols = keys.map((k) => `${camel2snake(k)} = ?`).join(", ");
  const vals = keys.map((k) => updates[k]);
  db.prepare(`UPDATE settings SET ${cols} WHERE id = 1`).run(...vals);
  return getSettings();
}

// Print jobs helpers
export function insertPrintJob(data: {
  printDate: string;
  printTime: string;
  printerName: string;
  pages: number;
  printType: string;
  paperSize: string;
  paperType: string;
  rate: number;
  amount: number;
}) {
  const stmt = db.prepare(
    `INSERT INTO print_jobs (print_date, print_time, printer_name, pages, print_type, paper_size, paper_type, rate, amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  const result = stmt.run(
    data.printDate, data.printTime, data.printerName, data.pages,
    data.printType, data.paperSize, data.paperType, data.rate, data.amount
  );
  return db.prepare("SELECT * FROM print_jobs WHERE id = ?").get(result.lastInsertRowid) as any;
}

export function mapJob(j: any) {
  return {
    id: j.id,
    createdAt: j.created_at,
    printDate: j.print_date,
    printTime: j.print_time,
    printerName: j.printer_name,
    pages: j.pages,
    printType: j.print_type,
    paperSize: j.paper_size,
    paperType: j.paper_type,
    rate: j.rate,
    amount: j.amount,
  };
}

function camel2snake(str: string) {
  return str.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}
