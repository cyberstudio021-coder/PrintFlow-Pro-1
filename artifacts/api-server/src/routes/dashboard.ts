import { Router } from "express";
import { db, printJobsTable } from "@workspace/db";
import { gte, lte, sql, and } from "drizzle-orm";
import { GetDashboardStatsQueryParams, GetPrintDistributionQueryParams } from "@workspace/api-zod";

const router = Router();

function getPeriodDates(period: string) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  let from: string;
  let prevFrom: string;
  let prevTo: string;

  if (period === "today") {
    from = today;
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    prevFrom = yesterday.toISOString().split("T")[0];
    prevTo = prevFrom;
  } else if (period === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    from = weekAgo.toISOString().split("T")[0];
    const prevWeekStart = new Date(weekAgo);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    prevFrom = prevWeekStart.toISOString().split("T")[0];
    prevTo = weekAgo.toISOString().split("T")[0];
  } else if (period === "year") {
    from = `${now.getFullYear()}-01-01`;
    prevFrom = `${now.getFullYear() - 1}-01-01`;
    prevTo = `${now.getFullYear() - 1}-12-31`;
  } else {
    // month
    from = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    prevFrom = prevMonth.toISOString().split("T")[0];
    prevTo = prevMonthEnd.toISOString().split("T")[0];
  }

  return { from, to: today, prevFrom, prevTo };
}

router.get("/dashboard/stats", async (req, res) => {
  const parsed = GetDashboardStatsQueryParams.safeParse(req.query);
  const period = parsed.success ? (parsed.data.period ?? "month") : "month";
  const { from, to, prevFrom, prevTo } = getPeriodDates(period);

  const [current, previous] = await Promise.all([
    db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(amount::numeric), 0)`,
        totalPages: sql<number>`COALESCE(SUM(pages), 0)`,
        totalJobs: sql<number>`COUNT(*)::int`,
        glossyRevenue: sql<number>`COALESCE(SUM(CASE WHEN paper_type IN ('Glossy', 'Photo') THEN amount::numeric ELSE 0 END), 0)`,
      })
      .from(printJobsTable)
      .where(and(gte(printJobsTable.printDate, from), lte(printJobsTable.printDate, to))),
    db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(amount::numeric), 0)`,
        totalPages: sql<number>`COALESCE(SUM(pages), 0)`,
        totalJobs: sql<number>`COUNT(*)::int`,
        glossyRevenue: sql<number>`COALESCE(SUM(CASE WHEN paper_type IN ('Glossy', 'Photo') THEN amount::numeric ELSE 0 END), 0)`,
      })
      .from(printJobsTable)
      .where(and(gte(printJobsTable.printDate, prevFrom), lte(printJobsTable.printDate, prevTo))),
  ]);

  const c = current[0];
  const p = previous[0];

  function growth(curr: number, prev: number) {
    if (!prev || prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  }

  res.json({
    totalRevenue: Number(c.totalRevenue),
    totalPages: Number(c.totalPages),
    totalJobs: Number(c.totalJobs),
    glossyRevenue: Number(c.glossyRevenue),
    revenueGrowth: growth(Number(c.totalRevenue), Number(p.totalRevenue)),
    pagesGrowth: growth(Number(c.totalPages), Number(p.totalPages)),
    jobsGrowth: growth(Number(c.totalJobs), Number(p.totalJobs)),
    glossyGrowth: growth(Number(c.glossyRevenue), Number(p.glossyRevenue)),
  });
});

router.get("/dashboard/daily-summary", async (_req, res) => {
  const today = new Date().toISOString().split("T")[0];

  const rows = await db
    .select({
      bwPages: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'BW' THEN pages ELSE 0 END), 0)`,
      colorPages: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'Color' THEN pages ELSE 0 END), 0)`,
      glossyPages: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Glossy' THEN pages ELSE 0 END), 0)`,
      photoPages: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Photo' THEN pages ELSE 0 END), 0)`,
      totalPages: sql<number>`COALESCE(SUM(pages), 0)`,
      bwAmount: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'BW' THEN amount::numeric ELSE 0 END), 0)`,
      colorAmount: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'Color' THEN amount::numeric ELSE 0 END), 0)`,
      glossyAmount: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Glossy' THEN amount::numeric ELSE 0 END), 0)`,
      photoAmount: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Photo' THEN amount::numeric ELSE 0 END), 0)`,
      totalAmount: sql<number>`COALESCE(SUM(amount::numeric), 0)`,
    })
    .from(printJobsTable)
    .where(and(gte(printJobsTable.printDate, today), lte(printJobsTable.printDate, today)));

  const r = rows[0];
  res.json({
    date: today,
    bwPages: Number(r.bwPages),
    colorPages: Number(r.colorPages),
    glossyPages: Number(r.glossyPages),
    photoPages: Number(r.photoPages),
    totalPages: Number(r.totalPages),
    bwAmount: Number(r.bwAmount),
    colorAmount: Number(r.colorAmount),
    glossyAmount: Number(r.glossyAmount),
    photoAmount: Number(r.photoAmount),
    totalAmount: Number(r.totalAmount),
  });
});

router.get("/dashboard/recent-activity", async (_req, res) => {
  const jobs = await db
    .select()
    .from(printJobsTable)
    .orderBy(sql`created_at DESC`)
    .limit(20);

  const mapped = jobs.map((j) => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
    rate: parseFloat(j.rate),
    amount: parseFloat(j.amount),
  }));

  res.json({ jobs: mapped, total: mapped.length });
});

router.get("/dashboard/print-distribution", async (req, res) => {
  const parsed = GetPrintDistributionQueryParams.safeParse(req.query);
  const period = parsed.success ? (parsed.data.period ?? "month") : "month";
  const { from, to } = getPeriodDates(period);

  const rows = await db
    .select({
      bwPages: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'BW' THEN pages ELSE 0 END), 0)`,
      colorPages: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'Color' THEN pages ELSE 0 END), 0)`,
      glossyPages: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Glossy' THEN pages ELSE 0 END), 0)`,
      photoPages: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Photo' THEN pages ELSE 0 END), 0)`,
    })
    .from(printJobsTable)
    .where(and(gte(printJobsTable.printDate, from), lte(printJobsTable.printDate, to)));

  const r = rows[0];
  const bwPages = Number(r.bwPages);
  const colorPages = Number(r.colorPages);
  const glossyPages = Number(r.glossyPages);
  const photoPages = Number(r.photoPages);
  const total = bwPages + colorPages + glossyPages + photoPages;

  function pct(n: number) {
    return total === 0 ? 0 : Math.round((n / total) * 100);
  }

  res.json({
    bwPercent: pct(bwPages),
    colorPercent: pct(colorPages),
    glossyPercent: pct(glossyPages),
    photoPercent: pct(photoPages),
    bwPages,
    colorPages,
    glossyPages,
    photoPages,
  });
});

export default router;
