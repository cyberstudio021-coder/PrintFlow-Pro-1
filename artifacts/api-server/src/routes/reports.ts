import { Router } from "express";
import { db, printJobsTable } from "@workspace/db";
import { sql, and, gte, lte, desc } from "drizzle-orm";
import { GetReportQueryParams } from "@workspace/api-zod";

const router = Router();

function getFilterDates(filter: string, dateFrom?: string, dateTo?: string) {
  const now = new Date();
  const today = now.toISOString().split("T")[0];

  if (filter === "today") return { from: today, to: today };
  if (filter === "yesterday") {
    const y = new Date(now);
    y.setDate(y.getDate() - 1);
    const yd = y.toISOString().split("T")[0];
    return { from: yd, to: yd };
  }
  if (filter === "week") {
    const w = new Date(now);
    w.setDate(w.getDate() - 7);
    return { from: w.toISOString().split("T")[0], to: today };
  }
  if (filter === "year") {
    return { from: `${now.getFullYear()}-01-01`, to: today };
  }
  if (filter === "custom" && dateFrom && dateTo) {
    return { from: dateFrom, to: dateTo };
  }
  // month (default)
  return {
    from: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
    to: today,
  };
}

router.get("/reports", async (req, res) => {
  const parsed = GetReportQueryParams.safeParse(req.query);
  const filter = parsed.success ? (parsed.data.filter ?? "month") : "month";
  const { from, to } = getFilterDates(
    filter,
    parsed.success ? parsed.data.dateFrom : undefined,
    parsed.success ? parsed.data.dateTo : undefined,
  );

  const where = and(gte(printJobsTable.printDate, from), lte(printJobsTable.printDate, to));

  const [summary, jobs, printerRows, dailyRows] = await Promise.all([
    db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(amount::numeric), 0)`,
        totalPages: sql<number>`COALESCE(SUM(pages), 0)`,
        totalJobs: sql<number>`COUNT(*)::int`,
        bwPages: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'BW' THEN pages ELSE 0 END), 0)`,
        colorPages: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'Color' THEN pages ELSE 0 END), 0)`,
        glossyPages: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Glossy' THEN pages ELSE 0 END), 0)`,
        photoPages: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Photo' THEN pages ELSE 0 END), 0)`,
        bwRevenue: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'BW' THEN amount::numeric ELSE 0 END), 0)`,
        colorRevenue: sql<number>`COALESCE(SUM(CASE WHEN print_type = 'Color' THEN amount::numeric ELSE 0 END), 0)`,
        glossyRevenue: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Glossy' THEN amount::numeric ELSE 0 END), 0)`,
        photoRevenue: sql<number>`COALESCE(SUM(CASE WHEN paper_type = 'Photo' THEN amount::numeric ELSE 0 END), 0)`,
      })
      .from(printJobsTable)
      .where(where),
    db.select().from(printJobsTable).where(where).orderBy(desc(printJobsTable.printDate)).limit(500),
    db
      .select({
        printerName: printJobsTable.printerName,
        revenue: sql<number>`COALESCE(SUM(amount::numeric), 0)`,
      })
      .from(printJobsTable)
      .where(where)
      .groupBy(printJobsTable.printerName)
      .orderBy(sql`SUM(amount::numeric) DESC`)
      .limit(1),
    db
      .select({
        day: sql<string>`print_date::text`,
        revenue: sql<number>`COALESCE(SUM(amount::numeric), 0)`,
      })
      .from(printJobsTable)
      .where(where)
      .groupBy(sql`print_date`)
      .orderBy(sql`SUM(amount::numeric) DESC`)
      .limit(1),
  ]);

  const s = summary[0];
  const totalJobs = Number(s.totalJobs);
  const avgRevenuePerPrint = totalJobs > 0 ? Number(s.totalRevenue) / totalJobs : 0;

  res.json({
    filter,
    dateFrom: from,
    dateTo: to,
    totalRevenue: Number(s.totalRevenue),
    totalPages: Number(s.totalPages),
    bwPages: Number(s.bwPages),
    colorPages: Number(s.colorPages),
    glossyPages: Number(s.glossyPages),
    photoPages: Number(s.photoPages),
    bwRevenue: Number(s.bwRevenue),
    colorRevenue: Number(s.colorRevenue),
    glossyRevenue: Number(s.glossyRevenue),
    photoRevenue: Number(s.photoRevenue),
    topPrinter: printerRows[0]?.printerName ?? "—",
    avgRevenuePerPrint: Math.round(avgRevenuePerPrint * 100) / 100,
    highestRevenueDay: dailyRows[0]?.day ?? "—",
    jobs: jobs.map((j) => ({
      ...j,
      createdAt: j.createdAt.toISOString(),
      rate: parseFloat(j.rate),
      amount: parseFloat(j.amount),
    })),
  });
});

export default router;
