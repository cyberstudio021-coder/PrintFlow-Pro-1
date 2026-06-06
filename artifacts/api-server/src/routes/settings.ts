import { Router } from "express";
import { db, settingsTable } from "@workspace/db";
import { UpdateSettingsBody } from "@workspace/api-zod";

const router = Router();

router.get("/settings", async (_req, res) => {
  const rows = await db.select().from(settingsTable).limit(1);
  if (rows.length === 0) {
    // Return defaults if no settings exist yet
    const [created] = await db.insert(settingsTable).values({}).returning();
    res.json({
      ...created,
      bwA4Price: parseFloat(created.bwA4Price),
      bwA3Price: parseFloat(created.bwA3Price),
      colorA4Price: parseFloat(created.colorA4Price),
      colorA3Price: parseFloat(created.colorA3Price),
      glossyPrice: parseFloat(created.glossyPrice),
      photoPrice: parseFloat(created.photoPrice),
    });
    return;
  }
  const s = rows[0];
  res.json({
    ...s,
    bwA4Price: parseFloat(s.bwA4Price),
    bwA3Price: parseFloat(s.bwA3Price),
    colorA4Price: parseFloat(s.colorA4Price),
    colorA3Price: parseFloat(s.colorA3Price),
    glossyPrice: parseFloat(s.glossyPrice),
    photoPrice: parseFloat(s.photoPrice),
  });
});

router.put("/settings", async (req, res) => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid body" });
    return;
  }

  const rows = await db.select().from(settingsTable).limit(1);
  const updates: Record<string, unknown> = {};

  if (parsed.data.bwA4Price !== undefined) updates.bwA4Price = parsed.data.bwA4Price.toString();
  if (parsed.data.bwA3Price !== undefined) updates.bwA3Price = parsed.data.bwA3Price.toString();
  if (parsed.data.colorA4Price !== undefined) updates.colorA4Price = parsed.data.colorA4Price.toString();
  if (parsed.data.colorA3Price !== undefined) updates.colorA3Price = parsed.data.colorA3Price.toString();
  if (parsed.data.glossyPrice !== undefined) updates.glossyPrice = parsed.data.glossyPrice.toString();
  if (parsed.data.photoPrice !== undefined) updates.photoPrice = parsed.data.photoPrice.toString();
  if (parsed.data.autoSyncEnabled !== undefined) updates.autoSyncEnabled = parsed.data.autoSyncEnabled;
  if (parsed.data.syncInterval !== undefined) updates.syncInterval = parsed.data.syncInterval;

  let result;
  if (rows.length === 0) {
    const [created] = await db.insert(settingsTable).values(updates).returning();
    result = created;
  } else {
    const { eq } = await import("drizzle-orm");
    const [updated] = await db
      .update(settingsTable)
      .set(updates)
      .where(eq(settingsTable.id, rows[0].id))
      .returning();
    result = updated;
  }

  res.json({
    ...result,
    bwA4Price: parseFloat(result.bwA4Price),
    bwA3Price: parseFloat(result.bwA3Price),
    colorA4Price: parseFloat(result.colorA4Price),
    colorA3Price: parseFloat(result.colorA3Price),
    glossyPrice: parseFloat(result.glossyPrice),
    photoPrice: parseFloat(result.photoPrice),
  });
});

export default router;
