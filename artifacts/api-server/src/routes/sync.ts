import { Router } from "express";
import { db, printJobsTable, settingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import { TriggerSyncBody } from "@workspace/api-zod";

const router = Router();

// In-memory sync state (would be persisted to DB in production)
let lastSyncTime: string | null = null;
let recordsSynced = 0;

router.get("/sync/status", async (_req, res) => {
  const settingsRows = await db.select().from(settingsTable).limit(1);
  const settings = settingsRows[0];

  res.json({
    connected: false, // Google OAuth not configured
    autoSyncEnabled: settings?.autoSyncEnabled ?? false,
    lastSyncTime,
    recordsSynced,
    syncInterval: settings?.syncInterval ?? 60,
  });
});

router.post("/sync/trigger", async (req, res) => {
  const parsed = TriggerSyncBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  // Count total records
  const countResult = await db
    .select({ count: sql<number>`COUNT(*)::int` })
    .from(printJobsTable);

  const count = Number(countResult[0]?.count ?? 0);

  // Simulate sync (Google Sheets OAuth not configured — would require real auth)
  lastSyncTime = new Date().toISOString();
  recordsSynced = count;

  res.json({
    success: true,
    recordsSynced: count,
    syncTime: lastSyncTime,
    message: `Synced ${count} records. Note: Connect a Google account in Settings to enable real sync.`,
  });
});

export default router;
