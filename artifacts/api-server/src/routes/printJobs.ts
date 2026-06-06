import { Router } from "express";
import { db, printJobsTable, settingsTable } from "@workspace/db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";
import {
  ListPrintJobsQueryParams,
  CreatePrintJobBody,
  DeletePrintJobParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/print-jobs", async (req, res) => {
  const parsed = ListPrintJobsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid query params" });
    return;
  }
  const { limit = 50, offset = 0, dateFrom, dateTo, printType, paperType } = parsed.data;

  const conditions = [];
  if (dateFrom) conditions.push(gte(printJobsTable.printDate, dateFrom));
  if (dateTo) conditions.push(lte(printJobsTable.printDate, dateTo));
  if (printType) conditions.push(eq(printJobsTable.printType, printType));
  if (paperType) conditions.push(eq(printJobsTable.paperType, paperType));

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [jobs, countResult] = await Promise.all([
    db
      .select()
      .from(printJobsTable)
      .where(where)
      .orderBy(desc(printJobsTable.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(printJobsTable)
      .where(where),
  ]);

  const total = countResult[0]?.count ?? 0;
  const mapped = jobs.map((j) => ({
    ...j,
    createdAt: j.createdAt.toISOString(),
    rate: parseFloat(j.rate),
    amount: parseFloat(j.amount),
  }));

  res.json({ jobs: mapped, total });
});

router.post("/print-jobs", async (req, res) => {
  const parsed = CreatePrintJobBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  // Get current settings to calculate rate and amount
  const settingsRows = await db.select().from(settingsTable).limit(1);
  const settings = settingsRows[0];

  const { printerName, pages, printType, paperSize, paperType } = parsed.data;

  let rate = 2;
  if (settings) {
    if (paperType === "Glossy") rate = parseFloat(settings.glossyPrice);
    else if (paperType === "Photo") rate = parseFloat(settings.photoPrice);
    else if (printType === "Color") {
      rate = paperSize === "A3" ? parseFloat(settings.colorA3Price) : parseFloat(settings.colorA4Price);
    } else {
      rate = paperSize === "A3" ? parseFloat(settings.bwA3Price) : parseFloat(settings.bwA4Price);
    }
  }

  const amount = rate * pages;
  const now = new Date();
  const printDate = now.toISOString().split("T")[0];
  const printTime = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

  const [inserted] = await db
    .insert(printJobsTable)
    .values({
      printDate,
      printTime,
      printerName,
      pages,
      printType,
      paperSize,
      paperType,
      rate: rate.toString(),
      amount: amount.toString(),
    })
    .returning();

  res.status(201).json({
    ...inserted,
    createdAt: inserted.createdAt.toISOString(),
    rate: parseFloat(inserted.rate),
    amount: parseFloat(inserted.amount),
  });
});

router.delete("/print-jobs/:id", async (req, res) => {
  const parsed = DeletePrintJobParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid params" });
    return;
  }
  await db.delete(printJobsTable).where(eq(printJobsTable.id, parsed.data.id));
  res.json({ success: true });
});

export default router;
