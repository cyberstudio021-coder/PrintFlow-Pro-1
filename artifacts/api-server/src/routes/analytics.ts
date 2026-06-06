import { Router } from "express";
import { db, printJobsTable } from "@workspace/db";
import { sql, and, gte, lte } from "drizzle-orm";
import { GetRevenueAnalyticsQueryParams } from "@workspace/api-zod";

const router = Router();

router.get("/analytics/revenue", async (req, res) => {
  const parsed = GetRevenueAnalyticsQueryParams.safeParse(req.query);
  const view = parsed.success ? (parsed.data.view ?? "monthly") : "monthly";
  const now = new Date();
  const year = (parsed.success && parsed.data.year) ? parsed.data.year : now.getFullYear();
  const month = (parsed.success && parsed.data.month) ? parsed.data.month : now.getMonth() + 1;

  let data: Array<{ label: string; bwAmount: number; colorAmount: number; glossyAmount: number; photoAmount: number; totalAmount: number }> = [];
  let dateFrom: string;
  let dateTo: string;

  if (view === "weekly") {
    // Last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().split("T")[0]);
    }
    dateFrom = days[0];
    dateTo = days[6];

    const rows = await db
      .select({
        day: sql<string>`print_date::text`,
        bwAmount: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'BW' THEN amount::numeric ELSE 0 END), 0)`,
        colorAmount: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'Color' THEN amount::numeric ELSE 0 END), 0)`,
        glossyAmount: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Glossy' THEN amount::numeric ELSE 0 END), 0)`,
        photoAmount: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Photo' THEN amount::numeric ELSE 0 END), 0)`,
      })
      .from(printJobsTable)
      .where(and(gte(printJobsTable.printDate, dateFrom), lte(printJobsTable.printDate, dateTo)))
      .groupBy(sql`print_date`)
      .orderBy(sql`print_date`);

    const rowMap = new Map(rows.map((r) => [r.day, r]));
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    data = days.map((d) => {
      const r = rowMap.get(d);
      const bwAmount = r ? Number(r.bwAmount) : 0;
      const colorAmount = r ? Number(r.colorAmount) : 0;
      const glossyAmount = r ? Number(r.glossyAmount) : 0;
      const photoAmount = r ? Number(r.photoAmount) : 0;
      return {
        label: dayNames[new Date(d + "T00:00:00").getDay()],
        bwAmount,
        colorAmount,
        glossyAmount,
        photoAmount,
        totalAmount: bwAmount + colorAmount + glossyAmount + photoAmount,
      };
    });
  } else if (view === "monthly") {
    // All months in a year
    dateFrom = `${year}-01-01`;
    dateTo = `${year}-12-31`;

    const rows = await db
      .select({
        mon: sql<number>`EXTRACT(MONTH FROM print_date::date)::int`,
        bwAmount: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'BW' THEN amount::numeric ELSE 0 END), 0)`,
        colorAmount: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'Color' THEN amount::numeric ELSE 0 END), 0)`,
        glossyAmount: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Glossy' THEN amount::numeric ELSE 0 END), 0)`,
        photoAmount: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Photo' THEN amount::numeric ELSE 0 END), 0)`,
      })
      .from(printJobsTable)
      .where(and(gte(printJobsTable.printDate, dateFrom), lte(printJobsTable.printDate, dateTo)))
      .groupBy(sql`EXTRACT(MONTH FROM print_date::date)`)
      .orderBy(sql`EXTRACT(MONTH FROM print_date::date)`);

    const rowMap = new Map(rows.map((r) => [r.mon, r]));
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    data = monthNames.map((label, i) => {
      const r = rowMap.get(i + 1);
      const bwAmount = r ? Number(r.bwAmount) : 0;
      const colorAmount = r ? Number(r.colorAmount) : 0;
      const glossyAmount = r ? Number(r.glossyAmount) : 0;
      const photoAmount = r ? Number(r.photoAmount) : 0;
      return { label, bwAmount, colorAmount, glossyAmount, photoAmount, totalAmount: bwAmount + colorAmount + glossyAmount + photoAmount };
    });
  } else {
    // yearly — last 5 years
    const startYear = year - 4;
    dateFrom = `${startYear}-01-01`;
    dateTo = `${year}-12-31`;

    const rows = await db
      .select({
        yr: sql<number>`EXTRACT(YEAR FROM print_date::date)::int`,
        bwAmount: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'BW' THEN amount::numeric ELSE 0 END), 0)`,
        colorAmount: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'Color' THEN amount::numeric ELSE 0 END), 0)`,
        glossyAmount: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Glossy' THEN amount::numeric ELSE 0 END), 0)`,
        photoAmount: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Photo' THEN amount::numeric ELSE 0 END), 0)`,
      })
      .from(printJobsTable)
      .where(and(gte(printJobsTable.printDate, dateFrom), lte(printJobsTable.printDate, dateTo)))
      .groupBy(sql`EXTRACT(YEAR FROM print_date::date)`)
      .orderBy(sql`EXTRACT(YEAR FROM print_date::date)`);

    const rowMap = new Map(rows.map((r) => [r.yr, r]));

    data = Array.from({ length: 5 }, (_, i) => {
      const yr = startYear + i;
      const r = rowMap.get(yr);
      const bwAmount = r ? Number(r.bwAmount) : 0;
      const colorAmount = r ? Number(r.colorAmount) : 0;
      const glossyAmount = r ? Number(r.glossyAmount) : 0;
      const photoAmount = r ? Number(r.photoAmount) : 0;
      return { label: String(yr), bwAmount, colorAmount, glossyAmount, photoAmount, totalAmount: bwAmount + colorAmount + glossyAmount + photoAmount };
    });
  }

  const totalRevenue = data.reduce((s, d) => s + d.totalAmount, 0);
  const totalPages = 0; // Derived on frontend

  res.json({ view, totalRevenue, totalPages, data });
});

router.get("/analytics/printers", async (_req, res) => {
  const rows = await db
    .select({
      printerName: printJobsTable.printerName,
      totalPages: sql<number>`COALESCE(SUM(pages), 0)`,
      totalJobs: sql<number>`COUNT(*)::int`,
      totalRevenue: sql<number>`COALESCE(SUM(amount::numeric), 0)`,
      bwPages: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'BW' THEN pages ELSE 0 END), 0)`,
      colorPages: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'Color' THEN pages ELSE 0 END), 0)`,
      glossyPages: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Glossy' THEN pages ELSE 0 END), 0)`,
      photoPages: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Photo' THEN pages ELSE 0 END), 0)`,
    })
    .from(printJobsTable)
    .groupBy(printJobsTable.printerName)
    .orderBy(sql`SUM(amount::numeric) DESC`);

  res.json({
    printers: rows.map((r) => ({
      printerName: r.printerName,
      totalPages: Number(r.totalPages),
      totalJobs: Number(r.totalJobs),
      totalRevenue: Number(r.totalRevenue),
      bwPages: Number(r.bwPages),
      colorPages: Number(r.colorPages),
      glossyPages: Number(r.glossyPages),
      photoPages: Number(r.photoPages),
    })),
  });
});

export default router;
