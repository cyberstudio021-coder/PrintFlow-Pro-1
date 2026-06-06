const PORT = 51247;
export const BASE = `http://127.0.0.1:${PORT}/api`;

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PrintJob {
  id: number; createdAt: string; printDate: string; printTime: string;
  printerName: string; pages: number; printType: string;
  paperSize: string; paperType: string; rate: number; amount: number;
}
export interface Settings {
  id: number; bwA4Price: number; bwA3Price: number; colorA4Price: number;
  colorA3Price: number; glossyPrice: number; photoPrice: number;
  autoSyncEnabled: boolean; syncInterval: number;
}
export interface DashboardStats {
  totalRevenue: number; totalPages: number; totalJobs: number; glossyRevenue: number;
  revenueGrowth: number; pagesGrowth: number; jobsGrowth: number; glossyGrowth: number;
}
export interface DailySummary {
  date: string; bwPages: number; colorPages: number; glossyPages: number; photoPages: number;
  totalPages: number; bwAmount: number; colorAmount: number; glossyAmount: number;
  photoAmount: number; totalAmount: number;
}
export interface PrintDistribution {
  bwPercent: number; colorPercent: number; glossyPercent: number; photoPercent: number;
  bwPages: number; colorPages: number; glossyPages: number; photoPages: number;
}
export interface RevenuePoint {
  label: string; bwAmount: number; colorAmount: number;
  glossyAmount: number; photoAmount: number; totalAmount: number;
}
export interface RevenueAnalytics { view: string; totalRevenue: number; totalPages: number; data: RevenuePoint[]; }
export interface PrinterAnalytics {
  printerName: string; totalPages: number; totalJobs: number; totalRevenue: number;
  bwPages: number; colorPages: number; glossyPages: number; photoPages: number;
}
export interface Report {
  filter: string; dateFrom: string; dateTo: string; totalRevenue: number;
  totalPages: number; bwPages: number; colorPages: number; glossyPages: number; photoPages: number;
  bwRevenue: number; colorRevenue: number; glossyRevenue: number; photoRevenue: number;
  topPrinter: string; avgRevenuePerPrint: number; highestRevenueDay: string; jobs: PrintJob[];
}
export interface SyncStatus {
  connected: boolean; autoSyncEnabled: boolean; lastSyncTime: string | null;
  recordsSynced: number; syncInterval: number;
}

// ─── API calls ───────────────────────────────────────────────────────────────

export const api = {
  getSettings: () => req<Settings>("/settings"),
  updateSettings: (data: Partial<Settings>) => req<Settings>("/settings", { method: "PUT", body: JSON.stringify(data) }),

  listPrintJobs: (params?: Record<string, string | number>) => {
    const qs = params ? "?" + new URLSearchParams(params as any).toString() : "";
    return req<{ jobs: PrintJob[]; total: number }>(`/print-jobs${qs}`);
  },
  createPrintJob: (data: { printerName: string; pages: number; printType: string; paperSize: string; paperType: string }) =>
    req<PrintJob>("/print-jobs", { method: "POST", body: JSON.stringify(data) }),
  deletePrintJob: (id: number) => req<{ success: boolean }>(`/print-jobs/${id}`, { method: "DELETE" }),

  getDashboardStats: (period = "today") => req<DashboardStats>(`/dashboard/stats?period=${period}`),
  getDailySummary: () => req<DailySummary>("/dashboard/daily-summary"),
  getRecentActivity: () => req<{ jobs: PrintJob[]; total: number }>("/dashboard/recent-activity"),
  getPrintDistribution: (period = "today") => req<PrintDistribution>(`/dashboard/print-distribution?period=${period}`),

  getRevenueAnalytics: (view = "monthly", year?: number) => {
    const qs = year ? `?view=${view}&year=${year}` : `?view=${view}`;
    return req<RevenueAnalytics>(`/analytics/revenue${qs}`);
  },
  getPrinterAnalytics: () => req<{ printers: PrinterAnalytics[] }>("/analytics/printers"),

  getReport: (filter = "month", dateFrom?: string, dateTo?: string) => {
    let qs = `?filter=${filter}`;
    if (dateFrom) qs += `&dateFrom=${dateFrom}`;
    if (dateTo) qs += `&dateTo=${dateTo}`;
    return req<Report>(`/reports${qs}`);
  },

  getSyncStatus: () => req<SyncStatus>("/sync/status"),
  triggerSync: () => req<{ success: boolean; recordsSynced: number; syncTime: string; message: string }>(
    "/sync/trigger", { method: "POST", body: JSON.stringify({}) }
  ),
};
