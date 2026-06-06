import { pgTable, serial, text, integer, numeric, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const printJobsTable = pgTable("print_jobs", {
  id: serial("id").primaryKey(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  printDate: date("print_date").notNull(),
  printTime: text("print_time").notNull(),
  printerName: text("printer_name").notNull(),
  pages: integer("pages").notNull(),
  printType: text("print_type").notNull(), // BW | Color | Glossy | Photo
  paperSize: text("paper_size").notNull(), // A4 | A3
  paperType: text("paper_type").notNull(), // Plain | Glossy | Photo
  rate: numeric("rate", { precision: 10, scale: 2 }).notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
});

export const insertPrintJobSchema = createInsertSchema(printJobsTable).omit({ id: true, createdAt: true });
export type InsertPrintJob = z.infer<typeof insertPrintJobSchema>;
export type PrintJob = typeof printJobsTable.$inferSelect;
