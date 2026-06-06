import express from "express";
import cors from "cors";
import { db, getSettings, updateSettings, insertPrintJob, mapJob } from "./db";

export const API_PORT = 51247;

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // Health
  app.get("/api/healthz", (_req, res) => {
    res.json({ status: "ok" });
  });

  // ── Settings ─────────────────────────────────────────────────────────────
  app.get("/api/settings", (_req, res) => {
    const s = getSettings();
    res.json({
      id: s.id,
      bwA4Price: s.bw_a4_price,
      bwA3Price: s.bw_a3_price,
      colorA4Price: s.color_a4_price,
      colorA3Price: s.color_a3_price,
      glossyPrice: s.glossy_price,
      photoPrice: s.photo_price,
      autoSyncEnabled: Boolean(s.auto_sync_enabled),
      syncInterval: s.sync_interval,
    });
  });

  app.put("/api/settings", (req, res) => {
    const body = req.body ?? {};
    const mapped: Record<string, unknown> = {};
    if (body.bwA4Price !== undefined) mapped.bwA4Price = body.bwA4Price;
    if (body.bwA3Price !== undefined) mapped.bwA3Price = body.bwA3Price;
    if (body.colorA4Price !== undefined) mapped.colorA4Price = body.colorA4Price;
    if (body.colorA3Price !== undefined) mapped.colorA3Price = body.colorA3Price;
    if (body.glossyPrice !== undefined) mapped.glossyPrice = body.glossyPrice;
    if (body.photoPrice !== undefined) mapped.photoPrice = body.photoPrice;
    if (body.autoSyncEnabled !== undefined) mapped.autoSyncEnabled = body.autoSyncEnabled ? 1 : 0;
    if (body.syncInterval !== undefined) mapped.syncInterval = body.syncInterval;

    // Convert camelCase to snake_case for DB
    const dbMapped: Record<string, unknown> = {};
    const map: Record<string, string> = {
      bwA4Price: "bw_a4_price", bwA3Price: "bw_a3_price",
      colorA4Price: "color_a4_price", colorA3Price: "color_a3_price",
      glossyPrice: "glossy_price", photoPrice: "photo_price",
      autoSyncEnabled: "auto_sync_enabled", syncInterval: "sync_interval",
    };
    for (const [k, v] of Object.entries(mapped)) {
      if (map[k]) dbMapped[map[k]] = v;
    }
    if (Object.keys(dbMapped).length > 0) {
      const cols = Object.keys(dbMapped).map((k) => `${k} = ?`).join(", ");
      db.prepare(`UPDATE settings SET ${cols} WHERE id = 1`).run(...Object.values(dbMapped));
    }
    const s = getSettings();
    res.json({
      id: s.id, bwA4Price: s.bw_a4_price, bwA3Price: s.bw_a3_price,
      colorA4Price: s.color_a4_price, colorA3Price: s.color_a3_price,
      glossyPrice: s.glossy_price, photoPrice: s.photo_price,
      autoSyncEnabled: Boolean(s.auto_sync_enabled), syncInterval: s.sync_interval,
    });
  });

  // ── Print Jobs ────────────────────────────────────────────────────────────
  app.get("/api/print-jobs", (req, res) => {
    const limit = parseInt(String(req.query.limit ?? 50));
    const offset = parseInt(String(req.query.offset ?? 0));
    let where = "1=1";
    const params: unknown[] = [];
    if (req.query.dateFrom) { where += " AND print_date >= ?"; params.push(req.query.dateFrom); }
    if (req.query.dateTo)   { where += " AND print_date <= ?"; params.push(req.query.dateTo); }
    if (req.query.printType){ where += " AND print_type = ?";  params.push(req.query.printType); }
    if (req.query.paperType){ where += " AND paper_type = ?";  params.push(req.query.paperType); }
    const jobs = db.prepare(`SELECT * FROM print_jobs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as any[];
    const total = (db.prepare(`SELECT COUNT(*) as cnt FROM print_jobs WHERE ${where}`).get(...params) as any).cnt;
    res.json({ jobs: jobs.map(mapJob), total });
  });

  app.post("/api/print-jobs", (req, res) => {
    const { printerName, pages, printType, paperSize, paperType } = req.body;
    const s = getSettings();
    let rate = s.bw_a4_price;
    if (paperType === "Glossy") rate = s.glossy_price;
    else if (paperType === "Photo") rate = s.photo_price;
    else if (printType === "Color") rate = paperSize === "A3" ? s.color_a3_price : s.color_a4_price;
    else rate = paperSize === "A3" ? s.bw_a3_price : s.bw_a4_price;
    const amount = rate * pages;
    const now = new Date();
    const printDate = now.toISOString().split("T")[0];
    const hours = now.getHours();
    const mins = String(now.getMinutes()).padStart(2, "0");
    const ampm = hours >= 12 ? "PM" : "AM";
    const printTime = `${hours % 12 || 12}:${mins} ${ampm}`;
    const job = insertPrintJob({ printDate, printTime, printerName, pages, printType, paperSize, paperType, rate, amount });
    res.status(201).json(mapJob(job));
  });

  app.delete("/api/print-jobs/:id", (req, res) => {
    db.prepare("DELETE FROM print_jobs WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // ── Dashboard ─────────────────────────────────────────────────────────────
  function periodDates(period = "month") {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    let from: string, prevFrom: string, prevTo: string;
    if (period === "today") {
      from = today;
      const y = new Date(now); y.setDate(y.getDate() - 1);
      prevFrom = prevTo = y.toISOString().split("T")[0];
    } else if (period === "week") {
      const w = new Date(now); w.setDate(w.getDate() - 7);
      from = w.toISOString().split("T")[0];
      const pw = new Date(w); pw.setDate(pw.getDate() - 7);
      prevFrom = pw.toISOString().split("T")[0]; prevTo = from;
    } else if (period === "year") {
      from = `${now.getFullYear()}-01-01`;
      prevFrom = `${now.getFullYear() - 1}-01-01`; prevTo = `${now.getFullYear() - 1}-12-31`;
    } else {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      const pm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const pme = new Date(now.getFullYear(), now.getMonth(), 0);
      prevFrom = pm.toISOString().split("T")[0]; prevTo = pme.toISOString().split("T")[0];
    }
    return { from, to: today, prevFrom, prevTo };
  }

  app.get("/api/dashboard/stats", (req, res) => {
    const { from, to, prevFrom, prevTo } = periodDates(String(req.query.period ?? "month"));
    const q = (f: string, t: string) => db.prepare(`
      SELECT COALESCE(SUM(amount),0) AS rev, COALESCE(SUM(pages),0) AS pages, COUNT(*) AS jobs,
             COALESCE(SUM(CASE WHEN paper_type IN ('Glossy','Photo') THEN amount ELSE 0 END),0) AS glossy
      FROM print_jobs WHERE print_date >= ? AND print_date <= ?`).get(f, t) as any;
    const c = q(from, to), p = q(prevFrom, prevTo);
    const growth = (a: number, b: number) => b === 0 ? (a > 0 ? 100 : 0) : Math.round(((a - b) / b) * 100);
    res.json({
      totalRevenue: c.rev, totalPages: c.pages, totalJobs: c.jobs, glossyRevenue: c.glossy,
      revenueGrowth: growth(c.rev, p.rev), pagesGrowth: growth(c.pages, p.pages),
      jobsGrowth: growth(c.jobs, p.jobs), glossyGrowth: growth(c.glossy, p.glossy),
    });
  });

  app.get("/api/dashboard/daily-summary", (_req, res) => {
    const today = new Date().toISOString().split("T")[0];
    const r = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN print_type='BW' THEN pages ELSE 0 END),0) AS bw_pages,
        COALESCE(SUM(CASE WHEN print_type='Color' THEN pages ELSE 0 END),0) AS color_pages,
        COALESCE(SUM(CASE WHEN paper_type='Glossy' THEN pages ELSE 0 END),0) AS glossy_pages,
        COALESCE(SUM(CASE WHEN paper_type='Photo' THEN pages ELSE 0 END),0) AS photo_pages,
        COALESCE(SUM(pages),0) AS total_pages,
        COALESCE(SUM(CASE WHEN print_type='BW' THEN amount ELSE 0 END),0) AS bw_amount,
        COALESCE(SUM(CASE WHEN print_type='Color' THEN amount ELSE 0 END),0) AS color_amount,
        COALESCE(SUM(CASE WHEN paper_type='Glossy' THEN amount ELSE 0 END),0) AS glossy_amount,
        COALESCE(SUM(CASE WHEN paper_type='Photo' THEN amount ELSE 0 END),0) AS photo_amount,
        COALESCE(SUM(amount),0) AS total_amount
      FROM print_jobs WHERE print_date = ?`).get(today) as any;
    res.json({
      date: today,
      bwPages: r.bw_pages, colorPages: r.color_pages, glossyPages: r.glossy_pages, photoPages: r.photo_pages,
      totalPages: r.total_pages, bwAmount: r.bw_amount, colorAmount: r.color_amount,
      glossyAmount: r.glossy_amount, photoAmount: r.photo_amount, totalAmount: r.total_amount,
    });
  });

  app.get("/api/dashboard/recent-activity", (_req, res) => {
    const jobs = db.prepare("SELECT * FROM print_jobs ORDER BY created_at DESC LIMIT 20").all() as any[];
    res.json({ jobs: jobs.map(mapJob), total: jobs.length });
  });

  app.get("/api/dashboard/print-distribution", (req, res) => {
    const { from, to } = periodDates(String(req.query.period ?? "month"));
    const r = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN print_type='BW' THEN pages ELSE 0 END),0) AS bw,
        COALESCE(SUM(CASE WHEN print_type='Color' THEN pages ELSE 0 END),0) AS color,
        COALESCE(SUM(CASE WHEN paper_type='Glossy' THEN pages ELSE 0 END),0) AS glossy,
        COALESCE(SUM(CASE WHEN paper_type='Photo' THEN pages ELSE 0 END),0) AS photo
      FROM print_jobs WHERE print_date >= ? AND print_date <= ?`).get(from, to) as any;
    const total = r.bw + r.color + r.glossy + r.photo;
    const pct = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100);
    res.json({
      bwPercent: pct(r.bw), colorPercent: pct(r.color), glossyPercent: pct(r.glossy), photoPercent: pct(r.photo),
      bwPages: r.bw, colorPages: r.color, glossyPages: r.glossy, photoPages: r.photo,
    });
  });

  // ── Analytics ─────────────────────────────────────────────────────────────
  app.get("/api/analytics/revenue", (req, res) => {
    const view = String(req.query.view ?? "monthly");
    const now = new Date();
    const year = parseInt(String(req.query.year ?? now.getFullYear()));

    let data: any[] = [];
    if (view === "weekly") {
      const days: string[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now); d.setDate(d.getDate() - i);
        days.push(d.toISOString().split("T")[0]);
      }
      const rows = db.prepare(`
        SELECT print_date,
          COALESCE(SUM(CASE WHEN print_type='BW' THEN amount ELSE 0 END),0) AS bw,
          COALESCE(SUM(CASE WHEN print_type='Color' THEN amount ELSE 0 END),0) AS color,
          COALESCE(SUM(CASE WHEN paper_type='Glossy' THEN amount ELSE 0 END),0) AS glossy,
          COALESCE(SUM(CASE WHEN paper_type='Photo' THEN amount ELSE 0 END),0) AS photo
        FROM print_jobs WHERE print_date >= ? AND print_date <= ?
        GROUP BY print_date`).all(days[0], days[6]) as any[];
      const map = new Map(rows.map((r) => [r.print_date, r]));
      const dayNames = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
      data = days.map((d) => {
        const r = map.get(d);
        const bw = r?.bw ?? 0, color = r?.color ?? 0, glossy = r?.glossy ?? 0, photo = r?.photo ?? 0;
        return { label: dayNames[new Date(d + "T00:00:00").getDay()], bwAmount: bw, colorAmount: color, glossyAmount: glossy, photoAmount: photo, totalAmount: bw+color+glossy+photo };
      });
    } else if (view === "monthly") {
      const rows = db.prepare(`
        SELECT CAST(strftime('%m', print_date) AS INTEGER) AS mon,
          COALESCE(SUM(CASE WHEN print_type='BW' THEN amount ELSE 0 END),0) AS bw,
          COALESCE(SUM(CASE WHEN print_type='Color' THEN amount ELSE 0 END),0) AS color,
          COALESCE(SUM(CASE WHEN paper_type='Glossy' THEN amount ELSE 0 END),0) AS glossy,
          COALESCE(SUM(CASE WHEN paper_type='Photo' THEN amount ELSE 0 END),0) AS photo
        FROM print_jobs WHERE strftime('%Y', print_date) = ?
        GROUP BY mon`).all(String(year)) as any[];
      const map = new Map(rows.map((r) => [r.mon, r]));
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      data = months.map((label, i) => {
        const r = map.get(i + 1);
        const bw = r?.bw ?? 0, color = r?.color ?? 0, glossy = r?.glossy ?? 0, photo = r?.photo ?? 0;
        return { label, bwAmount: bw, colorAmount: color, glossyAmount: glossy, photoAmount: photo, totalAmount: bw+color+glossy+photo };
      });
    } else {
      const startYear = year - 4;
      const rows = db.prepare(`
        SELECT CAST(strftime('%Y', print_date) AS INTEGER) AS yr,
          COALESCE(SUM(CASE WHEN print_type='BW' THEN amount ELSE 0 END),0) AS bw,
          COALESCE(SUM(CASE WHEN print_type='Color' THEN amount ELSE 0 END),0) AS color,
          COALESCE(SUM(CASE WHEN paper_type='Glossy' THEN amount ELSE 0 END),0) AS glossy,
          COALESCE(SUM(CASE WHEN paper_type='Photo' THEN amount ELSE 0 END),0) AS photo
        FROM print_jobs WHERE print_date >= ? AND print_date <= ?
        GROUP BY yr`).all(`${startYear}-01-01`, `${year}-12-31`) as any[];
      const map = new Map(rows.map((r) => [r.yr, r]));
      data = Array.from({ length: 5 }, (_, i) => {
        const yr = startYear + i;
        const r = map.get(yr);
        const bw = r?.bw ?? 0, color = r?.color ?? 0, glossy = r?.glossy ?? 0, photo = r?.photo ?? 0;
        return { label: String(yr), bwAmount: bw, colorAmount: color, glossyAmount: glossy, photoAmount: photo, totalAmount: bw+color+glossy+photo };
      });
    }
    res.json({ view, totalRevenue: data.reduce((s, d) => s + d.totalAmount, 0), totalPages: 0, data });
  });

  app.get("/api/analytics/printers", (_req, res) => {
    const rows = db.prepare(`
      SELECT printer_name,
        COALESCE(SUM(pages),0) AS total_pages, COUNT(*) AS total_jobs,
        COALESCE(SUM(amount),0) AS total_revenue,
        COALESCE(SUM(CASE WHEN print_type='BW' THEN pages ELSE 0 END),0) AS bw_pages,
        COALESCE(SUM(CASE WHEN print_type='Color' THEN pages ELSE 0 END),0) AS color_pages,
        COALESCE(SUM(CASE WHEN paper_type='Glossy' THEN pages ELSE 0 END),0) AS glossy_pages,
        COALESCE(SUM(CASE WHEN paper_type='Photo' THEN pages ELSE 0 END),0) AS photo_pages
      FROM print_jobs GROUP BY printer_name ORDER BY total_revenue DESC`).all() as any[];
    res.json({
      printers: rows.map((r) => ({
        printerName: r.printer_name, totalPages: r.total_pages, totalJobs: r.total_jobs,
        totalRevenue: r.total_revenue, bwPages: r.bw_pages, colorPages: r.color_pages,
        glossyPages: r.glossy_pages, photoPages: r.photo_pages,
      })),
    });
  });

  // ── Reports ───────────────────────────────────────────────────────────────
  app.get("/api/reports", (req, res) => {
    const filter = String(req.query.filter ?? "month");
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    let from: string, to = today;
    if (filter === "today") { from = today; }
    else if (filter === "yesterday") {
      const y = new Date(now); y.setDate(y.getDate() - 1);
      from = to = y.toISOString().split("T")[0];
    } else if (filter === "week") {
      const w = new Date(now); w.setDate(w.getDate() - 7); from = w.toISOString().split("T")[0];
    } else if (filter === "year") { from = `${now.getFullYear()}-01-01`; }
    else if (filter === "custom" && req.query.dateFrom && req.query.dateTo) {
      from = String(req.query.dateFrom); to = String(req.query.dateTo);
    } else {
      from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    }
    const s = db.prepare(`
      SELECT COALESCE(SUM(amount),0) AS rev, COALESCE(SUM(pages),0) AS pages, COUNT(*) AS jobs,
        COALESCE(SUM(CASE WHEN print_type='BW' THEN pages ELSE 0 END),0) AS bw_pages,
        COALESCE(SUM(CASE WHEN print_type='Color' THEN pages ELSE 0 END),0) AS color_pages,
        COALESCE(SUM(CASE WHEN paper_type='Glossy' THEN pages ELSE 0 END),0) AS glossy_pages,
        COALESCE(SUM(CASE WHEN paper_type='Photo' THEN pages ELSE 0 END),0) AS photo_pages,
        COALESCE(SUM(CASE WHEN print_type='BW' THEN amount ELSE 0 END),0) AS bw_rev,
        COALESCE(SUM(CASE WHEN print_type='Color' THEN amount ELSE 0 END),0) AS color_rev,
        COALESCE(SUM(CASE WHEN paper_type='Glossy' THEN amount ELSE 0 END),0) AS glossy_rev,
        COALESCE(SUM(CASE WHEN paper_type='Photo' THEN amount ELSE 0 END),0) AS photo_rev
      FROM print_jobs WHERE print_date >= ? AND print_date <= ?`).get(from, to) as any;
    const topPrinter = (db.prepare(
      `SELECT printer_name FROM print_jobs WHERE print_date >= ? AND print_date <= ?
       GROUP BY printer_name ORDER BY SUM(amount) DESC LIMIT 1`).get(from, to) as any)?.printer_name ?? "—";
    const highestDay = (db.prepare(
      `SELECT print_date FROM print_jobs WHERE print_date >= ? AND print_date <= ?
       GROUP BY print_date ORDER BY SUM(amount) DESC LIMIT 1`).get(from, to) as any)?.print_date ?? "—";
    const jobs = db.prepare(
      `SELECT * FROM print_jobs WHERE print_date >= ? AND print_date <= ? ORDER BY print_date DESC LIMIT 500`).all(from, to) as any[];
    res.json({
      filter, dateFrom: from, dateTo: to,
      totalRevenue: s.rev, totalPages: s.pages,
      bwPages: s.bw_pages, colorPages: s.color_pages, glossyPages: s.glossy_pages, photoPages: s.photo_pages,
      bwRevenue: s.bw_rev, colorRevenue: s.color_rev, glossyRevenue: s.glossy_rev, photoRevenue: s.photo_rev,
      topPrinter, avgRevenuePerPrint: s.jobs > 0 ? Math.round((s.rev / s.jobs) * 100) / 100 : 0,
      highestRevenueDay: highestDay, jobs: jobs.map(mapJob),
    });
  });

  // ── Sync ──────────────────────────────────────────────────────────────────
  app.get("/api/sync/status", (_req, res) => {
    const state = db.prepare("SELECT * FROM sync_state WHERE id = 1").get() as any;
    const settings = getSettings();
    res.json({
      connected: false, autoSyncEnabled: Boolean(settings.auto_sync_enabled),
      lastSyncTime: state?.last_sync_time ?? null,
      recordsSynced: state?.records_synced ?? 0, syncInterval: settings.sync_interval,
    });
  });

  app.post("/api/sync/trigger", (_req, res) => {
    const count = (db.prepare("SELECT COUNT(*) AS cnt FROM print_jobs").get() as any).cnt;
    const now = new Date().toISOString();
    db.prepare("UPDATE sync_state SET last_sync_time = ?, records_synced = ? WHERE id = 1").run(now, count);
    res.json({ success: true, recordsSynced: count, syncTime: now, message: `Sync simulated. ${count} records ready. Connect a Google account to enable real sync.` });
  });

  return app;
}
