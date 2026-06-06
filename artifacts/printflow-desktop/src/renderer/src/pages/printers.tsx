import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Printer } from "lucide-react";

const fmt = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

export default function Printers() {
  const { data } = useQuery({ queryKey: ["printers"], queryFn: api.getPrinterAnalytics });
  const printers = data?.printers ?? [];

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Printers</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Per-printer performance and revenue statistics</p>
      </div>

      {printers.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <Printer className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No printer data yet. Print jobs will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {printers.map((p) => {
            const total = p.bwPages + p.colorPages + p.glossyPages + p.photoPages;
            const pct = (n: number) => total === 0 ? 0 : Math.round((n / total) * 100);
            return (
              <div key={p.printerName} className="card space-y-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Printer className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold">{p.printerName}</div>
                      <div className="text-xs text-muted-foreground">{p.totalJobs} jobs total</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">{fmt(p.totalRevenue)}</div>
                    <div className="text-xs text-muted-foreground">{p.totalPages.toLocaleString()} pages</div>
                  </div>
                </div>

                {/* Progress bars */}
                <div className="space-y-2.5">
                  {[
                    { label: "B&W", pages: p.bwPages, color: "#3b82f6" },
                    { label: "Color", pages: p.colorPages, color: "#a855f7" },
                    { label: "Glossy", pages: p.glossyPages, color: "#B4FF39" },
                    { label: "Photo", pages: p.photoPages, color: "#f97316" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{row.label}</span>
                        <span>{pct(row.pages)}% · {row.pages} pgs</span>
                      </div>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${pct(row.pages)}%`, background: row.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
