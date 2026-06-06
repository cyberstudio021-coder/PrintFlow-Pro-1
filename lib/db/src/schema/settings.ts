import { pgTable, serial, numeric, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const settingsTable = pgTable("settings", {
  id: serial("id").primaryKey(),
  bwA4Price: numeric("bw_a4_price", { precision: 10, scale: 2 }).notNull().default("2"),
  bwA3Price: numeric("bw_a3_price", { precision: 10, scale: 2 }).notNull().default("4"),
  colorA4Price: numeric("color_a4_price", { precision: 10, scale: 2 }).notNull().default("10"),
  colorA3Price: numeric("color_a3_price", { precision: 10, scale: 2 }).notNull().default("20"),
  glossyPrice: numeric("glossy_price", { precision: 10, scale: 2 }).notNull().default("25"),
  photoPrice: numeric("photo_price", { precision: 10, scale: 2 }).notNull().default("30"),
  autoSyncEnabled: boolean("auto_sync_enabled").notNull().default(false),
  syncInterval: integer("sync_interval").notNull().default(60),
});

export const insertSettingsSchema = createInsertSchema(settingsTable).omit({ id: true });
export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settingsTable.$inferSelect;
