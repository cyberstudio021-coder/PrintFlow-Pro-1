import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Download, FileText } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

const FILTERS = [
  { id: "today", label: "Today" },
  { id: "yesterday", label: "Yesterday" },
  { id: "week", label: "This Week" },
  { id: "month", label: "This Month" },
  { id: "year", label: "This Year" },
  { id: "custom", label: "Custom" },
] as const;

type FilterId = typeof FILTERS[number]["id"];

export default function Reports() {
  const [filter, setFilter] = useState<FilterId>("month");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data } = useQuery({
    queryKey: ["report", filter, dateFrom, dateTo],
    queryFn: () => api.getReport(filter, dateFrom || undefined, dateTo || undefined),
  });

  function exportCSV() {
    if (!data?.jobs.length) return;
    const header = ["Date", "Time", "Printer", "Pages", "Print Type", "Paper Type", "Paper Size", "Rate", "Amount"];
    const rows = data.jobs.map((j) => [j.printDate, j.printTime, j.printerName, j.pages, j.printType, j.paperType, j.paperSize, j.rate, j.amount]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `printflow-report-${filter}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Filtered revenue and print reports</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl border text-sm text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button key={f.id} onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-colors ${filter === f.id ? "bg-primary text-primary-foreground" : "border text-muted-foreground hover:text-foreground hover:bg-white/5"}`}
            style={filter !== f.id ? { borderColor: "rgba(255,255,255,0.1)" } : {}}>
            {f.label}
          </button>
        ))}
        {filter === "custom" && (
          <div className="flex items-center gap-2 ml-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-sm bg-card border text-foreground outline-none focus:ring-1 focus:ring-primary" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
            <span className="text-muted-foreground">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-sm bg-card border text-foreground outline-none focus:ring-1 focus:ring-primary" style={{ borderColor: "rgba(255,255,255,0.1)" }} />
          </div>
        )}
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Revenue", value: fmt(data?.totalRevenue ?? 0) },
          { label: "Total Pages", value: (data?.totalPages ?? 0).toLocaleString() },
          { label: "Top Printer", value: data?.topPrinter ?? "—" },
          { label: "Avg Per Job", value: fmt(data?.avgRevenuePerPrint ?? 0) },
        ].map((m) => (
          <div key={m.label} className="card">
            <div className="text-xs text-muted-foreground">{m.label}</div>
            <div className="text-lg font-bold mt-2 truncate">{m.value}</div>
          </div>
        ))}
      </div>

      {/* Revenue breakdown */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: "B&W Revenue", value: fmt(data?.bwRevenue ?? 0), pages: data?.bwPages ?? 0, color: "#3b82f6" },
          { label: "Color Revenue", value: fmt(data?.colorRevenue ?? 0), pages: data?.colorPages ?? 0, color: "#a855f7" },
          { label: "Glossy Revenue", value: fmt(data?.glossyRevenue ?? 0), pages: data?.glossyPages ?? 0, color: "#B4FF39" },
          { label: "Photo Revenue", value: fmt(data?.photoRevenue ?? 0), pages: data?.photoPages ?? 0, color: "#f97316" },
        ].map((c) => (
          <div key={c.label} className="card-sm">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <div className="font-bold" style={{ color: c.color }}>{c.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.pages} pages</div>
          </div>
        ))}
      </div>

      {/* Jobs table */}
      <div className="card" style={{ padding: 0 }}>
        <div className="px-6 py-4 border-b flex items-center gap-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <FileText className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Print Jobs ({data?.jobs?.length ?? 0})</h2>
        </div>
        <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                {["Date", "Time", "Printer", "Type", "Pages", "Rate", "Amount"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.jobs ?? []).map((j) => (
                <tr key={j.id} className="border-b hover:bg-white/[0.02] transition-colors" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                  <td className="px-6 py-2.5 text-xs text-muted-foreground">{j.printDate}</td>
                  <td className="px-6 py-2.5 text-xs font-mono text-muted-foreground">{j.printTime}</td>
                  <td className="px-6 py-2.5 text-xs">{j.printerName}</td>
                  <td className="px-6 py-2.5 text-xs">{j.printType} / {j.paperType} / {j.paperSize}</td>
                  <td className="px-6 py-2.5 text-xs">{j.pages}</td>
                  <td className="px-6 py-2.5 text-xs text-muted-foreground">₹{j.rate}</td>
                  <td className="px-6 py-2.5 text-xs font-semibold text-primary">₹{j.amount}</td>
                </tr>
              ))}
              {!data?.jobs?.length && (
                <tr><td colSpan={7} className="px-6 py-8 text-center text-xs text-muted-foreground">No records for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
